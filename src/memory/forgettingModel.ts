// =============================================================================
// Forgetting Model
// Implements Equation 3 from the project pitch
// =============================================================================

import { Item } from '../types';

/**
 * Apply exponential forgetting to true knowledge (Equation 3)
 * K*_{t'} = K*_t × e^{-λ × Δt}
 */
export function applyForgetting(
  K_star: number,
  lambda: number,
  delta_t: number
): number {
  return K_star * Math.exp(-lambda * delta_t);
}

/**
 * Calculate days since last review
 */
export function daysSinceReview(lastReview: Date | null, now: Date = new Date()): number {
  if (!lastReview) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return (now.getTime() - lastReview.getTime()) / msPerDay;
}

/**
 * Predict knowledge at a future time point
 */
export function predictForgottenKnowledge(
  K_star: number,
  lambda: number,
  days_in_future: number
): number {
  return applyForgetting(K_star, lambda, days_in_future);
}

/**
 * Calculate optimal review time (when K* drops to threshold)
 * Solving: threshold = K* × e^{-λt}
 * t = -ln(threshold/K*) / λ
 */
export function optimalReviewTime(
  K_star: number,
  lambda: number,
  threshold: number = 0.7
): number {
  if (K_star <= threshold) return 0; // Review immediately
  if (lambda === 0) return Infinity;

  return -Math.log(threshold / K_star) / lambda;
}

/**
 * Apply forgetting to an item
 */
export function applyItemForgetting(
  item: Item,
  lambda: number,
  now: Date = new Date()
): Item {
  const delta_t = daysSinceReview(item.true_state.last_review, now);

  if (delta_t === 0) return item;

  return {
    ...item,
    true_state: {
      ...item.true_state,
      K_star: applyForgetting(item.true_state.K_star, lambda, delta_t),
    },
  };
}

/**
 * Apply forgetting to all items in a pool
 */
export function applyBatchForgetting(
  items: Item[],
  lambda: number,
  now: Date = new Date()
): Item[] {
  return items.map(item => applyItemForgetting(item, lambda, now));
}

/**
 * Update true knowledge after a learning event (Equation 2)
 * K*_{t+1} = K*_t + α × (1 - K*_t) × 1[y=1] + α_err × (1 - K*_t) × 1[y=0]
 */
export function applyLearning(
  K_star: number,
  correctness: boolean,
  alpha: number,
  alpha_err: number
): number {
  if (correctness) {
    return K_star + alpha * (1 - K_star);
  } else {
    // Learning from errors (smaller effect)
    return K_star + alpha_err * (1 - K_star);
  }
}

/**
 * Calculate retention probability at a given delay
 */
export function calculateRetention(
  K_star: number,
  lambda: number,
  delay_days: number,
  slip: number = 0.1,
  guess: number = 0.2
): number {
  const K_at_delay = applyForgetting(K_star, lambda, delay_days);
  // Using slip-guess model
  return (1 - slip) * K_at_delay + guess * (1 - K_at_delay);
}
