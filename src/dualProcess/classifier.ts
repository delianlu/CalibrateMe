// =============================================================================
// Dual-Process Classifier
// Classifies responses as Type 1 (automatic) or Type 2 (deliberate)
// =============================================================================

import { Response, ProcessedResponse, ResponseType } from '../types';
import { OnlineStatistics, zScore } from '../utils/statistics';

/**
 * Dual-process classifier state (tracks running statistics)
 */
export class DualProcessClassifier {
  private rtStats: OnlineStatistics;
  private rtByDifficulty: Map<string, OnlineStatistics>;

  // Thresholds for classification
  private rtThreshold: number;      // Z-score threshold for "fast"
  private confidenceThreshold: number; // Confidence threshold for "high"

  constructor(
    rtThreshold: number = -0.5,
    confidenceThreshold: number = 0.7
  ) {
    this.rtStats = new OnlineStatistics();
    this.rtByDifficulty = new Map();
    this.rtThreshold = rtThreshold;
    this.confidenceThreshold = confidenceThreshold;
  }

  /**
   * Normalize RT within learner
   */
  normalizeRT(tau: number): number {
    if (this.rtStats.count < 5) {
      // Not enough data, return 0 (neutral)
      return 0;
    }
    return zScore(tau, this.rtStats.mean, this.rtStats.std);
  }

  /**
   * Normalize RT by item difficulty
   */
  normalizeRTByDifficulty(tau: number, difficulty_bin: string): number {
    const stats = this.rtByDifficulty.get(difficulty_bin);
    if (!stats || stats.count < 3) {
      return this.normalizeRT(tau);
    }
    return zScore(tau, stats.mean, stats.std);
  }

  /**
   * Compute dual-process score (RT × confidence interaction)
   * Higher score = more Type 1 (automatic)
   */
  computeDualProcessScore(normalized_rt: number, confidence: number): number {
    // Fast (negative z-score) + high confidence = positive score (Type 1)
    // Slow (positive z-score) + low confidence = negative score (Type 2)
    return confidence - (normalized_rt * 0.5 + 0.5);
  }

  /**
   * Classify response type
   */
  classifyResponseType(
    normalized_rt: number,
    confidence: number,
    correctness: boolean
  ): ResponseType {
    // Only classify correct responses (errors are ambiguous)
    if (!correctness) {
      return ResponseType.TYPE2_DELIBERATE; // Default for errors
    }

    const isFast = normalized_rt < this.rtThreshold;
    const isHighConfidence = confidence > this.confidenceThreshold;

    if (isFast && isHighConfidence) {
      return ResponseType.TYPE1_AUTOMATIC;
    } else {
      return ResponseType.TYPE2_DELIBERATE;
    }
  }

  /**
   * Get interval multiplier based on response type
   */
  getIntervalMultiplier(responseType: ResponseType, correctness: boolean): number {
    if (!correctness) {
      return 0.5; // Shorter interval for errors
    }

    if (responseType === ResponseType.TYPE1_AUTOMATIC) {
      return 1.2; // Slightly longer interval for automatized responses
    } else {
      return 1.0; // Standard interval for deliberate responses
    }
  }

  /**
   * Update running statistics with new response
   */
  updateStatistics(response: Response, difficulty_bin: string): void {
    this.rtStats.update(response.response_time);

    if (!this.rtByDifficulty.has(difficulty_bin)) {
      this.rtByDifficulty.set(difficulty_bin, new OnlineStatistics());
    }
    this.rtByDifficulty.get(difficulty_bin)!.update(response.response_time);
  }

  /**
   * Process a response and return enriched version
   */
  processResponse(response: Response, difficulty_bin: string): ProcessedResponse {
    // Update statistics first
    this.updateStatistics(response, difficulty_bin);

    // Normalize RT
    const normalized_rt = this.normalizeRTByDifficulty(
      response.response_time,
      difficulty_bin
    );

    // Compute score and classify
    const dual_process_score = this.computeDualProcessScore(
      normalized_rt,
      response.confidence
    );

    const response_type = this.classifyResponseType(
      normalized_rt,
      response.confidence,
      response.correctness
    );

    // Calculate Brier score
    const outcome = response.correctness ? 1 : 0;
    const brier_score = (response.confidence - outcome) ** 2;

    return {
      ...response,
      response_type,
      normalized_rt,
      dual_process_score,
      brier_score,
    };
  }

  /**
   * Reset classifier state
   */
  reset(): void {
    this.rtStats.reset();
    this.rtByDifficulty.clear();
  }
}

/**
 * Get difficulty bin label for an item
 */
export function getDifficultyBin(difficulty: number): string {
  if (difficulty < 0.33) return 'easy';
  if (difficulty < 0.67) return 'medium';
  return 'hard';
}
