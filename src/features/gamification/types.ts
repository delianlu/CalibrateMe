// =============================================================================
// Gamification Types
// =============================================================================

export interface GamificationState {
  xp: number;
  level: number;
  achievements: UnlockedAchievement[];
  dailyStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date string (YYYY-MM-DD)
  pendingNotifications: GamificationNotification[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'calibration' | 'streak' | 'mastery' | 'volume';
  requirement: AchievementRequirement;
}

export interface AchievementRequirement {
  type: 'sessions' | 'reviews' | 'streak' | 'accuracy' | 'calibration' | 'mastered_items';
  threshold: number;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string; // ISO string
}

export interface GamificationNotification {
  id: string;
  type: 'level-up' | 'achievement' | 'streak';
  title: string;
  message: string;
  timestamp: string;
}

// ── XP Constants ──────────────────────────────────────────────────────
export const XP_PER_REVIEW = 10;
export const XP_CORRECT_BONUS = 5;
export const XP_CALIBRATED_BONUS = 8;  // confidence within 15% of accuracy
export const XP_STREAK_MULTIPLIER = 0.1; // +10% per streak day, capped at 2x
export const XP_SESSION_COMPLETION = 25;

// Level thresholds: level N requires levelThreshold(N) total XP
export function xpForLevel(level: number): number {
  // Quadratic scaling: level 1 = 0, level 2 = 100, level 3 = 250, ...
  if (level <= 1) return 0;
  return Math.floor(50 * (level - 1) * level);
}

export function levelFromXP(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export function createDefaultGamificationState(): GamificationState {
  return {
    xp: 0,
    level: 1,
    achievements: [],
    dailyStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    pendingNotifications: [],
  };
}
