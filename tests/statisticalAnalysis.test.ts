import {
  computeStats,
  computeEffectSize,
  formatStats,
  StatisticalResult,
} from '../src/simulation/statisticalAnalysis';

describe('Statistical Analysis', () => {
  describe('computeStats', () => {
    it('should compute correct mean for known values', () => {
      const result = computeStats([2, 4, 6, 8, 10]);
      expect(result.mean).toBeCloseTo(6.0, 5);
    });

    it('should compute correct SD for known values', () => {
      // SD of [2,4,6,8,10] = sqrt(10) ≈ 3.162
      const result = computeStats([2, 4, 6, 8, 10]);
      expect(result.sd).toBeCloseTo(Math.sqrt(10), 2);
    });

    it('should compute 95% CI that contains the mean', () => {
      const result = computeStats([2, 4, 6, 8, 10]);
      expect(result.ci95_lower).toBeLessThan(result.mean);
      expect(result.ci95_upper).toBeGreaterThan(result.mean);
    });

    it('should compute correct CI for n=5 using t=2.776', () => {
      // For [2,4,6,8,10]: mean=6, sd=sqrt(10)≈3.162, se=3.162/sqrt(5)≈1.414
      // CI = 6 ± 2.776 * 1.414 = 6 ± 3.926 → [2.074, 9.926]
      const result = computeStats([2, 4, 6, 8, 10]);
      const se = result.sd / Math.sqrt(5);
      const halfWidth = 2.776 * se;
      expect(result.ci95_lower).toBeCloseTo(result.mean - halfWidth, 1);
      expect(result.ci95_upper).toBeCloseTo(result.mean + halfWidth, 1);
    });

    it('should return n equal to input length', () => {
      const result = computeStats([1, 2, 3, 4, 5]);
      expect(result.n).toBe(5);
    });

    it('should narrow CI with larger sample size', () => {
      const small = computeStats([2, 4, 6, 8, 10]);
      // Create a larger sample with same mean and similar spread
      const large = computeStats(Array.from({ length: 100 }, (_, i) => (i % 5) * 2 + 2));
      const smallWidth = small.ci95_upper - small.ci95_lower;
      const largeWidth = large.ci95_upper - large.ci95_lower;
      expect(largeWidth).toBeLessThan(smallWidth);
    });

    // Edge cases
    it('should handle single value', () => {
      const result = computeStats([5.0]);
      expect(result.mean).toBe(5.0);
      expect(result.sd).toBe(0);
      expect(result.ci95_lower).toBe(5.0);
      expect(result.ci95_upper).toBe(5.0);
      expect(result.n).toBe(1);
      expect(Number.isNaN(result.ci95_lower)).toBe(false);
      expect(Number.isFinite(result.ci95_upper)).toBe(true);
    });

    it('should handle all identical values', () => {
      const result = computeStats([3, 3, 3, 3]);
      expect(result.mean).toBe(3);
      expect(result.sd).toBe(0);
      expect(result.ci95_lower).toBe(3);
      expect(result.ci95_upper).toBe(3);
    });

    it('should handle two values', () => {
      const result = computeStats([0, 10]);
      expect(result.mean).toBe(5.0);
      expect(result.ci95_lower).toBeLessThan(result.mean);
      expect(result.ci95_upper).toBeGreaterThan(result.mean);
      // With n=2, df=1, t=12.706 → very wide CI
      const width = result.ci95_upper - result.ci95_lower;
      expect(width).toBeGreaterThan(10); // CI should be very wide
    });

    it('should handle empty array', () => {
      const result = computeStats([]);
      expect(result.mean).toBe(0);
      expect(result.sd).toBe(0);
      expect(result.n).toBe(0);
    });

    it('should produce symmetric CI around the mean', () => {
      const result = computeStats([1, 2, 3, 4, 5, 6, 7]);
      const lowerDist = result.mean - result.ci95_lower;
      const upperDist = result.ci95_upper - result.mean;
      expect(lowerDist).toBeCloseTo(upperDist, 10);
    });
  });

  describe('computeEffectSize', () => {
    it('should return large effect for well-separated groups', () => {
      // Groups need within-group variance for pooled SD to be nonzero
      const result = computeEffectSize([10, 11, 12], [1, 2, 3]);
      expect(result.cohens_d).toBeGreaterThan(0);
      expect(result.interpretation).toBe('large');
    });

    it('should return negligible effect for identical groups', () => {
      const result = computeEffectSize([5.0, 5.1, 4.9], [5.0, 5.1, 4.9]);
      expect(Math.abs(result.cohens_d)).toBeLessThan(0.2);
      expect(result.interpretation).toBe('negligible');
    });

    it('should return positive d when group1 > group2', () => {
      const result = computeEffectSize([6, 7, 8], [5, 6, 7]);
      expect(result.cohens_d).toBeGreaterThan(0);
    });

    it('should return negative d when group1 < group2', () => {
      const result = computeEffectSize([1, 2, 3], [5, 6, 7]);
      expect(result.cohens_d).toBeLessThan(0);
    });

    // Threshold tests
    it('should classify |d| < 0.20 as negligible', () => {
      // Two groups with very small difference
      const g1 = [5.00, 5.01, 5.02, 4.99, 4.98];
      const g2 = [5.00, 4.99, 5.01, 5.00, 5.00];
      const result = computeEffectSize(g1, g2);
      expect(result.interpretation).toBe('negligible');
    });

    it('should classify |d| >= 0.80 as large', () => {
      // Create groups with large separation relative to SD
      const g1 = [10, 11, 12, 10, 11];
      const g2 = [2, 3, 4, 2, 3];
      const result = computeEffectSize(g1, g2);
      expect(Math.abs(result.cohens_d)).toBeGreaterThanOrEqual(0.8);
      expect(result.interpretation).toBe('large');
    });

    it('should handle zero-variance groups', () => {
      const result = computeEffectSize([5, 5, 5], [5, 5, 5]);
      expect(result.cohens_d).toBe(0);
      expect(result.interpretation).toBe('negligible');
    });
  });

  describe('formatStats', () => {
    it('should format result with default decimals', () => {
      const result: StatisticalResult = {
        mean: 0.72, sd: 0.05, ci95_lower: 0.67, ci95_upper: 0.77, n: 30,
      };
      const formatted = formatStats(result);
      expect(formatted).toContain('0.720');
      expect(formatted).toContain('±');
      expect(formatted).toContain('[');
    });

    it('should respect custom decimal places', () => {
      const result: StatisticalResult = {
        mean: 0.72, sd: 0.05, ci95_lower: 0.67, ci95_upper: 0.77, n: 30,
      };
      const formatted = formatStats(result, 1);
      expect(formatted).toContain('0.7');
    });
  });
});
