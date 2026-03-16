import { mean, variance, std, OnlineStatistics, zScore, cohensD } from '../src/utils/statistics';

describe('Statistics Utils', () => {
  describe('mean', () => {
    it('returns 0 for empty array', () => expect(mean([])).toBe(0));
    it('calculates mean correctly', () => expect(mean([1, 2, 3])).toBe(2));
  });

  describe('variance', () => {
    it('returns 0 for length < 2', () => expect(variance([1])).toBe(0));
    it('calculates sample variance', () => expect(variance([1, 2, 3])).toBe(1));
  });

  describe('std', () => {
    it('calculates standard deviation', () => expect(std([1, 2, 3])).toBe(1));
  });

  describe('OnlineStatistics', () => {
    it('calculates running stats', () => {
      const stats = new OnlineStatistics();
      expect(stats.count).toBe(0);
      expect(stats.variance).toBe(0);

      stats.update(1);
      stats.update(2);
      stats.update(3);

      expect(stats.count).toBe(3);
      expect(stats.mean).toBe(2);
      expect(stats.variance).toBe(1);
      expect(stats.std).toBe(1);

      stats.reset();
      expect(stats.count).toBe(0);
    });
  });

  describe('zScore', () => {
    it('returns 0 if std is 0', () => expect(zScore(5, 5, 0)).toBe(0));
    it('calculates z-score correctly', () => expect(zScore(3, 2, 0.5)).toBe(2));
  });

  describe('cohensD', () => {
    it('returns 0 for 0 pooled variance', () => expect(cohensD([1, 1], [1, 1])).toBe(0));
    it('calculates Cohens d', () => expect(cohensD([2, 4], [1, 3])).toBeCloseTo(0.707, 3));
  });
});
