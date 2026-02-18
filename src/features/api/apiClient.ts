import { APIConfig, DataProvider, SessionPayload, SyncStatus } from './types';
import { OfflineProvider } from './offlineProvider';

/**
 * API client factory. Returns the appropriate data provider
 * based on configuration. Currently only offline mode is implemented;
 * online mode is a placeholder for future REST API integration.
 */
export function createDataProvider(config: APIConfig): DataProvider {
  if (config.mode === 'online' && config.baseUrl) {
    // Future: return new OnlineProvider(config.baseUrl, config.apiKey);
    // For now, fall back to offline
    console.warn('Online mode not yet implemented, falling back to offline.');
  }
  return new OfflineProvider();
}

/**
 * Singleton instance for the app to use.
 */
let providerInstance: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!providerInstance) {
    providerInstance = createDataProvider({ mode: 'offline' });
  }
  return providerInstance;
}

/**
 * Hook-friendly wrapper to save a session via the data provider.
 */
export async function saveSessionToProvider(payload: SessionPayload): Promise<void> {
  const provider = getDataProvider();
  await provider.saveSession(payload);
}

/**
 * Get current sync status.
 */
export function getProviderSyncStatus(): SyncStatus {
  const provider = getDataProvider();
  return provider.getSyncStatus();
}
