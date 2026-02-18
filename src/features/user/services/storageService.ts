// =============================================================================
// Storage Service — localStorage for profile, IndexedDB for response history
// =============================================================================

import { UserProfile, StoredResponseRecord, createDefaultProfile } from '../types';

const PROFILE_KEY = 'calibrateme_profile';
const DB_NAME = 'CalibrateMe';
const DB_VERSION = 1;
const RESPONSE_STORE = 'responses';

// ── localStorage (profile) ───────────────────────────────────────────────────

export function saveProfile(profile: UserProfile): void {
  profile.updatedAt = new Date().toISOString();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return createDefaultProfile();
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return createDefaultProfile();
  }
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

export function exportProfileJSON(): string {
  return localStorage.getItem(PROFILE_KEY) ?? JSON.stringify(createDefaultProfile());
}

export function importProfileJSON(json: string): UserProfile {
  const profile = JSON.parse(json) as UserProfile;
  saveProfile(profile);
  return profile;
}

// ── IndexedDB (response history) ─────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(RESPONSE_STORE)) {
        const store = db.createObjectStore(RESPONSE_STORE, { autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('itemId', 'itemId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveResponse(record: StoredResponseRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RESPONSE_STORE, 'readwrite');
    tx.objectStore(RESPONSE_STORE).add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveResponses(records: StoredResponseRecord[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RESPONSE_STORE, 'readwrite');
    const store = tx.objectStore(RESPONSE_STORE);
    for (const record of records) {
      store.add(record);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRecentResponses(limit: number = 1000): Promise<StoredResponseRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RESPONSE_STORE, 'readonly');
    const store = tx.objectStore(RESPONSE_STORE);
    const index = store.index('timestamp');
    const results: StoredResponseRecord[] = [];

    const req = index.openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value as StoredResponseRecord);
        cursor.continue();
      } else {
        resolve(results.reverse());
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getResponseCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RESPONSE_STORE, 'readonly');
    const req = tx.objectStore(RESPONSE_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearResponses(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RESPONSE_STORE, 'readwrite');
    tx.objectStore(RESPONSE_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function exportResponsesJSON(): Promise<string> {
  const records = await getRecentResponses(10000);
  return JSON.stringify(records, null, 2);
}

export async function clearAllData(): Promise<void> {
  clearProfile();
  await clearResponses();
}
