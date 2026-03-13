// =============================================================================
// Statistical Implementation Validation Script
// Compares custom implementations against known correct values (from R / SciPy)
// Run: npx tsx scripts/validateStatistics.ts
// =============================================================================

import { computeStats, computeEffectSize } from '../src/simulation/statisticalAnalysis';
import { mean, std, cohensD } from '../src/utils/statistics';

interface TestCase {
  name: string;
  run: () => { passed: boolean; detail: string };
}

const TOLERANCE = 0.01;

function approxEqual(a: number, b: number, tol: number = TOLERANCE): boolean {
  return Math.abs(a - b) < tol;
}

// ---------------------------------------------------------------------------
// Test cases with pre-computed correct answers
// ---------------------------------------------------------------------------

const testCases: TestCase[] = [
  // Test 1: computeStats basic — [2, 4, 6, 8, 10]
  // Expected: mean=6.0, sd≈3.162, n=5
  // For 95% CI with df=4: t=2.776
  // SE = 3.162 / √5 ≈ 1.414
  // CI = 6.0 ± 2.776 × 1.414 = 6.0 ± 3.926 → [2.074, 9.926]
  {
    name: 'computeStats: basic descriptive statistics with t-distribution CI',
    run: () => {
      const result = computeStats([2, 4, 6, 8, 10]);
      const checks = [
        approxEqual(result.mean, 6.0),
        approxEqual(result.sd, 3.162, 0.01),
        result.n === 5,
        approxEqual(result.ci95_lower, 2.074, 0.05),
        approxEqual(result.ci95_upper, 9.926, 0.05),
      ];
      return {
        passed: checks.every(Boolean),
        detail: `mean=${result.mean.toFixed(4)} (exp 6.0), sd=${result.sd.toFixed(4)} (exp 3.162), ` +
          `CI=[${result.ci95_lower.toFixed(4)}, ${result.ci95_upper.toFixed(4)}] (exp [2.074, 9.926])`,
      };
    },
  },

  // Test 2: computeEffectSize — two clearly separated groups
  // Group A: [10, 12, 14, 16, 18], Group B: [5, 7, 9, 11, 13]
  // Mean A = 14, Mean B = 9, diff = 5
  // SD_A = SD_B = √10 ≈ 3.162
  // Pooled SD = √((4×10 + 4×10) / 8) = √10 ≈ 3.162
  // Cohen's d = 5 / 3.162 ≈ 1.581 → "large"
  {
    name: 'computeEffectSize: large effect size with equal variances',
    run: () => {
      const result = computeEffectSize([10, 12, 14, 16, 18], [5, 7, 9, 11, 13]);
      return {
        passed: approxEqual(result.cohens_d, 1.581, 0.01) && result.interpretation === 'large',
        detail: `d=${result.cohens_d.toFixed(4)} (exp 1.581), interpretation="${result.interpretation}" (exp "large")`,
      };
    },
  },

  // Test 3: Paired t-test via paired differences
  // Differences: [1.2, 0.8, 1.5, 0.3, 1.0, 0.7, 1.1, 0.9, 0.6, 1.3]
  // n=10, mean=0.94, sd≈0.3502
  // SE = 0.3502 / √10 ≈ 0.1108
  // t = 0.94 / 0.1108 ≈ 8.485
  // df=9, p << 0.001 (two-tailed)
  // We verify mean and sd of the differences using our utils,
  // then use computeStats CI (df=9, t_crit=2.262):
  // CI = 0.94 ± 2.262 × 0.1108 ≈ [0.690, 1.190]
  {
    name: 'Paired differences: mean, sd, and 95% CI',
    run: () => {
      const diffs = [1.2, 0.8, 1.5, 0.3, 1.0, 0.7, 1.1, 0.9, 0.6, 1.3];
      const m = mean(diffs);
      const s = std(diffs);
      const stats = computeStats(diffs);
      const se = s / Math.sqrt(diffs.length);
      const t = m / se;
      const checks = [
        approxEqual(m, 0.94, 0.01),
        approxEqual(s, 0.3502, 0.02),
        t > 6.0, // t should be ~8.49, well above any reasonable threshold
        approxEqual(stats.ci95_lower, 0.690, 0.05),
        approxEqual(stats.ci95_upper, 1.190, 0.05),
      ];
      return {
        passed: checks.every(Boolean),
        detail: `mean=${m.toFixed(4)} (exp 0.94), sd=${s.toFixed(4)} (exp 0.350), ` +
          `t=${t.toFixed(3)} (exp ~8.49), CI=[${stats.ci95_lower.toFixed(4)}, ${stats.ci95_upper.toFixed(4)}] (exp [0.690, 1.190])`,
      };
    },
  },

  // Test 4: Cohen's d edge cases
  // Same group → d = 0, interpretation "negligible"
  {
    name: 'computeEffectSize: identical groups → negligible',
    run: () => {
      const result = computeEffectSize([5, 6, 7, 8, 9], [5, 6, 7, 8, 9]);
      return {
        passed: approxEqual(result.cohens_d, 0.0, 0.001) && result.interpretation === 'negligible',
        detail: `d=${result.cohens_d.toFixed(4)} (exp 0.0), interpretation="${result.interpretation}" (exp "negligible")`,
      };
    },
  },

  // Test 5: Small effect size
  // Group A: [10, 11, 12, 13, 14], Group B: [9, 10, 11, 12, 13]
  // Mean diff = 1.0, Pooled SD = √2.5 ≈ 1.581
  // d = 1.0 / 1.581 ≈ 0.632 → "medium"
  {
    name: 'computeEffectSize: medium effect size classification',
    run: () => {
      const result = computeEffectSize([10, 11, 12, 13, 14], [9, 10, 11, 12, 13]);
      return {
        passed: approxEqual(result.cohens_d, 0.632, 0.02) && result.interpretation === 'medium',
        detail: `d=${result.cohens_d.toFixed(4)} (exp 0.632), interpretation="${result.interpretation}" (exp "medium")`,
      };
    },
  },

  // Test 6: computeStats with larger n (df=29, t≈2.045)
  // 30 values: 1..30 → mean=15.5, sd≈8.803
  // SE = 8.803/√30 ≈ 1.607
  // CI = 15.5 ± 2.045 × 1.607 ≈ [12.213, 18.787]
  {
    name: 'computeStats: larger sample (n=30) with interpolated t-critical',
    run: () => {
      const values = Array.from({ length: 30 }, (_, i) => i + 1);
      const result = computeStats(values);
      const checks = [
        approxEqual(result.mean, 15.5, 0.01),
        approxEqual(result.sd, 8.803, 0.05),
        result.n === 30,
        approxEqual(result.ci95_lower, 12.213, 0.15),
        approxEqual(result.ci95_upper, 18.787, 0.15),
      ];
      return {
        passed: checks.every(Boolean),
        detail: `mean=${result.mean.toFixed(4)} (exp 15.5), sd=${result.sd.toFixed(4)} (exp 8.803), ` +
          `CI=[${result.ci95_lower.toFixed(4)}, ${result.ci95_upper.toFixed(4)}] (exp [12.213, 18.787])`,
      };
    },
  },

  // Test 7: cohensD direct — verifies the pooled SD formula
  // Group A: [100, 200, 300], Group B: [110, 210, 310]
  // Mean diff = -10, pooled SD = √((2*10000 + 2*10000)/4) = 100
  // d = -10/100 = -0.1 → negligible
  {
    name: 'cohensD: direct utility function with known pooled SD',
    run: () => {
      const d = cohensD([100, 200, 300], [110, 210, 310]);
      return {
        passed: approxEqual(d, -0.1, 0.01),
        detail: `d=${d.toFixed(4)} (exp -0.100)`,
      };
    },
  },

  // Test 8: computeStats edge — single value
  {
    name: 'computeStats: single value returns point estimate with zero CI width',
    run: () => {
      const result = computeStats([42]);
      const passed = result.mean === 42 && result.sd === 0 &&
        result.ci95_lower === 42 && result.ci95_upper === 42 && result.n === 1;
      return {
        passed,
        detail: `mean=${result.mean}, sd=${result.sd}, CI=[${result.ci95_lower}, ${result.ci95_upper}]`,
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

console.log('='.repeat(70));
console.log('CalibrateMe — Statistical Implementation Validation');
console.log('='.repeat(70));
console.log();

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  const { passed, detail } = tc.run();
  const status = passed ? 'PASS' : 'FAIL';
  const marker = passed ? '\u2713' : '\u2717';

  console.log(`[${status}] ${marker}  ${tc.name}`);
  console.log(`       ${detail}`);
  console.log();

  if (passed) passCount++;
  else failCount++;
}

console.log('='.repeat(70));
console.log(`Results: ${passCount} passed, ${failCount} failed, ${testCases.length} total`);
console.log('='.repeat(70));

process.exit(failCount > 0 ? 1 : 0);
