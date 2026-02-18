import { DataProvider, SessionPayload, SyncStatus } from './types';

const SESSIONS_KEY = 'calibrateme_sessions';

/**
 * Offline-first data provider using localStorage.
 * Stores sessions locally for export and potential future sync.
 */
export class OfflineProvider implements DataProvider {
  private sessions: SessionPayload[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) this.sessions = JSON.parse(raw);
    } catch {
      this.sessions = [];
    }
  }

  private persist(): void {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(this.sessions));
  }

  async saveSession(payload: SessionPayload): Promise<void> {
    this.sessions.push(payload);
    this.persist();
  }

  getSyncStatus(): SyncStatus {
    return {
      lastSynced: null,
      pendingSessions: 0, // all data is local, nothing pending
      isOnline: false,
    };
  }

  async syncPending(): Promise<number> {
    // No remote to sync with in offline mode
    return 0;
  }

  async exportAll(): Promise<string> {
    return JSON.stringify({
      sessions: this.sessions,
      exportedAt: new Date().toISOString(),
      totalSessions: this.sessions.length,
    }, null, 2);
  }
}
