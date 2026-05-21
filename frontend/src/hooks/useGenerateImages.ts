import { useCallback, useEffect, useRef, useState } from 'react';
import { postGenerateImages, getJobStatus } from '@/services/generateApi';
import type { StoryStyle, GenerateImagesState, ImageGenerationResult } from '@/types/generate';

export type UseGenerateImagesReturn = {
    state: GenerateImagesState;
    generate: (scriptId: string, style: StoryStyle) => void;
    reset: () => void;
};

const ERROR_MAP: Record<number, string> = {
    401: 'Tu sesión expiró. Volvé a iniciar sesión.',
    429: 'Límite alcanzado. Intentá en un minuto.',
};

const NETWORK_ERROR = 'Error de conexión. Revisá tu internet.';
const TIMEOUT_ERROR = 'La generación de imágenes tardó demasiado. Intentá de nuevo.';
// 30 attempts × 3 s = 90 s timeout (Replicate can be slow)
const MAX_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 3000;

function mapApiError(err: unknown): string {
    if (err && typeof err === 'object' && 'status' in err) {
        const { status } = err as { status: number };
        return ERROR_MAP[status] ?? NETWORK_ERROR;
    }
    return NETWORK_ERROR;
}

export function useGenerateImages(token: string): UseGenerateImagesReturn {
    const [state, setState] = useState<GenerateImagesState>({ phase: 'idle' });
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
                        const result = job.result as ImageGenerationResult | undefined;
                        setState({ phase: 'completed', imageUrls: result?.imageUrls ?? [] });
                    } else if (job.status === 'failed') {
                        clearPolling();
                        setState({
                            phase: 'error',
                            message:
                                (typeof job.error === 'string' ? job.error : undefined) ??
                                job.message ??
                                'No se pudo generar las imágenes.',
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
        async (scriptId: string, style: StoryStyle) => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            setState({ phase: 'submitting' });
            try {
                const { jobId } = await postGenerateImages({ scriptId, style }, token);
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
