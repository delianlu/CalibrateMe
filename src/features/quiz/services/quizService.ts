// =============================================================================
// Quiz Service
// Bridges quiz UI with CalibrateMe core scheduling + BKT modules
// =============================================================================

import { QuizItem, QuizResponse } from '../types';
import {
  SystemBelief,
  SimulationConfig,
  SchedulerType,
  DEFAULT_SIMULATION_CONFIG,
  ProcessedResponse,
  Item,
} from '../../../types';
import { CalibrateMeScheduler } from '../../../scheduler/calibrationAwareScheduler';
import { updateBelief, updateBetaHat } from '../../../bkt/beliefUpdateEngine';
import { DualProcessClassifier, getDifficultyBin } from '../../../dualProcess/classifier';
import { calculateCalibrationMetrics } from '../../../calibration/scoringModule';

/**
 * Manages CalibrateMe scheduling state for a live quiz session.
 * Wraps the core engine modules so the UI only deals with QuizItem/QuizResponse.
 */
export class QuizService {
  private scheduler: CalibrateMeScheduler;
  private systemBelief: SystemBelief;
  private dualProcess: DualProcessClassifier;
  private config: SimulationConfig;
  private allResponses: ProcessedResponse[] = [];
  private items: Map<string, Item> = new Map();

  constructor() {
    this.config = {
      ...DEFAULT_SIMULATION_CONFIG,
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: true,
      enable_dual_process: true,
    };
    this.scheduler = new CalibrateMeScheduler(0.1, true, true, 0.5);
    this.systemBelief = {
      K_hat: 0.3,
      beta_hat: 0,
      confidence_interval: 0.2,
      last_updated: new Date(),
    };
    this.dualProcess = new DualProcessClassifier();
  }

  /**
   * Load quiz items and create corresponding scheduler items.
   */
  loadItems(quizItems: QuizItem[]): void {
    this.items.clear();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const qi of quizItems) {
      this.items.set(qi.id, {
        id: qi.id,
        difficulty: qi.difficulty,
        true_state: { K_star: 0.1, last_review: null },
        system_belief: {
          K_hat: 0.1,
          beta_hat: 0,
          next_review: tomorrow,
          interval_days: 1,
          ease_factor: 2.5,
        },
        review_history: [],
      });
    }
  }

  /**
   * Select items for a session using coverage-aware scheduling.
   */
  selectItems(count: number): string[] {
    const allItems = Array.from(this.items.values());
    const selected = this.scheduler.selectItems(allItems, count);
    return selected.map(item => item.id);
  }

  /**
   * Process a user response: update BKT belief, schedule next review.
   * Returns the processed response with dual-process classification.
   */
  recordResponse(response: QuizResponse): {
    processedResponse: ProcessedResponse;
    updatedBelief: SystemBelief;
  } {
    const item = this.items.get(response.itemId);
    if (!item) throw new Error(`Unknown item: ${response.itemId}`);

    // Convert to core Response type
    const coreResponse = {
      item_id: response.itemId,
      correctness: response.correctness,
      confidence: response.confidence / 100, // 0-100 → 0-1
      response_time: response.responseTime / 1000, // ms → seconds
      timestamp: response.timestamp,
    };

    // Dual-process classification
    const processed = this.dualProcess.processResponse(
      coreResponse,
      getDifficultyBin(item.difficulty)
    );

    // Update BKT belief
    this.systemBelief = updateBelief(coreResponse, this.systemBelief, this.config);

    // Update per-item K-hat
    const itemBelief: SystemBelief = {
      K_hat: item.system_belief.K_hat,
      beta_hat: this.systemBelief.beta_hat,
      confidence_interval: this.systemBelief.confidence_interval,
      last_updated: this.systemBelief.last_updated,
    };
    const updatedItemBelief = updateBelief(coreResponse, itemBelief, this.config);
    item.system_belief.K_hat = updatedItemBelief.K_hat;

    // Update beta_hat from recent responses
    this.allResponses.push(processed);
    const recent = this.allResponses.slice(-20);
    this.systemBelief.beta_hat = updateBetaHat(recent, this.systemBelief.beta_hat);

    // Schedule next review
    const schedule = this.scheduler.processResponse(processed, this.systemBelief);
    item.system_belief.next_review = schedule.nextReview;
    item.system_belief.interval_days = schedule.interval;

    // Record for coverage tracking
    this.scheduler.recordReview(item.id);

    return {
      processedResponse: processed,
      updatedBelief: { ...this.systemBelief },
    };
  }

  /**
   * Get calibration metrics for all responses so far.
   */
  getCalibrationMetrics() {
    if (this.allResponses.length === 0) return null;
    return calculateCalibrationMetrics(this.allResponses);
  }

  /**
   * Get the current system belief state.
   */
  getSystemBelief(): SystemBelief {
    return { ...this.systemBelief };
  }

  /**
   * Get total responses recorded.
   */
  getResponseCount(): number {
    return this.allResponses.length;
  }
}
