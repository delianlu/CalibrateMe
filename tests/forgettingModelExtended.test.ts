import {
  applyForgetting,
  daysSinceReview,
  predictForgottenKnowledge,
  optimalReviewTime,
  applyLearning,
  calculateRetention,
  applyItemForgetting,
  applyBatchForgetting,
} from '../src/memory/forgettingModel';
import { Item } from '../src/types';

function makeItem(K_star: number, lastReview: Date | null = null): Item {
  return {
    id: 'test-item',
    difficulty: 0.5,
    true_state: { K_star, last_review: lastReview },
    system_belief: { K_hat: 0.5, beta_hat: 0, next_review: new Date(), interval_days: 1, ease_factor: 2.5 },
    review_history: [],
  };
}

describe('Forgetting Model (Extended)', () => {
  describe('applyForgetting', () => {
    it('should return K_star when delta_t = 0', () => {
      expect(applyForgetting(0.8, 0.1, 0)).toBe(0.8);
    });

    it('should decay knowledge over time', () => {
      const initial = 0.9;
      const after1day = applyForgetting(initial, 0.1, 1);
      const after7days = applyForgetting(initial, 0.1, 7);
      expect(after1day).toBeLessThan(initial);
      expect(after7days).toBeLessThan(after1day);
    });

    it('should decay faster with higher lambda', () => {
      const slow = applyForgetting(0.9, 0.05, 5);
      const fast = applyForgetting(0.9, 0.2, 5);
      expect(fast).toBeLessThan(slow);
    });

    it('should never go negative', () => {
      const result = applyForgetting(0.5, 0.5, 100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should approach 0 as time increases', () => {
      const result = applyForgetting(1.0, 0.1, 1000);
      expect(result).toBeCloseTo(0, 5);
    });
  });

  describe('daysSinceReview', () => {
    it('should return 0 for null lastReview', () => {
      expect(daysSinceReview(null)).toBe(0);
    });

    it('should return positive days for past review', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const days = daysSinceReview(threeDaysAgo, new Date());
      expect(days).toBeCloseTo(3, 0);
    });

    it('should return 0 for same-time review', () => {
      const now = new Date();
      expect(daysSinceReview(now, now)).toBe(0);
    });
  });

  describe('predictForgottenKnowledge', () => {
    it('should equal applyForgetting', () => {
      const result = predictForgottenKnowledge(0.8, 0.1, 5);
      const expected = applyForgetting(0.8, 0.1, 5);
      expect(result).toBe(expected);
    });
  });

  describe('optimalReviewTime', () => {
    it('should return 0 when K_star <= threshold', () => {
      expect(optimalReviewTime(0.5, 0.1, 0.7)).toBe(0);
    });

    it('should return Infinity when lambda = 0', () => {
      expect(optimalReviewTime(0.9, 0, 0.7)).toBe(Infinity);
    });

    it('should return positive time when K_star > threshold', () => {
      const time = optimalReviewTime(0.95, 0.1, 0.7);
      expect(time).toBeGreaterThan(0);
    });

    it('higher K_star should give longer review time', () => {
      const t1 = optimalReviewTime(0.8, 0.1, 0.7);
      const t2 = optimalReviewTime(0.95, 0.1, 0.7);
      expect(t2).toBeGreaterThan(t1);
    });

    it('higher lambda should give shorter review time', () => {
      const t1 = optimalReviewTime(0.9, 0.05, 0.7);
      const t2 = optimalReviewTime(0.9, 0.2, 0.7);
      expect(t2).toBeLessThan(t1);
    });
  });

  describe('applyLearning', () => {
    it('should increase K_star on correct response', () => {
      const result = applyLearning(0.5, true, 0.2, 0.05);
      expect(result).toBeGreaterThan(0.5);
    });

    it('should increase K_star (less) on incorrect response', () => {
      const result = applyLearning(0.5, false, 0.2, 0.05);
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThan(applyLearning(0.5, true, 0.2, 0.05));
    });

    it('should never exceed 1.0', () => {
      const result = applyLearning(0.99, true, 0.5, 0.1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('correct learning = K + alpha * (1 - K)', () => {
      const K = 0.6;
      const alpha = 0.2;
      const expected = K + alpha * (1 - K);
      expect(applyLearning(K, true, alpha, 0.05)).toBeCloseTo(expected);
    });

    it('error learning = K + alpha_err * (1 - K)', () => {
      const K = 0.6;
      const alpha_err = 0.05;
      const expected = K + alpha_err * (1 - K);
      expect(applyLearning(K, false, 0.2, alpha_err)).toBeCloseTo(expected);
    });
  });

  describe('calculateRetention', () => {
    it('should return high retention for recent review', () => {
      const retention = calculateRetention(0.9, 0.1, 0);
      expect(retention).toBeGreaterThan(0.8);
    });

    it('should return lower retention for delayed review', () => {
      const r0 = calculateRetention(0.9, 0.1, 0);
      const r7 = calculateRetention(0.9, 0.1, 7);
      expect(r7).toBeLessThan(r0);
    });

    it('should account for guess probability', () => {
      // Even with K_star = 0, retention should be >= guess
      const retention = calculateRetention(0, 0.1, 100, 0.1, 0.2);
      expect(retention).toBeCloseTo(0.2, 1); // Approximately guess rate
    });

    it('should account for slip probability', () => {
      // With K_star = 1 and no decay, retention = 1 - slip
      const retention = calculateRetention(1, 0, 0, 0.1, 0.2);
      expect(retention).toBeCloseTo(0.9, 1);
    });
  });

  describe('applyItemForgetting', () => {
    it('should not change item with no last review', () => {
      const item = makeItem(0.9, null);
      const result = applyItemForgetting(item, 0.1);
      expect(result.true_state.K_star).toBe(0.9);
    });

    it('should decay K_star for item with past review', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const item = makeItem(0.9, threeDaysAgo);
      const result = applyItemForgetting(item, 0.1, new Date());
      expect(result.true_state.K_star).toBeLessThan(0.9);
    });
  });

  describe('applyBatchForgetting', () => {
    it('should apply forgetting to all items', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const items = [makeItem(0.9, threeDaysAgo), makeItem(0.8, threeDaysAgo)];
      const result = applyBatchForgetting(items, 0.1, new Date());

      expect(result.length).toBe(2);
      expect(result[0].true_state.K_star).toBeLessThan(0.9);
      expect(result[1].true_state.K_star).toBeLessThan(0.8);
    });
  });
});
