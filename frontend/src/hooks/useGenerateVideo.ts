import { useCallback, useEffect, useRef, useState } from 'react';
import { postGenerateVideo, getJobStatus } from '@/services/generateApi';
import type { GenerateVideoState, VideoAssemblyResult } from '@/types/generate';

export type UseGenerateVideoReturn = {
    state: GenerateVideoState;
    generate: (imageJobId: string, audioJobId: string, opts?: { fps?: number; bitrate?: string }) => void;
    reset: () => void;
};

const ERROR_MAP: Record<number, string> = {
    400: 'Las imágenes o el audio aún no están listos.',
    401: 'Tu sesión expiró. Volvé a iniciar sesión.',
    429: 'Límite alcanzado. Intentá en un minuto.',
};

const NETWORK_ERROR = 'Error de conexión. Revisá tu internet.';
const TIMEOUT_ERROR = 'El ensamblado tardó demasiado. Intentá de nuevo.';
// 80 attempts × 3 s = 240 s (4-minute timeout, matches backend SLA + buffer)
const MAX_ATTEMPTS = 80;
const POLL_INTERVAL_MS = 3000;

function mapApiError(err: unknown): string {
    if (err && typeof err === 'object' && 'status' in err) {
        const { status } = err as { status: number };
        return ERROR_MAP[status] ?? NETWORK_ERROR;
    }
    return NETWORK_ERROR;
}

export function useGenerateVideo(token: string): UseGenerateVideoReturn {
    const [state, setState] = useState<GenerateVideoState>({ phase: 'idle' });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const attemptsRef = useRef(0);
    const inFlightRef = useRef(false);

    const clearPolling = useCallback(() => {
        inFlightRef.current = false;
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => clearPolling, [clearPolling]);

    const startPolling = useCallback(
        (jobId: string) => {
            attemptsRef.current = 0;
            intervalRef.current = setInterval(async () => {
                attemptsRef.current += 1;
                if (attemptsRef.current > MAX_ATTEMPTS) {
                    clearPolling();
                    setState({ phase: 'error', message: TIMEOUT_ERROR });
                    return;
                }
                try {
                    const job = await getJobStatus(jobId, token);
                    if (job.status === 'completed') {
                        clearPolling();
                        const result = job.result as VideoAssemblyResult | undefined;
                        setState({
                            phase: 'completed',
                            videoUrl: result?.videoUrl ?? '',
                            duration: result?.duration ?? 0,
                            fileSize: result?.fileSize ?? 0,
                        });
                    } else if (job.status === 'failed') {
                        clearPolling();
                        setState({
                            phase: 'error',
                            message:
                                (typeof job.error === 'string' ? job.error : undefined) ??
                                job.message ??
                                'No se pudo ensamblar el video.',
                        });
                    }
                } catch (err) {
                    clearPolling();
                    setState({ phase: 'error', message: mapApiError(err) });
                }
            }, POLL_INTERVAL_MS);
        },
        [token, clearPolling],
    );

    const generate = useCallback(
        async (
            imageJobId: string,
            audioJobId: string,
            opts?: { fps?: number; bitrate?: string },
        ) => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            setState({ phase: 'submitting' });
            try {
                const { jobId } = await postGenerateVideo(
                    { imageJobId, audioJobId, ...opts },
                    token,
                );
                setState({ phase: 'polling', jobId });
                startPolling(jobId);
            } catch (err) {
                inFlightRef.current = false;
                setState({ phase: 'error', message: mapApiError(err) });
            }
        },
        [token, startPolling],
    );

    const reset = useCallback(() => {
        clearPolling();
        setState({ phase: 'idle' });
    }, [clearPolling]);

    return { state, generate, reset };
}
