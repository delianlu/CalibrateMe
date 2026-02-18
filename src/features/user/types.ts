// =============================================================================
// User Profile & Persistence Types
// =============================================================================

export interface UserProfile {
  id: string;
  createdAt: string;   // ISO string for serialization
  updatedAt: string;

  // Global learning parameters (from CalibrateMe engine)
  learnerState: {
    globalKHat: number;
    globalBetaHat: number;
    calibrationType: 'overconfident' | 'underconfident' | 'well-calibrated';
    abilityEstimate: 'low' | 'medium' | 'high';
  };

  // Per-item knowledge tracking
  itemStates: Record<string, ItemState>;

  // Aggregate statistics
  stats: UserStats;

  // User settings
  preferences: UserPreferences;
}

export interface ItemState {
  itemId: string;
  kHat: number;
  lastReview: string | null;   // ISO string
  nextReview: string | null;   // ISO string
  reviewCount: number;
  correctCount: number;
  averageConfidence: number;
  averageRT: number;           // ms
  masteryLevel: 'new' | 'learning' | 'review' | 'mastered';
}

export interface UserStats {
  totalReviews: number;
  totalCorrect: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string | null; // ISO string
  averageSessionLength: number;
  averageConfidence: number;
  averageAccuracy: number;
}

export interface UserPreferences {
  itemsPerSession: number;
  darkMode: boolean;
  showTimer: boolean;
}

export interface StoredResponseRecord {
  itemId: string;
  correctness: boolean;
  confidence: number;
  responseTime: number;
  timestamp: string;
}

export function createDefaultProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: now,
    updatedAt: now,
    learnerState: {
      globalKHat: 0.3,
      globalBetaHat: 0,
      calibrationType: 'well-calibrated',
      abilityEstimate: 'medium',
    },
    itemStates: {},
    stats: {
      totalReviews: 0,
      totalCorrect: 0,
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastReviewDate: null,
      averageSessionLength: 0,
      averageConfidence: 0,
      averageAccuracy: 0,
    },
    preferences: {
      itemsPerSession: 20,
      darkMode: false,
      showTimer: false,
    },
  };
}
