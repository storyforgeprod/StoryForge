import { useCallback, useEffect, useRef, useState } from 'react';
import { postGenerateScript, getJobStatus } from '../api/generateApi';
import type { GenerateScriptState } from '../types';

export type UseGenerateScriptReturn = {
    state: GenerateScriptState;
    generate: (story: string, targetDuration?: number, targetScenes?: number, tone?: string) => void;
    reset: () => void;
};

const ERROR_MAP: Record<number, string> = {
    400: 'Revisá el texto ingresado.',
    401: 'Tu sesión expiró. Volvé a iniciar sesión.',
    429: 'Límite alcanzado. Intentá en un minuto.',
};

const NETWORK_ERROR = 'Error de conexión. Revisá tu internet.';
const TIMEOUT_ERROR = 'La generación tardó demasiado. Intentá de nuevo.';
const MAX_ATTEMPTS = 400; // 400 × 5s = 2000s ≈ 33 min
const POLL_INTERVAL_MS = 5000;
const TEMP_ERROR_CODES = new Set([502, 503, 504]);

function mapApiError(err: unknown): string {
    if (err && typeof err === 'object' && 'status' in err) {
        const { status } = err as { status: number };
        return ERROR_MAP[status] ?? NETWORK_ERROR;
    }
    return NETWORK_ERROR;
}

export function useGenerateScript(): UseGenerateScriptReturn {
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
                    const job = await getJobStatus(jobId);
                    if (job.status === 'completed') {
                        clearPolling();
                        const script =
                            job.result && typeof job.result === 'object'
                                ? (job.result as { script?: string }).script ?? ''
                                : (job as { script?: string }).script ?? '';
                        setState({ phase: 'completed', script });
                    } else if (job.status === 'failed') {
                        clearPolling();
                        setState({
                            phase: 'error',
                            message: job.message ?? 'No se pudo generar el guión.',
                        });
                    }
                } catch (err) {
                    // Retry on temporary server errors (502/503/504)
                    // Fail immediately on auth/not-found errors
                    if (err && typeof err === 'object' && 'status' in err) {
                        const status = (err as { status: number }).status;
                        if (TEMP_ERROR_CODES.has(status)) {
                            // Server busy, will retry on next interval
                            console.warn(`[Polling] Attempt ${attemptsRef.current}: Server busy (${status}), retrying...`);
                            return;
                        }
                        // Permanent error: fail now
                        if (status === 401 || status === 404) {
                            clearPolling();
                            setState({ phase: 'error', message: mapApiError(err) });
                            return;
                        }
                    }
                    // For unknown errors, retry (don't give up)
                    console.warn(`[Polling] Attempt ${attemptsRef.current}: ${err}, will retry...`);
                }
            }, POLL_INTERVAL_MS);
        },
        [clearPolling],
    );

    const generate = useCallback(
        async (story: string, targetDuration?: number, targetScenes?: number, tone?: string) => {
            setState({ phase: 'submitting' });
            try {
                const { jobId } = await postGenerateScript({ story, targetDuration, targetScenes, tone });
                setState({ phase: 'polling', jobId, attempts: 0 });
                startPolling(jobId);
            } catch (err) {
                setState({ phase: 'error', message: mapApiError(err) });
            }
        },
        [startPolling],
    );

    const reset = useCallback(() => {
        clearPolling();
        setState({ phase: 'idle' });
    }, [clearPolling]);

    return { state, generate, reset };
}
