import { useCallback, useEffect, useRef, useState } from 'react';
import { postGenerateScript, getJobStatus } from '@/services/generateApi';
import type { StoryStyle } from '@/types/generate';

type GenerateScriptState =
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'polling'; jobId: string; attempts: number }
    | { phase: 'completed'; script: string }
    | { phase: 'error'; message: string };

export type UseGenerateScriptReturn = {
    state: GenerateScriptState;
    generate: (story: string, style: StoryStyle) => void;
    reset: () => void;
};

const ERROR_MAP: Record<number, string> = {
    400: 'Revisá el texto o el estilo seleccionado.',
    401: 'Tu sesión expiró. Volvé a iniciar sesión.',
    429: 'Límite alcanzado. Intentá en un minuto.',
};

const NETWORK_ERROR = 'Error de conexión. Revisá tu internet.';
const TIMEOUT_ERROR = 'La generación tardó demasiado. Intentá de nuevo.';
const MAX_ATTEMPTS = 100;
const POLL_INTERVAL_MS = 3000;

function mapApiError(err: unknown): string {
    if (err && typeof err === 'object' && 'status' in err) {
        const { status } = err as { status: number };
        return ERROR_MAP[status] ?? NETWORK_ERROR;
    }
    return NETWORK_ERROR;
}

export function useGenerateScript(token: string): UseGenerateScriptReturn {
    const [state, setState] = useState<GenerateScriptState>({ phase: 'idle' });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const attemptsRef = useRef(0);

    const clearPolling = useCallback(() => {
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
                        setState({ phase: 'completed', script: job.script ?? '' });
                    } else if (job.status === 'failed') {
                        clearPolling();
                        setState({
                            phase: 'error',
                            message: job.message ?? 'No se pudo generar el guión.',
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
        async (story: string, style: StoryStyle) => {
            setState({ phase: 'submitting' });
            try {
                const { jobId } = await postGenerateScript({ story, style }, token);
                setState({ phase: 'polling', jobId, attempts: 0 });
                startPolling(jobId);
            } catch (err) {
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
