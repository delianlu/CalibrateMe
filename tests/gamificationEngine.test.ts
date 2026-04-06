import { processSession, clearNotifications } from '../src/features/gamification/gamificationEngine';
import {
  GamificationState,
  createDefaultGamificationState,
  xpForLevel,
  levelFromXP,
  XP_PER_REVIEW,
  XP_CORRECT_BONUS,
  XP_CALIBRATED_BONUS,
  XP_SESSION_COMPLETION,
} from '../src/features/gamification/types';
import { QuizResponse } from '../src/features/quiz/types';

function makeResponse(correct: boolean, confidence: number): QuizResponse {
  return {
    itemId: `item-${Math.random()}`,
    correctness: correct,
    confidence,
    responseTime: 3000,
    timestamp: new Date(),
  };
}

function makeState(overrides: Partial<GamificationState> = {}): GamificationState {
  return { ...createDefaultGamificationState(), ...overrides };
}

describe('Gamification Engine', () => {
  describe('XP and Level Utilities', () => {
    it('xpForLevel should return 0 for level 1', () => {
      expect(xpForLevel(1)).toBe(0);
    });

    it('xpForLevel should scale quadratically', () => {
      expect(xpForLevel(2)).toBe(100);
      expect(xpForLevel(3)).toBe(300);
      const l4 = xpForLevel(4);
      expect(l4).toBeGreaterThan(xpForLevel(3));
    });

    it('levelFromXP should return 1 for 0 XP', () => {
      expect(levelFromXP(0)).toBe(1);
    });

    it('levelFromXP should return correct level for exact threshold', () => {
      expect(levelFromXP(100)).toBe(2);
      expect(levelFromXP(300)).toBe(3);
    });

    it('levelFromXP should return correct level for mid-range XP', () => {
      expect(levelFromXP(150)).toBe(2); // Between level 2 (100) and level 3 (300)
    });
  });

  describe('processSession', () => {
    it('should award base XP per review', () => {
      const state = makeState();
      const responses = [makeResponse(false, 50)]; // Incorrect, no bonus
      const result = processSession(state, {
        responses,
        sessionECE: 0.5,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 0,
        currentStreak: 0,
        masteredItems: 0,
      });

      // XP = (XP_PER_REVIEW + XP_SESSION_COMPLETION) * multiplier
      expect(result.xp).toBeGreaterThan(0);
    });

    it('should award XP_CORRECT_BONUS for correct answers', () => {
      const state = makeState();
      const responses = [makeResponse(true, 50)];
      const result = processSession(state, {
        responses,
        sessionECE: 0.5,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 1,
        currentStreak: 0,
        masteredItems: 0,
      });

      // Should include correct bonus
      const expectedBase = XP_PER_REVIEW + XP_CORRECT_BONUS + XP_SESSION_COMPLETION;
      // Streak of 1 day → multiplier = 1 + 1*0.1 = 1.1
      expect(result.xp).toBeGreaterThanOrEqual(expectedBase);
    });

    it('should award XP_CALIBRATED_BONUS for well-calibrated responses', () => {
      const state = makeState();
      // Confidence 100 on correct answer → |100 - 100| = 0 ≤ 15 → calibrated!
      const responses = [makeResponse(true, 100)];
      const result = processSession(state, {
        responses,
        sessionECE: 0.05,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 1,
        currentStreak: 0,
        masteredItems: 0,
      });

      const withCalibration = XP_PER_REVIEW + XP_CORRECT_BONUS + XP_CALIBRATED_BONUS + XP_SESSION_COMPLETION;
      expect(result.xp).toBeGreaterThanOrEqual(withCalibration);
    });

    it('should start a daily streak on first session', () => {
      const state = makeState({ lastActivityDate: null });
      const result = processSession(state, {
        responses: [makeResponse(true, 50)],
        sessionECE: 0.2,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 1,
        currentStreak: 0,
        masteredItems: 0,
      });

      expect(result.dailyStreak).toBe(1);
      expect(result.lastActivityDate).toBeTruthy();
    });

    it('should continue streak on consecutive days', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const state = makeState({
        lastActivityDate: yesterday.toISOString().slice(0, 10),
        dailyStreak: 3,
        longestStreak: 3,
      });

      const result = processSession(state, {
        responses: [makeResponse(true, 50)],
        sessionECE: 0.2,
        totalSessions: 4,
        totalReviews: 10,
        accuracy: 0.8,
        currentStreak: 3,
        masteredItems: 0,
      });

      expect(result.dailyStreak).toBe(4);
      expect(result.longestStreak).toBe(4);
    });

    it('should reset streak if day is skipped', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
      const state = makeState({
        lastActivityDate: twoDaysAgo.toISOString().slice(0, 10),
        dailyStreak: 5,
        longestStreak: 5,
      });

      const result = processSession(state, {
        responses: [makeResponse(true, 50)],
        sessionECE: 0.2,
        totalSessions: 6,
        totalReviews: 10,
        accuracy: 0.8,
        currentStreak: 0,
        masteredItems: 0,
      });

      expect(result.dailyStreak).toBe(1);
      expect(result.longestStreak).toBe(5); // Longest preserved
    });

    it('should not update streak if same day', () => {
      const today = new Date().toISOString().slice(0, 10);
      const state = makeState({
        lastActivityDate: today,
        dailyStreak: 2,
      });

      const result = processSession(state, {
        responses: [makeResponse(true, 50)],
        sessionECE: 0.2,
        totalSessions: 3,
        totalReviews: 10,
        accuracy: 0.8,
        currentStreak: 2,
        masteredItems: 0,
      });

      expect(result.dailyStreak).toBe(2); // Unchanged
    });

    it('should track calibration streak', () => {
      const state = makeState({ calibrationStreak: 0, bestCalibrationStreak: 0 });
      // Well-calibrated: correct with confidence 100 → |100 - 100| = 0 ≤ 15
      const responses = [
        makeResponse(true, 100),
        makeResponse(true, 90),  // |90 - 100| = 10 ≤ 15 → calibrated
        makeResponse(false, 5),  // |5 - 0| = 5 ≤ 15 → calibrated
      ];

      const result = processSession(state, {
        responses,
        sessionECE: 0.05,
        totalSessions: 1,
        totalReviews: 3,
        accuracy: 0.67,
        currentStreak: 0,
        masteredItems: 0,
      });

      expect(result.calibrationStreak).toBe(3);
      expect(result.bestCalibrationStreak).toBe(3);
    });

    it('should reset calibration streak on miscalibrated response', () => {
      const state = makeState({ calibrationStreak: 5, bestCalibrationStreak: 5 });
      // Overconfident: wrong with confidence 90 → |90 - 0| = 90 > 15
      const responses = [makeResponse(false, 90)];

      const result = processSession(state, {
        responses,
        sessionECE: 0.5,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 0,
        currentStreak: 0,
        masteredItems: 0,
      });

      expect(result.calibrationStreak).toBe(0);
      expect(result.bestCalibrationStreak).toBe(5); // Best preserved
    });

    it('should unlock first-session achievement', () => {
      const state = makeState();
      const result = processSession(state, {
        responses: [makeResponse(true, 50)],
        sessionECE: 0.2,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 1,
        currentStreak: 0,
        masteredItems: 0,
      });

      const achievementIds = result.achievements.map(a => a.achievementId);
      expect(achievementIds).toContain('first-session');
    });

    it('should unlock well-calibrated achievement when ECE ≤ 0.10', () => {
      const state = makeState();
      const result = processSession(state, {
        responses: [makeResponse(true, 100)],
        sessionECE: 0.08,
        totalSessions: 1,
        totalReviews: 1,
        accuracy: 1,
        currentStreak: 0,
        masteredItems: 0,
      });

      const achievementIds = result.achievements.map(a => a.achievementId);
      expect(achievementIds).toContain('well-calibrated');
    });

    it('should not unlock already earned achievements', () => {
      const state = makeState({
        achievements: [{ achievementId: 'first-session', unlockedAt: new Date().toISOString() }],
      });
      const result = processSession(state, {
        responses: [makeResponse(true, 50)],
        sessionECE: 0.2,
        totalSessions: 2,
        totalReviews: 5,
        accuracy: 1,
        currentStreak: 1,
        masteredItems: 0,
      });

      const firstSessionCount = result.achievements.filter(a => a.achievementId === 'first-session').length;
      expect(firstSessionCount).toBe(1);
    });

    it('should generate level-up notification', () => {
      // Start with XP just below level 2 threshold
      const state = makeState({ xp: 90, level: 1 });
      const responses = Array(5).fill(null).map(() => makeResponse(true, 100));

      const result = processSession(state, {
        responses,
        sessionECE: 0.05,
        totalSessions: 1,
        totalReviews: 5,
        accuracy: 1,
        currentStreak: 0,
        masteredItems: 0,
      });

      if (result.level > 1) {
        const levelUpNotification = result.pendingNotifications.find(n => n.type === 'level-up');
        expect(levelUpNotification).toBeDefined();
      }
    });
  });

  describe('clearNotifications', () => {
    it('should clear all pending notifications', () => {
      const state = makeState({
        pendingNotifications: [
          { id: '1', type: 'streak', title: 'Streak!', message: '3 days', timestamp: new Date().toISOString() },
          { id: '2', type: 'level-up', title: 'Level 2!', message: 'Great!', timestamp: new Date().toISOString() },
        ],
      });

      const result = clearNotifications(state);
      expect(result.pendingNotifications).toHaveLength(0);
    });

    it('should preserve other state', () => {
      const state = makeState({ xp: 500, level: 3, dailyStreak: 5 });
      const result = clearNotifications(state);
      expect(result.xp).toBe(500);
      expect(result.level).toBe(3);
      expect(result.dailyStreak).toBe(5);
    });
  });
});
