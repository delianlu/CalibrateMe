// =============================================================================
// Calibration-Aware Scheduler (FIXED)
// Schedules reviews based on K̂, β̂, and dual-process classification
// =============================================================================

import {
  Item,
  ProcessedResponse,
  SystemBelief,
  ResponseType,
} from '../types';

/**
 * Calculate base interval from knowledge estimate and forgetting rate
 */
export function baseInterval(K_hat: number, lambda: number): number {
  // Higher knowledge = longer interval
  // Base formula: target K* = 0.7 at next review
  // 0.7 = K_hat × e^{-λ × t}
  // t = -ln(0.7/K_hat) / λ

  if (K_hat <= 0.7) return 1; // Review tomorrow if knowledge is low
  if (lambda === 0) return 30; // Max interval if no forgetting

  const target_retention = 0.7;
  const interval = -Math.log(target_retention / K_hat) / lambda;

  // Clamp to reasonable range
  return Math.max(1, Math.min(30, interval));
}

/**
 * Adjust interval based on calibration estimate
 */
export function calibrationAdjustment(beta_hat: number): number {
  // Overconfident (β̂ > 0): shorten interval (multiply by < 1)
  // Underconfident (β̂ < 0): lengthen interval (multiply by > 1)
  // Well-calibrated (β̂ ≈ 0): no adjustment

  // Adjustment factor: e^{-2β̂}
  // β̂ = +0.2 → factor ≈ 0.67 (shorter)
  // β̂ = -0.2 → factor ≈ 1.49 (longer)
  // β̂ = 0 → factor = 1 (no change)

  return Math.exp(-2 * beta_hat);
}

/**
 * Adjust interval based on dual-process classification
 */
export function dualProcessAdjustment(
  responseType: ResponseType,
  correctness: boolean
): number {
  if (!correctness) {
    return 0.5; // Shorten interval for errors
  }

  if (responseType === ResponseType.TYPE1_AUTOMATIC) {
    return 1.2; // Slightly longer for automatized
  }

  return 1.0; // Standard for deliberate
}

/**
 * Compute next review interval for an item
 */
export function computeNextReviewInterval(
  belief: SystemBelief,
  response: ProcessedResponse,
  lambda: number,
  enableCalibration: boolean = true,
  enableDualProcess: boolean = true
): number {
  // Start with base interval
  let interval = baseInterval(belief.K_hat, lambda);

  // Apply calibration adjustment
  if (enableCalibration) {
    interval *= calibrationAdjustment(belief.beta_hat);
  }

  // Apply dual-process adjustment
  if (enableDualProcess) {
    interval *= dualProcessAdjustment(response.response_type, response.correctness);
  }

  // Clamp to [1, 60] days
  return Math.max(1, Math.min(60, Math.round(interval)));
}

/**
 * Calculate review urgency for an item
 * Higher urgency = should be reviewed sooner
 */
export function calculateUrgency(item: Item, now: Date = new Date()): number {
  const scheduled = item.system_belief.next_review instanceof Date
    ? item.system_belief.next_review
    : new Date(item.system_belief.next_review);
  const days_until_due = (scheduled.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

  // Negative days = overdue (high urgency)
  // Positive days = not yet due (lower urgency)
  return -days_until_due;
}

/**
 * Select next items to review from pool
 */
export function selectItemsForReview(
  items: Item[],
  count: number,
  now: Date = new Date()
): Item[] {
  // Sort by urgency (most urgent first)
  const sorted = [...items].sort((a, b) => {
    return calculateUrgency(b, now) - calculateUrgency(a, now);
  });

  return sorted.slice(0, count);
}

/**
 * CalibrateMe Scheduler with coverage-aware item selection
 *
 * The coverage mechanism addresses a key design tension: calibration-aware
 * interval adjustment shortens intervals for overconfident learners, causing
 * the same items to be re-reviewed at the expense of item pool breadth.
 *
 * Solution: penalize items reviewed more than the pool average, ensuring
 * that urgency is balanced against coverage diversity.
 */
export class CalibrateMeScheduler {
  private lambda: number;
  private enableCalibration: boolean;
  private enableDualProcess: boolean;
  private coverageWeight: number;
  private reviewCounts: Map<string, number>;
  private totalReviews: number;

  constructor(
    lambda: number = 0.1,
    enableCalibration: boolean = true,
    enableDualProcess: boolean = true,
    coverageWeight: number = 0.5
  ) {
    this.lambda = lambda;
    this.enableCalibration = enableCalibration;
    this.enableDualProcess = enableDualProcess;
    this.coverageWeight = coverageWeight;
    this.reviewCounts = new Map();
    this.totalReviews = 0;
  }

  /**
   * Record that an item was reviewed (for coverage tracking)
   */
  recordReview(itemId: string): void {
    this.reviewCounts.set(itemId, (this.reviewCounts.get(itemId) || 0) + 1);
    this.totalReviews++;
  }

  scheduleNext(
    _item: Item,
    belief: SystemBelief,
    response: ProcessedResponse
  ): { nextReview: Date; interval: number } {
    const interval = computeNextReviewInterval(
      belief,
      response,
      this.lambda,
      this.enableCalibration,
      this.enableDualProcess
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    return { nextReview, interval };
  }

  /**
   * Select items for review with coverage-aware scoring.
   *
   * Combined score = urgency - coverageWeight × (reviewCount - expectedPerItem)
   *
   * Items reviewed more than the pool average are penalized, ensuring
   * breadth of coverage even when calibration adjustment shortens intervals.
   */
  selectItems(items: Item[], count: number, now: Date = new Date()): Item[] {
    const totalItems = items.length;
    const expectedPerItem = totalItems > 0 ? this.totalReviews / totalItems : 0;

    const scored = items.map(item => {
      const urgency = calculateUrgency(item, now);
      const reviewCount = this.reviewCounts.get(item.id) || 0;
      const coveragePenalty = this.coverageWeight * (reviewCount - expectedPerItem);
      return { item, score: urgency - coveragePenalty };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(s => s.item);
  }

  /**
   * Process a response and return scheduling result
   */
  processResponse(
    response: ProcessedResponse,
    belief: SystemBelief
  ): { nextReview: Date; interval: number } {
    const interval = computeNextReviewInterval(
      belief,
      response,
      this.lambda,
      this.enableCalibration,
      this.enableDualProcess
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    return { nextReview, interval };
  }
}
