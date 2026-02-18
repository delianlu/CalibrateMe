import { useCallback, useMemo } from 'react';
import { SessionPayload, SyncStatus } from './types';
import { getDataProvider } from './apiClient';

/**
 * Hook providing access to the data provider for session storage and sync.
 */
export function useDataProvider() {
  const provider = useMemo(() => getDataProvider(), []);

  const saveSession = useCallback(
    async (payload: SessionPayload) => {
      await provider.saveSession(payload);
    },
    [provider]
  );

  const getSyncStatus = useCallback((): SyncStatus => {
    return provider.getSyncStatus();
  }, [provider]);

  const syncPending = useCallback(async (): Promise<number> => {
    return provider.syncPending();
  }, [provider]);

  const exportAll = useCallback(async (): Promise<string> => {
    return provider.exportAll();
  }, [provider]);

  return { saveSession, getSyncStatus, syncPending, exportAll };
}
