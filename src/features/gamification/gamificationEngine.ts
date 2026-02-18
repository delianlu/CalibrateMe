import {
  GamificationState,
  GamificationNotification,
  XP_PER_REVIEW,
  XP_CORRECT_BONUS,
  XP_CALIBRATED_BONUS,
  XP_STREAK_MULTIPLIER,
  XP_SESSION_COMPLETION,
  levelFromXP,
} from './types';
import { achievements } from './achievements';
import { QuizResponse } from '../quiz/types';

interface SessionContext {
  responses: QuizResponse[];
  sessionECE: number | null;
  totalSessions: number;
  totalReviews: number;
  accuracy: number;
  currentStreak: number;
  masteredItems: number;
}

/**
 * Process a completed session and return updated gamification state.
 */
export function processSession(
  state: GamificationState,
  ctx: SessionContext
): GamificationState {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const notifications: GamificationNotification[] = [];

  // ── Streak ──────────────────────────────────────────────────────────
  let dailyStreak = state.dailyStreak;
  let longestStreak = state.longestStreak;

  if (state.lastActivityDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (state.lastActivityDate === yesterdayStr || state.lastActivityDate === null) {
      dailyStreak += 1;
    } else {
      dailyStreak = 1;
    }
    longestStreak = Math.max(longestStreak, dailyStreak);

    if (dailyStreak > 1) {
      notifications.push({
        id: `streak-${now}`,
        type: 'streak',
        title: `${dailyStreak}-Day Streak!`,
        message: `You've practiced ${dailyStreak} days in a row. Keep it up!`,
        timestamp: now,
      });
    }
  }

  // ── XP Calculation ──────────────────────────────────────────────────
  let sessionXP = 0;

  for (const r of ctx.responses) {
    sessionXP += XP_PER_REVIEW;
    if (r.correctness) sessionXP += XP_CORRECT_BONUS;

    // Calibration bonus: confidence within 15pp of actual outcome
    const actual = r.correctness ? 100 : 0;
    if (Math.abs(r.confidence - actual) <= 15) {
      sessionXP += XP_CALIBRATED_BONUS;
    }
  }

  sessionXP += XP_SESSION_COMPLETION;

  // Streak multiplier (capped at 2x)
  const multiplier = Math.min(2, 1 + dailyStreak * XP_STREAK_MULTIPLIER);
  sessionXP = Math.floor(sessionXP * multiplier);

  const newXP = state.xp + sessionXP;
  const oldLevel = state.level;
  const newLevel = levelFromXP(newXP);

  if (newLevel > oldLevel) {
    notifications.push({
      id: `level-${now}`,
      type: 'level-up',
      title: `Level ${newLevel}!`,
      message: `You've reached level ${newLevel}! Earned ${sessionXP} XP this session.`,
      timestamp: now,
    });
  }

  // ── Achievement Check ───────────────────────────────────────────────
  const unlockedIds = new Set(state.achievements.map(a => a.achievementId));
  const newAchievements = [...state.achievements];

  for (const ach of achievements) {
    if (unlockedIds.has(ach.id)) continue;

    let earned = false;

    switch (ach.requirement.type) {
      case 'sessions':
        earned = ctx.totalSessions >= ach.requirement.threshold;
        break;
      case 'reviews':
        earned = ctx.totalReviews >= ach.requirement.threshold;
        break;
      case 'streak':
        earned = dailyStreak >= ach.requirement.threshold;
        break;
      case 'accuracy':
        earned = ctx.totalReviews >= 20 && ctx.accuracy >= ach.requirement.threshold;
        break;
      case 'mastered_items':
        earned = ctx.masteredItems >= ach.requirement.threshold;
        break;
      case 'calibration':
        earned = ctx.sessionECE !== null && ctx.sessionECE <= ach.requirement.threshold;
        break;
    }

    if (earned) {
      newAchievements.push({ achievementId: ach.id, unlockedAt: now });
      notifications.push({
        id: `ach-${ach.id}-${now}`,
        type: 'achievement',
        title: ach.title,
        message: ach.description,
        timestamp: now,
      });
    }
  }

  return {
    xp: newXP,
    level: newLevel,
    achievements: newAchievements,
    dailyStreak,
    longestStreak,
    lastActivityDate: today,
    pendingNotifications: [...state.pendingNotifications, ...notifications],
  };
}

/**
 * Clear all pending notifications.
 */
export function clearNotifications(state: GamificationState): GamificationState {
  return { ...state, pendingNotifications: [] };
}
