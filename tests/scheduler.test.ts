import {
  baseInterval,
  calibrationAdjustment,
  dualProcessAdjustment,
  computeNextReviewInterval,
  selectItemsForReview,
  CalibrateMeScheduler,
} from '../src/scheduler/calibrationAwareScheduler';
import { ResponseType, ProcessedResponse, SystemBelief, Item, ItemType } from '../src/types';

describe('Calibration-Aware Scheduler', () => {
  describe('baseInterval', () => {
    it('should return 1 day for low knowledge', () => {
      expect(baseInterval(0.5, 0.1)).toBe(1);
    });

    it('should return longer intervals for high knowledge', () => {
      const interval = baseInterval(0.95, 0.1);
      expect(interval).toBeGreaterThan(1);
    });

    it('should return longer intervals for low forgetting rates', () => {
      const slowForget = baseInterval(0.9, 0.05);
      const fastForget = baseInterval(0.9, 0.15);
      expect(slowForget).toBeGreaterThan(fastForget);
    });
  });

  describe('calibrationAdjustment', () => {
    it('should return < 1 for overconfident (shorten interval)', () => {
      expect(calibrationAdjustment(0.2)).toBeLessThan(1);
    });

    it('should return > 1 for underconfident (lengthen interval)', () => {
      expect(calibrationAdjustment(-0.2)).toBeGreaterThan(1);
    });

    it('should return 1 for well-calibrated', () => {
      expect(calibrationAdjustment(0)).toBe(1);
    });
  });

  describe('dualProcessAdjustment', () => {
    it('should return 0.5 for errors', () => {
      expect(dualProcessAdjustment(ResponseType.TYPE2_DELIBERATE, false)).toBe(0.5);
    });

    it('should return 1.2 for Type 1 correct', () => {
      expect(dualProcessAdjustment(ResponseType.TYPE1_AUTOMATIC, true)).toBe(1.2);
    });

    it('should return 1.0 for Type 2 correct', () => {
      expect(dualProcessAdjustment(ResponseType.TYPE2_DELIBERATE, true)).toBe(1.0);
    });
  });

  describe('computeNextReviewInterval', () => {
    const belief: SystemBelief = {
      K_hat: 0.8,
      beta_hat: 0.15,
      confidence_interval: 0.1,
      last_updated: new Date(),
    };

    const response: ProcessedResponse = {
      item_id: 'test',
      correctness: true,
      confidence: 0.7,
      response_time: 3,
      timestamp: new Date(),
      response_type: ResponseType.TYPE2_DELIBERATE,
      normalized_rt: 0,
      dual_process_score: 0.5,
      brier_score: 0.09,
    };

    it('should return interval within bounds', () => {
      const interval = computeNextReviewInterval(belief, response, 0.1);
      expect(interval).toBeGreaterThanOrEqual(1);
      expect(interval).toBeLessThanOrEqual(60);
    });

    it('should shorten interval for overconfident learner', () => {
      const overconfident = { ...belief, beta_hat: 0.3 };
      const wellCalibrated = { ...belief, beta_hat: 0 };

      const iOver = computeNextReviewInterval(overconfident, response, 0.1);
      const iWell = computeNextReviewInterval(wellCalibrated, response, 0.1);

      expect(iOver).toBeLessThanOrEqual(iWell);
    });
  });

  describe('CalibrateMeScheduler Edge Cases', () => {
    it('should apply difficulty bonus when enableDifficultySequencing is true', () => {
      const scheduler = new CalibrateMeScheduler(0.1, true, true, 0.5, true, 0.3);
      scheduler.updateKHat(0.5); // Target difficulty will be 0.5

      const now = new Date();
      const createItem = (id: string, diff: number) => ({
        id,
        difficulty: diff,
        true_state: { K_star: 0.5, last_review: now },
        system_belief: { K_hat: 0.5, beta_hat: 0, next_review: now, interval_days: 1, ease_factor: 2.5 },
        review_history: [],
      } as Item);

      // both have same urgency, but item2 is closer to target difficulty
      const item1 = createItem('1', 0.1);
      const item2 = createItem('2', 0.5);
      
      const selected = scheduler.selectItems([item1, item2], 1, now);
      expect(selected[0].id).toBe('2');
    });

    it('should use domain calibration when processing response with item_type', () => {
      const scheduler = new CalibrateMeScheduler(0.1);
      
      const belief: SystemBelief = {
        K_hat: 0.8,
        beta_hat: 0, // General is well-calibrated
        confidence_interval: 0.1,
        last_updated: new Date(),
        domain_calibration: { beta_hat_vocab: 0.5, beta_hat_grammar: -0.5 } // Vocab is overconfident
      };
      
      const response: ProcessedResponse = {
        item_id: 'test',
        item_type: ItemType.VOCABULARY,
        correctness: true,
        confidence: 0.8,
        response_time: 3,
        timestamp: new Date(),
        response_type: ResponseType.TYPE2_DELIBERATE,
        normalized_rt: 0,
        dual_process_score: 0.5,
        brier_score: 0.04,
      };

      const result = scheduler.processResponse(response, belief);
      // Because domain_calibration is used, vocab has beta_hat = 0.5 (overconfident) -> shorter interval
      const baseExpected = baseInterval(0.8, 0.1);
      expect(result.interval).toBeLessThan(baseExpected);
    });

    it('should record reviews and scheduleNext', () => {
      const scheduler = new CalibrateMeScheduler(0.1);
      scheduler.recordReview('test-item');
      
      const belief: SystemBelief = {
        K_hat: 0.8,
        beta_hat: 0,
        confidence_interval: 0.1,
        last_updated: new Date(),
      };
      const response: ProcessedResponse = {
        item_id: 'test-item',
        correctness: true,
        confidence: 0.8,
        response_time: 3,
        timestamp: new Date(),
        response_type: ResponseType.TYPE2_DELIBERATE,
        normalized_rt: 0,
        dual_process_score: 0.5,
        brier_score: 0.04,
      };

      const result = scheduler.scheduleNext({} as Item, belief, response);
      expect(result.interval).toBeGreaterThanOrEqual(1);
      expect(result.nextReview.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('selectItemsForReview standalone', () => {
    it('should select items based on urgency', () => {
      const now = new Date('2026-03-16T12:00:00Z');
      const past = new Date('2026-03-14T12:00:00Z'); // Due 2 days ago
      const future = new Date('2026-03-18T12:00:00Z'); // Due in 2 days
      
      const items: Item[] = [
        { id: 'future', system_belief: { next_review: future } } as Item,
        { id: 'past', system_belief: { next_review: past } } as Item,
      ];

      const selected = selectItemsForReview(items, 1, now);
      expect(selected[0].id).toBe('past'); // more urgent
    });
  });
});
