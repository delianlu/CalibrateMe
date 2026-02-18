import { useRef, useCallback } from 'react';

/**
 * Hidden response timer — measures elapsed time from card display
 * to confidence submission. Not visible to the user.
 */
export function useResponseTimer() {
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stop = useCallback((): number => {
    if (startTimeRef.current === 0) return 0;
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    startTimeRef.current = 0;
    return elapsed;
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = 0;
  }, []);

  return { start, stop, reset };
}
