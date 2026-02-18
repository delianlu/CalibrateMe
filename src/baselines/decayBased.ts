// =============================================================================
// Decay-Based Baseline Scheduler
// Simple exponential decay scheduler (ignores calibration)
// =============================================================================

import { Response } from '../types';

/**
 * Decay-Based Scheduler State
 */
export interface DecayState {
  interval: number;       // Current interval in days
  lastReview: Date | null;
  streak: number;         // Consecutive correct answers
}

/**
 * Initialize decay state for a new item
 */
export function initDecayState(): DecayState {
  return {
    interval: 1,
    lastReview: null,
    streak: 0,
  };
}

/**
 * Decay-Based Scheduler
 * Simple: double interval on correct, reset on incorrect
 */
export class DecayBasedScheduler {
  private states: Map<string, DecayState>;
  private maxInterval: number;

  constructor(maxInterval: number = 30) {
    this.states = new Map();
    this.maxInterval = maxInterval;
  }

  /**
   * Get or initialize state for an item
   */
  getState(itemId: string): DecayState {
    if (!this.states.has(itemId)) {
      this.states.set(itemId, initDecayState());
    }
    return this.states.get(itemId)!;
  }

  /**
   * Process a response and schedule next review
   */
  processResponse(response: Response): { nextReview: Date; interval: number } {
    const state = this.getState(response.item_id);

    let newInterval: number;
    let newStreak: number;

    if (response.correctness) {
      // Double the interval (exponential growth)
      newStreak = state.streak + 1;
      newInterval = Math.min(state.interval * 2, this.maxInterval);
    } else {
      // Reset on error
      newStreak = 0;
      newInterval = 1;
    }

    this.states.set(response.item_id, {
      interval: newInterval,
      lastReview: new Date(),
      streak: newStreak,
    });

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      nextReview,
      interval: newInterval,
    };
  }

  /**
   * Reset scheduler state
   */
  reset(): void {
    this.states.clear();
  }
}
