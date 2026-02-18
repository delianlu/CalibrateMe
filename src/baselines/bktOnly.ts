// =============================================================================
// BKT-Only Baseline Scheduler
// Uses Bayesian Knowledge Tracing without calibration adjustment
// =============================================================================

import { Response, SystemBelief, SimulationConfig } from '../types';
import { updateBelief } from '../bkt/beliefUpdateEngine';
import { baseInterval } from '../scheduler/calibrationAwareScheduler';

/**
 * BKT-Only Scheduler
 * Schedules based on K̂ only, ignoring calibration
 */
export class BKTOnlyScheduler {
  private beliefs: Map<string, SystemBelief>;
  private lambda: number;
  private config: SimulationConfig;

  constructor(lambda: number, config: SimulationConfig) {
    this.beliefs = new Map();
    this.lambda = lambda;
    this.config = config;
  }

  /**
   * Get or initialize belief for an item
   */
  getBelief(itemId: string): SystemBelief {
    if (!this.beliefs.has(itemId)) {
      this.beliefs.set(itemId, {
        K_hat: 0.3, // Initial belief
        beta_hat: 0, // Ignored in BKT-only
        confidence_interval: 0.2,
        last_updated: new Date(),
      });
    }
    return this.beliefs.get(itemId)!;
  }

  /**
   * Process a response and schedule next review
   */
  processResponse(response: Response): { nextReview: Date; interval: number } {
    const currentBelief = this.getBelief(response.item_id);

    // Update belief using BKT
    const updatedBelief = updateBelief(response, currentBelief, this.config);
    this.beliefs.set(response.item_id, updatedBelief);

    // Calculate interval based on K̂ only (no calibration adjustment)
    const interval = baseInterval(updatedBelief.K_hat, this.lambda);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.round(interval));

    return {
      nextReview,
      interval: Math.round(interval),
    };
  }

  /**
   * Reset scheduler state
   */
  reset(): void {
    this.beliefs.clear();
  }
}
