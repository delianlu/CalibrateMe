// =============================================================================
// Ablation Runner
// Orchestrates multi-seed ablation across profiles × conditions
// =============================================================================

import {
  SimulationConfig,
  SimulationResults,
  SchedulerType,
  DEFAULT_SIMULATION_CONFIG,
} from '../types';
import { createLearnerProfile, getAllProfileNames } from '../profiles/learnerProfiles';
import { runSimulation, ProgressCallback } from './simulationEngine';
import { computeStats, computeEffectSize, StatisticalResult, EffectSize } from './statisticalAnalysis';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AblationCondition {
  name: string;
  config: Partial<SimulationConfig>;
}

export interface AblationComparison {
  condition: string;
  profile: string;
  retention_7day: StatisticalResult;
  ece: StatisticalResult;
  time_to_mastery: StatisticalResult;
  review_efficiency: StatisticalResult;
  retention_1day: StatisticalResult;
  retention_30day: StatisticalResult;
  vs_sm2_retention: EffectSize | null;
  vs_sm2_ece: EffectSize | null;
}

export interface AblationResults {
  comparisons: AblationComparison[];
  conditions: string[];
  profiles: string[];
  nSeeds: number;
}

// -----------------------------------------------------------------------------
// Default Ablation Conditions
// -----------------------------------------------------------------------------

export const DEFAULT_CONDITIONS: AblationCondition[] = [
  {
    name: 'Full CalibrateMe',
    config: {
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: true,
      enable_dual_process: true,
    },
  },
  {
    name: 'No Dual-Process',
    config: {
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: true,
      enable_dual_process: false,
    },
  },
  {
    name: 'No Scaffolding',
    config: {
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: false,
      enable_dual_process: true,
    },
  },
  {
    name: 'Calibration Only',
    config: {
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: false,
      enable_dual_process: false,
    },
  },
  {
    name: 'SM-2 Baseline',
    config: {
      scheduler_type: SchedulerType.SM2,
    },
  },
  {
    name: 'BKT-Only',
    config: {
      scheduler_type: SchedulerType.BKT_ONLY,
    },
  },
];

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

/**
 * Run ablation study across all profiles × conditions × seeds.
 * Returns per-(profile, condition) statistical summaries with CIs and effect sizes.
 */
export function runAblationStudy(
  nSeeds: number = 30,
  baseConfig: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  conditions: AblationCondition[] = DEFAULT_CONDITIONS,
  profileNames?: string[],
  onProgress?: ProgressCallback
): AblationResults {
  const profiles = profileNames ?? getAllProfileNames();
  const totalRuns = profiles.length * conditions.length * nSeeds;
  let completed = 0;

  // Collect raw results: [profile][condition] -> SimulationResults[]
  const rawResults = new Map<string, Map<string, SimulationResults[]>>();

  for (const profileName of profiles) {
    const profileMap = new Map<string, SimulationResults[]>();

    for (const condition of conditions) {
      const results: SimulationResults[] = [];

      for (let seed = 0; seed < nSeeds; seed++) {
        const profile = createLearnerProfile(profileName, baseConfig.num_items);
        const config: SimulationConfig = {
          ...baseConfig,
          ...condition.config,
          random_seed: seed + 1, // deterministic seeds 1..nSeeds
        };

        const result = runSimulation(profile, config);
        results.push(result);

        completed++;
        if (onProgress) {
          const pct = (completed / totalRuns) * 100;
          onProgress(pct, `${profileName} / ${condition.name} / seed ${seed + 1}`);
        }
      }

      profileMap.set(condition.name, results);
    }

    rawResults.set(profileName, profileMap);
  }

  // Aggregate into AblationComparison objects
  const comparisons: AblationComparison[] = [];

  for (const profileName of profiles) {
    const profileMap = rawResults.get(profileName)!;
    const sm2Results = profileMap.get('SM-2 Baseline');

    for (const condition of conditions) {
      const results = profileMap.get(condition.name)!;

      const retention7 = results.map(r => r.retention_7day);
      const retention1 = results.map(r => r.retention_1day);
      const retention30 = results.map(r => r.retention_30day);
      const eceValues = results.map(r => {
        const lastSession = r.session_data[r.session_data.length - 1];
        return lastSession ? lastSession.ece : 0;
      });
      const mastery = results.map(r => r.time_to_mastery);
      const efficiency = results.map(r => r.review_efficiency);

      // Effect sizes vs SM-2
      let vs_sm2_retention: EffectSize | null = null;
      let vs_sm2_ece: EffectSize | null = null;

      if (sm2Results && condition.name !== 'SM-2 Baseline') {
        const sm2Retention7 = sm2Results.map(r => r.retention_7day);
        const sm2Ece = sm2Results.map(r => {
          const lastSession = r.session_data[r.session_data.length - 1];
          return lastSession ? lastSession.ece : 0;
        });

        vs_sm2_retention = computeEffectSize(retention7, sm2Retention7);
        vs_sm2_ece = computeEffectSize(sm2Ece, eceValues); // reversed: lower ECE is better
      }

      comparisons.push({
        condition: condition.name,
        profile: profileName,
        retention_7day: computeStats(retention7),
        retention_1day: computeStats(retention1),
        retention_30day: computeStats(retention30),
        ece: computeStats(eceValues),
        time_to_mastery: computeStats(mastery),
        review_efficiency: computeStats(efficiency),
        vs_sm2_retention,
        vs_sm2_ece,
      });
    }
  }

  return {
    comparisons,
    conditions: conditions.map(c => c.name),
    profiles,
    nSeeds,
  };
}

/**
 * Extract comparisons for a specific profile
 */
export function getProfileComparisons(
  results: AblationResults,
  profile: string
): AblationComparison[] {
  return results.comparisons.filter(c => c.profile === profile);
}

/**
 * Extract comparisons for a specific condition across all profiles
 */
export function getConditionComparisons(
  results: AblationResults,
  condition: string
): AblationComparison[] {
  return results.comparisons.filter(c => c.condition === condition);
}

/**
 * Export ablation results as CSV
 */
export function ablationToCSV(results: AblationResults): string {
  const headers = [
    'Profile', 'Condition',
    'Ret7d_Mean', 'Ret7d_SD', 'Ret7d_CI_Lo', 'Ret7d_CI_Hi',
    'ECE_Mean', 'ECE_SD', 'ECE_CI_Lo', 'ECE_CI_Hi',
    'Mastery_Mean', 'Mastery_SD',
    'Efficiency_Mean', 'Efficiency_SD',
    'CohenD_Ret_vs_SM2', 'CohenD_ECE_vs_SM2',
    'EffectSize_Ret', 'EffectSize_ECE',
  ];

  const rows = results.comparisons.map(c => [
    c.profile, c.condition,
    c.retention_7day.mean.toFixed(4), c.retention_7day.sd.toFixed(4),
    c.retention_7day.ci95_lower.toFixed(4), c.retention_7day.ci95_upper.toFixed(4),
    c.ece.mean.toFixed(4), c.ece.sd.toFixed(4),
    c.ece.ci95_lower.toFixed(4), c.ece.ci95_upper.toFixed(4),
    c.time_to_mastery.mean.toFixed(1), c.time_to_mastery.sd.toFixed(1),
    c.review_efficiency.mean.toFixed(2), c.review_efficiency.sd.toFixed(2),
    c.vs_sm2_retention?.cohens_d.toFixed(3) ?? 'N/A',
    c.vs_sm2_ece?.cohens_d.toFixed(3) ?? 'N/A',
    c.vs_sm2_retention?.interpretation ?? 'N/A',
    c.vs_sm2_ece?.interpretation ?? 'N/A',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
