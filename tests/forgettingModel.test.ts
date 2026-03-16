import {
  applyForgetting,
  optimalReviewTime,
  calculateRetention,
  applyLearning,
  daysSinceReview,
  predictForgottenKnowledge,
  applyItemForgetting,
  applyBatchForgetting,
} from '../src/memory/forgettingModel';
import { Item, ItemType } from '../src/types';

describe('Forgetting Model', () => {
  describe('applyForgetting', () => {
    it('should return same value for 0 time elapsed', () => {
      expect(applyForgetting(0.8, 0.1, 0)).toBe(0.8);
    });

    it('should decay knowledge over time', () => {
      const K_initial = 0.9;
      const K_after = applyForgetting(K_initial, 0.1, 7);
      expect(K_after).toBeLessThan(K_initial);
    });

    it('should decay faster with higher lambda', () => {
      const K_initial = 0.9;
      const K_slow = applyForgetting(K_initial, 0.05, 7);
      const K_fast = applyForgetting(K_initial, 0.15, 7);
      expect(K_fast).toBeLessThan(K_slow);
    });

    it('should follow exponential decay formula', () => {
      const K_initial = 1.0;
      const lambda = 0.1;
      const t = 10;
      const expected = Math.exp(-lambda * t);
      expect(applyForgetting(K_initial, lambda, t)).toBeCloseTo(expected, 5);
    });
  });

  describe('optimalReviewTime', () => {
    it('should return 0 if knowledge is already below threshold', () => {
      expect(optimalReviewTime(0.5, 0.1, 0.7)).toBe(0);
    });

    it('should return correct time for knowledge to decay to threshold', () => {
      // K* = 1.0, threshold = 0.5, lambda = 0.1
      // 0.5 = 1.0 * e^(-0.1 * t)
      // t = -ln(0.5) / 0.1 ≈ 6.93
      const t = optimalReviewTime(1.0, 0.1, 0.5);
      expect(t).toBeCloseTo(6.93, 1);
    });
  });

  describe('calculateRetention', () => {
    it('should return high retention for high knowledge', () => {
      const retention = calculateRetention(0.9, 0.1, 1);
      expect(retention).toBeGreaterThan(0.7);
    });

    it('should return lower retention over longer delays', () => {
      const K_star = 0.8;
      const lambda = 0.1;
      const ret1 = calculateRetention(K_star, lambda, 1);
      const ret7 = calculateRetention(K_star, lambda, 7);
      const ret30 = calculateRetention(K_star, lambda, 30);

      expect(ret1).toBeGreaterThan(ret7);
      expect(ret7).toBeGreaterThan(ret30);
    });
  });

  describe('applyLearning', () => {
    it('should increase knowledge on correct response', () => {
      const K_before = 0.5;
      const K_after = applyLearning(K_before, true, 0.2, 0.1);
      expect(K_after).toBeGreaterThan(K_before);
    });

    it('should increase knowledge on incorrect response (less)', () => {
      const K_before = 0.5;
      const K_correct = applyLearning(K_before, true, 0.2, 0.1);
      const K_error = applyLearning(K_before, false, 0.2, 0.1);
      expect(K_error).toBeGreaterThan(K_before);
      expect(K_error).toBeLessThan(K_correct);
    });

    it('should approach 1.0 asymptotically', () => {
      let K = 0.5;
      for (let i = 0; i < 100; i++) {
        K = applyLearning(K, true, 0.2, 0.1);
      }
      expect(K).toBeGreaterThan(0.99);
      expect(K).toBeLessThanOrEqual(1.0);
    });
  });

  describe('daysSinceReview', () => {
    it('should return 0 if lastReview is null', () => {
      expect(daysSinceReview(null)).toBe(0);
    });

    it('should calculate correct days elapsed', () => {
      const now = new Date('2026-03-16T12:00:00Z');
      const last = new Date('2026-03-14T12:00:00Z');
      expect(daysSinceReview(last, now)).toBe(2);
    });
  });

  describe('predictForgottenKnowledge', () => {
    it('should call applyForgetting internally', () => {
      expect(predictForgottenKnowledge(0.8, 0.1, 5)).toBe(applyForgetting(0.8, 0.1, 5));
    });
  });

  describe('applyItemForgetting', () => {
    it('should not decay if delta is 0', () => {
      const now = new Date();
      const item: Item = {
        id: '1',
        type: ItemType.VOCABULARY,
        target: 'test',
        true_state: { K_star: 0.9, last_review: now },
      };
      
      const result = applyItemForgetting(item, 0.1, now);
      expect(result).toBe(item); // Should return same reference
    });
    
    it('should decay knowledge if time has passed', () => {
      const now = new Date('2026-03-16T12:00:00Z');
      const last = new Date('2026-03-14T12:00:00Z'); // 2 days ago
      const item: Item = {
        id: '1',
        type: ItemType.VOCABULARY,
        target: 'test',
        true_state: { K_star: 0.9, last_review: last },
      };
      
      const result = applyItemForgetting(item, 0.1, now);
      expect(result).not.toBe(item);
      expect(result.true_state.K_star).toBeLessThan(0.9);
      expect(result.true_state.K_star).toBe(applyForgetting(0.9, 0.1, 2));
    });
  });

  describe('applyBatchForgetting', () => {
    it('should apply forgetting to an array of items', () => {
      const now = new Date('2026-03-16T12:00:00Z');
      const last = new Date('2026-03-14T12:00:00Z');
      const items: Item[] = [
        { id: '1', item_type: ItemType.VOCABULARY, target: 'test1', true_state: { K_star: 0.9, last_review: last } } as Item,
        { id: '2', item_type: ItemType.VOCABULARY, target: 'test2', true_state: { K_star: 0.8, last_review: last } } as Item,
      ];
      
      const results = applyBatchForgetting(items, 0.1, now);
      expect(results.length).toBe(2);
      expect(results[0].true_state.K_star).toBeLessThan(0.9);
      expect(results[1].true_state.K_star).toBeLessThan(0.8);
    });
  });
});
