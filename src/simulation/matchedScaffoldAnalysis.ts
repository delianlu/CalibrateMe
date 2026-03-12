// =============================================================================
// Matched Scaffold Comparison — Paired Within-Subject Design
// Same profile, same seed, with vs. without scaffolding
// =============================================================================

import { SimulationConfig, SchedulerType, DEFAULT_SIMULATION_CONFIG } from '../types';
import { createLearnerProfile } from '../profiles/learnerProfiles';
import { runSimulation, ProgressCallback } from './simulationEngine';
import { computeStats, StatisticalResult } from './statisticalAnalysis';
import { mean, std } from '../utils/statistics';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MatchedPairResult {
  profile: string;
  nSeeds: number;
  retention_with: StatisticalResult;
  retention_without: StatisticalResult;
  retention_diff: StatisticalResult;
  ece_with: StatisticalResult;
  ece_without: StatisticalResult;
  ece_diff: StatisticalResult;
  mastery_with: StatisticalResult;
  mastery_without: StatisticalResult;
  mastery_diff: StatisticalResult;
  paired_cohens_d: number;
  p_value: number;
}

export interface MatchedScaffoldReport {
  results: MatchedPairResult[];
  profiles: string[];
  nSeeds: number;
}

// -----------------------------------------------------------------------------
// Statistics helpers
// -----------------------------------------------------------------------------

function pairedTTest(differences: number[]): { t: number; p: number } {
  const n = differences.length;
  if (n < 2) return { t: 0, p: 1 };
  const m = mean(differences);
  const s = std(differences);
  if (s === 0) return { t: m === 0 ? 0 : Infinity, p: m === 0 ? 1 : 0 };
  const se = s / Math.sqrt(n);
  const t = m / se;
  const df = n - 1;
  return { t, p: approxTwoTailedP(Math.abs(t), df) };
}

function approxTwoTailedP(t: number, df: number): number {
  const x = df / (df + t * t);
  return Math.min(1, Math.max(0, incompleteBeta(x, df / 2, 0.5)));
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnB = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  const prefix = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnB) / a;
  let sum = 1, term = 1;
  for (let n = 1; n < 200; n++) {
    term *= (n - b) * x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return Math.min(1, prefix * sum);
}

function lnGamma(z: number): number {
  if (z <= 0) return 0;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function pairedCohensD(differences: number[]): number {
  const m = mean(differences);
  const s = std(differences);
  return s > 0 ? m / s : 0;
}

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

export function runMatchedScaffoldComparison(
  nSeeds: number = 30,
  baseConfig: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  profileNames: string[],
  onProgress?: ProgressCallback
): MatchedScaffoldReport {
  const totalRuns = profileNames.length * nSeeds * 2;
  let completed = 0;
  const results: MatchedPairResult[] = [];

  for (const profileName of profileNames) {
    const retWith: number[] = [], retWithout: number[] = [];
    const eceWith: number[] = [], eceWithout: number[] = [];
    const mastWith: number[] = [], mastWithout: number[] = [];

    for (let seed = 0; seed < nSeeds; seed++) {
      const profileW = createLearnerProfile(profileName, baseConfig.num_items);
      const resultW = runSimulation(profileW, {
        ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME,
        enable_scaffolding: true, enable_dual_process: true, random_seed: seed + 1,
      });

      const profileWO = createLearnerProfile(profileName, baseConfig.num_items);
      const resultWO = runSimulation(profileWO, {
        ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME,
        enable_scaffolding: false, enable_dual_process: true, random_seed: seed + 1,
      });

      retWith.push(resultW.retention_7day);
      retWithout.push(resultWO.retention_7day);
      eceWith.push(resultW.session_data.length > 0 ? resultW.session_data[resultW.session_data.length - 1].ece : 0);
      eceWithout.push(resultWO.session_data.length > 0 ? resultWO.session_data[resultWO.session_data.length - 1].ece : 0);
      mastWith.push(resultW.time_to_mastery);
      mastWithout.push(resultWO.time_to_mastery);

      completed += 2;
      if (onProgress) onProgress((completed / totalRuns) * 100, `${profileName} / seed ${seed + 1}`);
    }

    const retDiffs = retWith.map((w, i) => w - retWithout[i]);
    const eceDiffs = eceWith.map((w, i) => w - eceWithout[i]);
    const mastDiffs = mastWith.map((w, i) => w - mastWithout[i]);
    const { p } = pairedTTest(retDiffs);

    results.push({
      profile: profileName, nSeeds,
      retention_with: computeStats(retWith), retention_without: computeStats(retWithout), retention_diff: computeStats(retDiffs),
      ece_with: computeStats(eceWith), ece_without: computeStats(eceWithout), ece_diff: computeStats(eceDiffs),
      mastery_with: computeStats(mastWith), mastery_without: computeStats(mastWithout), mastery_diff: computeStats(mastDiffs),
      paired_cohens_d: pairedCohensD(retDiffs), p_value: p,
    });
  }

  return { results, profiles: profileNames, nSeeds };
}

export function matchedScaffoldToCSV(report: MatchedScaffoldReport): string {
  const headers = [
    'profile', 'n_seeds', 'retention_with_mean', 'retention_without_mean',
    'retention_diff_mean', 'retention_diff_sd', 'retention_diff_ci_lower', 'retention_diff_ci_upper',
    'ece_with_mean', 'ece_without_mean', 'ece_diff_mean', 'ece_diff_ci_lower', 'ece_diff_ci_upper',
    'mastery_with_mean', 'mastery_without_mean', 'mastery_diff_mean', 'paired_cohens_d', 'p_value',
  ];
  const rows = report.results.map(r => [
    r.profile, r.nSeeds.toString(),
    r.retention_with.mean.toFixed(6), r.retention_without.mean.toFixed(6),
    r.retention_diff.mean.toFixed(6), r.retention_diff.sd.toFixed(6),
    r.retention_diff.ci95_lower.toFixed(6), r.retention_diff.ci95_upper.toFixed(6),
    r.ece_with.mean.toFixed(6), r.ece_without.mean.toFixed(6),
    r.ece_diff.mean.toFixed(6), r.ece_diff.ci95_lower.toFixed(6), r.ece_diff.ci95_upper.toFixed(6),
    r.mastery_with.mean.toFixed(2), r.mastery_without.mean.toFixed(2), r.mastery_diff.mean.toFixed(2),
    r.paired_cohens_d.toFixed(4), r.p_value.toFixed(6),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}
