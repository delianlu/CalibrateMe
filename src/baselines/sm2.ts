// =============================================================================
// SM-2 Baseline Scheduler
// Classic SuperMemo 2 algorithm (calibration-blind)
// =============================================================================

import { Response } from '../types';

/**
 * SM-2 Algorithm State for an item
 */
export interface SM2State {
  easeFactor: number;    // EF (starts at 2.5)
  interval: number;      // Current interval in days
  repetitions: number;   // Number of successful repetitions
}

/**
 * Initialize SM-2 state for a new item
 */
export function initSM2State(): SM2State {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
  };
}

/**
 * Map confidence and correctness to SM-2 quality rating (0-5)
 * q = round(5 × c × 1[y=1])
 * Incorrect responses receive q = 0
 */
export function mapToQuality(confidence: number, correctness: boolean): number {
  if (!correctness) return 0;
  return Math.round(5 * confidence);
}

/**
 * Update SM-2 state based on response quality
 */
export function updateSM2(state: SM2State, quality: number): SM2State {
  // Quality must be in [0, 5]
  const q = Math.max(0, Math.min(5, quality));

  // Update ease factor
  let newEF = state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, newEF); // Minimum EF is 1.3

  let newInterval: number;
  let newReps: number;

  if (q < 3) {
    // Failed response - reset
    newReps = 0;
    newInterval = 1;
  } else {
    // Successful response
    newReps = state.repetitions + 1;

    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(state.interval * newEF);
    }
  }

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
  };
}

/**
 * SM-2 Scheduler
 */
export class SM2Scheduler {
  private states: Map<string, SM2State>;

  constructor() {
    this.states = new Map();
  }

  /**
   * Get or initialize state for an item
   */
  getState(itemId: string): SM2State {
    if (!this.states.has(itemId)) {
      this.states.set(itemId, initSM2State());
    }
    return this.states.get(itemId)!;
  }

  /**
   * Process a response and schedule next review
   */
  processResponse(response: Response): { nextReview: Date; interval: number } {
    const state = this.getState(response.item_id);
    const quality = mapToQuality(response.confidence, response.correctness);
    const newState = updateSM2(state, quality);

    this.states.set(response.item_id, newState);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newState.interval);

    return {
      nextReview,
      interval: newState.interval,
    };
  }

  /**
   * Reset scheduler state
   */
  reset(): void {
    this.states.clear();
  }
}
