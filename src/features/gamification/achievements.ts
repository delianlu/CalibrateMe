import { Achievement } from './types';

export const achievements: Achievement[] = [
  // ── Volume ───────────────────────────────────────────────────────────
  {
    id: 'first-session',
    title: 'First Steps',
    description: 'Complete your first quiz session',
    icon: '1',
    category: 'volume',
    requirement: { type: 'sessions', threshold: 1 },
  },
  {
    id: 'ten-sessions',
    title: 'Dedicated Learner',
    description: 'Complete 10 quiz sessions',
    icon: '10',
    category: 'volume',
    requirement: { type: 'sessions', threshold: 10 },
  },
  {
    id: 'hundred-reviews',
    title: 'Century Club',
    description: 'Review 100 items total',
    icon: 'C',
    category: 'volume',
    requirement: { type: 'reviews', threshold: 100 },
  },
  {
    id: 'five-hundred-reviews',
    title: 'Knowledge Seeker',
    description: 'Review 500 items total',
    icon: 'K',
    category: 'volume',
    requirement: { type: 'reviews', threshold: 500 },
  },

  // ── Streak ───────────────────────────────────────────────────────────
  {
    id: 'streak-3',
    title: 'Three-Day Streak',
    description: 'Practice 3 days in a row',
    icon: '3',
    category: 'streak',
    requirement: { type: 'streak', threshold: 3 },
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Practice 7 days in a row',
    icon: '7',
    category: 'streak',
    requirement: { type: 'streak', threshold: 7 },
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Practice 30 days in a row',
    icon: '30',
    category: 'streak',
    requirement: { type: 'streak', threshold: 30 },
  },

  // ── Mastery ──────────────────────────────────────────────────────────
  {
    id: 'accuracy-80',
    title: 'Sharp Mind',
    description: 'Achieve 80% overall accuracy',
    icon: 'A',
    category: 'mastery',
    requirement: { type: 'accuracy', threshold: 0.8 },
  },
  {
    id: 'mastered-10',
    title: 'First Ten',
    description: 'Master 10 vocabulary items',
    icon: 'M',
    category: 'mastery',
    requirement: { type: 'mastered_items', threshold: 10 },
  },
  {
    id: 'mastered-50',
    title: 'Half Century',
    description: 'Master 50 vocabulary items',
    icon: '50',
    category: 'mastery',
    requirement: { type: 'mastered_items', threshold: 50 },
  },

  // ── Calibration ──────────────────────────────────────────────────────
  {
    id: 'well-calibrated',
    title: 'Well Calibrated',
    description: 'Achieve ECE below 10% in a session',
    icon: 'W',
    category: 'calibration',
    requirement: { type: 'calibration', threshold: 0.10 },
  },
  {
    id: 'perfectly-calibrated',
    title: 'Calibration Expert',
    description: 'Achieve ECE below 5% in a session',
    icon: 'P',
    category: 'calibration',
    requirement: { type: 'calibration', threshold: 0.05 },
  },
];
