// =============================================================================
// API Layer Types — Abstraction for online/offline data access
// =============================================================================

export interface APIConfig {
  mode: 'offline' | 'online';
  baseUrl?: string;
  apiKey?: string;
}

export interface SessionPayload {
  userId: string;
  responses: ResponsePayload[];
  globalKHat: number;
  globalBetaHat: number;
  sessionECE: number | null;
  startedAt: string;
  completedAt: string;
}

export interface ResponsePayload {
  itemId: string;
  correctness: boolean;
  confidence: number;
  responseTime: number;
  timestamp: string;
}

export interface SyncStatus {
  lastSynced: string | null;
  pendingSessions: number;
  isOnline: boolean;
}

export interface DataProvider {
  /** Save a completed session */
  saveSession(payload: SessionPayload): Promise<void>;

  /** Get sync status */
  getSyncStatus(): SyncStatus;

  /** Attempt to sync pending offline sessions */
  syncPending(): Promise<number>;

  /** Export all data as JSON */
  exportAll(): Promise<string>;
}
