import { useState, useCallback, useEffect } from 'react';
import {
  UserProfile,
  ItemState,
  StoredResponseRecord,
  createDefaultProfile,
} from '../types';
import {
  saveProfile,
  loadProfile,
  saveResponses,
  clearAllData,
  exportProfileJSON,
  importProfileJSON,
  exportResponsesJSON,
} from '../services/storageService';
import { QuizResponse } from '../../quiz/types';

function isSameDay(a: string | null, b: string): boolean {
  if (!a) return false;
  return a.slice(0, 10) === b.slice(0, 10);
}

function isYesterday(a: string | null, b: string): boolean {
  if (!a) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d2.getTime() - d1.getTime() === 86400000;
}

function computeMasteryLevel(item: ItemState): ItemState['masteryLevel'] {
  if (item.reviewCount === 0) return 'new';
  const accuracy = item.correctCount / item.reviewCount;
  if (accuracy >= 0.85 && item.reviewCount >= 5) return 'mastered';
  if (accuracy >= 0.5 && item.reviewCount >= 2) return 'review';
  return 'learning';
}

/**
 * Hook for managing the user profile with automatic localStorage persistence.
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  // Persist on every change
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // ── Record a batch of quiz responses (end of session) ──────────────
  const recordSessionResponses = useCallback(
    (responses: QuizResponse[], globalKHat: number, globalBetaHat: number) => {
      const now = new Date().toISOString();

      // Store in IndexedDB
      const records: StoredResponseRecord[] = responses.map(r => ({
        itemId: r.itemId,
        correctness: r.correctness,
        confidence: r.confidence,
        responseTime: r.responseTime,
        timestamp: r.timestamp.toISOString(),
      }));
      saveResponses(records).catch(console.error);

      // Update profile
      setProfile(prev => {
        const next = { ...prev, updatedAt: now };
        const itemStates = { ...prev.itemStates };

        let sessionCorrect = 0;
        let sessionConfidence = 0;

        for (const r of responses) {
          const existing = itemStates[r.itemId];
          const state: ItemState = existing
            ? { ...existing }
            : {
                itemId: r.itemId,
                kHat: 0.3,
                lastReview: null,
                nextReview: null,
                reviewCount: 0,
                correctCount: 0,
                averageConfidence: 0,
                averageRT: 0,
                masteryLevel: 'new',
              };

          state.reviewCount += 1;
          if (r.correctness) {
            state.correctCount += 1;
            sessionCorrect += 1;
          }
          state.averageConfidence =
            (state.averageConfidence * (state.reviewCount - 1) + r.confidence) /
            state.reviewCount;
          state.averageRT =
            (state.averageRT * (state.reviewCount - 1) + r.responseTime) /
            state.reviewCount;
          state.lastReview = r.timestamp.toISOString();
          state.masteryLevel = computeMasteryLevel(state);

          sessionConfidence += r.confidence;
          itemStates[r.itemId] = state;
        }

        next.itemStates = itemStates;

        // Update global stats
        const stats = { ...prev.stats };
        stats.totalReviews += responses.length;
        stats.totalCorrect += sessionCorrect;
        stats.totalSessions += 1;
        stats.averageSessionLength =
          (stats.averageSessionLength * (stats.totalSessions - 1) + responses.length) /
          stats.totalSessions;

        if (stats.totalReviews > 0) {
          stats.averageAccuracy = stats.totalCorrect / stats.totalReviews;
          // Running average of confidence
          stats.averageConfidence =
            (stats.averageConfidence * (stats.totalReviews - responses.length) +
              sessionConfidence) /
            stats.totalReviews;
        }

        // Streak logic
        if (!isSameDay(stats.lastReviewDate, now)) {
          if (isYesterday(stats.lastReviewDate, now) || stats.lastReviewDate === null) {
            stats.currentStreak += 1;
          } else if (!isSameDay(stats.lastReviewDate, now)) {
            stats.currentStreak = 1;
          }
          stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
        }
        stats.lastReviewDate = now;

        next.stats = stats;

        // Update learner state
        next.learnerState = {
          ...prev.learnerState,
          globalKHat: globalKHat,
          globalBetaHat: globalBetaHat,
          calibrationType:
            globalBetaHat > 0.1
              ? 'overconfident'
              : globalBetaHat < -0.1
                ? 'underconfident'
                : 'well-calibrated',
          abilityEstimate:
            globalKHat < 0.35 ? 'low' : globalKHat > 0.65 ? 'high' : 'medium',
        };

        return next;
      });
    },
    []
  );

  // ── Update preferences ─────────────────────────────────────────────
  const updatePreferences = useCallback(
    (partial: Partial<UserProfile['preferences']>) => {
      setProfile(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...partial },
      }));
    },
    []
  );

  // ── Export / Import / Clear ────────────────────────────────────────
  const exportData = useCallback(async () => {
    const profileJSON = exportProfileJSON();
    const responsesJSON = await exportResponsesJSON();
    const bundle = JSON.stringify(
      { profile: JSON.parse(profileJSON), responses: JSON.parse(responsesJSON) },
      null,
      2
    );
    const blob = new Blob([bundle], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calibrateme-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback((json: string) => {
    const data = JSON.parse(json);
    if (data.profile) {
      const imported = importProfileJSON(JSON.stringify(data.profile));
      setProfile(imported);
    }
    // Response history import could be added here if needed
  }, []);

  const resetAll = useCallback(async () => {
    await clearAllData();
    setProfile(createDefaultProfile());
  }, []);

  return {
    profile,
    recordSessionResponses,
    updatePreferences,
    exportData,
    importData,
    resetAll,
  };
}
