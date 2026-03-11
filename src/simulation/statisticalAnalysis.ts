// =============================================================================
// Statistical Analysis Module
// Provides inferential statistics: mean, SD, 95% CI, Cohen's d, t-tests
// =============================================================================

import { mean, std, cohensD } from '../utils/statistics';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StatisticalResult {
  mean: number;
  sd: number;
  ci95_lower: number;
  ci95_upper: number;
  n: number;
}

export interface EffectSize {
  cohens_d: number;
  interpretation: 'negligible' | 'small' | 'medium' | 'large';
}

// -----------------------------------------------------------------------------
// t-distribution critical values for two-tailed 95% CI
// For df = n-1. We store values for small n; for larger n, approximate with 1.96.
// -----------------------------------------------------------------------------

const T_CRITICAL_95: Record<number, number> = {
  1: 12.706,  2: 4.303,  3: 3.182,  4: 2.776,  5: 2.571,
  6: 2.447,   7: 2.365,  8: 2.306,  9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  25: 2.060, 30: 2.042, 40: 2.021, 60: 2.000, 120: 1.980,
};

function tCritical(df: number): number {
  if (df <= 0) return 1.96;
  if (T_CRITICAL_95[df]) return T_CRITICAL_95[df];
  // Find closest key
  const keys = Object.keys(T_CRITICAL_95).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (df >= keys[i] && df <= keys[i + 1]) {
      // Linear interpolation
      const ratio = (df - keys[i]) / (keys[i + 1] - keys[i]);
      return T_CRITICAL_95[keys[i]] * (1 - ratio) + T_CRITICAL_95[keys[i + 1]] * ratio;
    }
  }
  return 1.96; // large sample approximation
}

// -----------------------------------------------------------------------------
// Core Functions
// -----------------------------------------------------------------------------

/**
 * Compute descriptive statistics with 95% confidence interval (t-distribution)
 */
export function computeStats(values: number[]): StatisticalResult {
  const n = values.length;
  if (n === 0) {
    return { mean: 0, sd: 0, ci95_lower: 0, ci95_upper: 0, n: 0 };
  }
  if (n === 1) {
    return { mean: values[0], sd: 0, ci95_lower: values[0], ci95_upper: values[0], n: 1 };
  }

  const m = mean(values);
  const s = std(values);
  const se = s / Math.sqrt(n);
  const t = tCritical(n - 1);

  return {
    mean: m,
    sd: s,
    ci95_lower: m - t * se,
    ci95_upper: m + t * se,
    n,
  };
}

/**
 * Compute Cohen's d effect size with interpretation per Cohen's conventions
 */
export function computeEffectSize(group1: number[], group2: number[]): EffectSize {
  const d = cohensD(group1, group2);
  const absD = Math.abs(d);

  let interpretation: EffectSize['interpretation'];
  if (absD < 0.2) interpretation = 'negligible';
  else if (absD < 0.5) interpretation = 'small';
  else if (absD < 0.8) interpretation = 'medium';
  else interpretation = 'large';

  return { cohens_d: d, interpretation };
}

/**
 * Format a StatisticalResult as a compact string: "0.72 ± 0.05 [0.67, 0.77]"
 */
export function formatStats(result: StatisticalResult, decimals: number = 3): string {
  const m = result.mean.toFixed(decimals);
  const s = result.sd.toFixed(decimals);
  const lo = result.ci95_lower.toFixed(decimals);
  const hi = result.ci95_upper.toFixed(decimals);
  return `${m} ± ${s} [${lo}, ${hi}]`;
}
