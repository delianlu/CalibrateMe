import {
  baseInterval,
  calibrationAdjustment,
  dualProcessAdjustment,
  computeNextReviewInterval,
} from '../src/scheduler/calibrationAwareScheduler';
import { ResponseType, ProcessedResponse, SystemBelief } from '../src/types';

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
});
