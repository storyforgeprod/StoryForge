import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project } from '../types';
import { getProjects } from '../api/projectsApi';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'success'; projects: Project[] };

export function useProjects(): { state: State; refresh: () => void } {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [fetchKey, setFetchKey] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    stopPoll();
    setState({ phase: 'loading' });
    setFetchKey((k) => k + 1);
  }, [stopPoll]);

  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then((projects) => {
        if (cancelled) return;
        setState({ phase: 'success', projects });

        const hasProcessing = projects.some((p) => p.status === 'processing');
        if (hasProcessing && pollRef.current === null) {
          pollRef.current = setInterval(() => {
            setFetchKey((k) => k + 1);
          }, 10_000);
        } else if (!hasProcessing) {
          stopPoll();
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Native Error instances (e.g. from fetch itself) use the fallback —
        // only plain API error objects { status, message } expose their message.
        const message =
          typeof err === 'object' &&
          err !== null &&
          !(err instanceof Error) &&
          'message' in err &&
          typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Connection error. Check your internet.';
        setState({ phase: 'error', message });
        stopPoll();
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, stopPoll]);

  // stopPoll is returned directly as the cleanup function — clears interval on unmount.
  useEffect(() => stopPoll, [stopPoll]);

  return { state, refresh };
}
