// =============================================================================
// δ Dose-Response Sweep
// Characterizes how the scaffolding effectiveness rate (δ) affects outcomes
// =============================================================================

import {
  SimulationConfig,
  SchedulerType,
  DEFAULT_SIMULATION_CONFIG,
} from '../types';
import { createLearnerProfile, getAllProfileNames } from '../profiles/learnerProfiles';
import { runSimulation, ProgressCallback } from './simulationEngine';
import { computeStats, StatisticalResult } from './statisticalAnalysis';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface DeltaSweepResult {
  delta: number;
  profile: string;
  final_ece: StatisticalResult;
  retention_7day: StatisticalResult;
  time_to_mastery: StatisticalResult;
  scaffold_count: StatisticalResult;
}

export interface DeltaSweepReport {
  results: DeltaSweepResult[];
  deltas: number[];
  profiles: string[];
  nSeeds: number;
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

export const DEFAULT_DELTAS = [0.00, 0.01, 0.02, 0.03, 0.05, 0.08, 0.10, 0.15];

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

/**
 * Run δ dose-response sweep: for each δ value × profile × seed,
 * run CalibrateMe with that δ and collect outcomes.
 */
export function runDeltaSweep(
  deltas: number[] = DEFAULT_DELTAS,
  nSeeds: number = 15,
  baseConfig: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  profileNames?: string[],
  onProgress?: ProgressCallback
): DeltaSweepReport {
  const profiles = profileNames ?? getAllProfileNames();
  const totalRuns = deltas.length * profiles.length * nSeeds;
  let completed = 0;

  const results: DeltaSweepResult[] = [];

  for (const delta of deltas) {
    for (const profileName of profiles) {
      const eceValues: number[] = [];
      const retentionValues: number[] = [];
      const masteryValues: number[] = [];
      const scaffoldCounts: number[] = [];

      for (let seed = 0; seed < nSeeds; seed++) {
        const profile = createLearnerProfile(profileName, baseConfig.num_items);
        const config: SimulationConfig = {
          ...baseConfig,
          scheduler_type: SchedulerType.CALIBRATEME,
          enable_scaffolding: delta > 0,
          enable_dual_process: true,
          scaffolding_delta: delta,
          random_seed: seed + 1,
        };

        const result = runSimulation(profile, config);

        const finalECE = result.session_data.length > 0
          ? result.session_data[result.session_data.length - 1].ece
          : 0;
        const totalScaffolds = result.session_data.reduce(
          (sum, s) => sum + s.scaffolds_delivered, 0
        );

        eceValues.push(finalECE);
        retentionValues.push(result.retention_7day);
        masteryValues.push(result.time_to_mastery);
        scaffoldCounts.push(totalScaffolds);

        completed++;
        if (onProgress) {
          onProgress(
            (completed / totalRuns) * 100,
            `δ=${delta.toFixed(2)} / ${profileName} / seed ${seed + 1}`
          );
        }
      }

      results.push({
        delta,
        profile: profileName,
        final_ece: computeStats(eceValues),
        retention_7day: computeStats(retentionValues),
        time_to_mastery: computeStats(masteryValues),
        scaffold_count: computeStats(scaffoldCounts),
      });
    }
  }

  return { results, deltas, profiles, nSeeds };
}

/**
 * Export delta sweep results as CSV
 */
export function deltaSweepToCSV(report: DeltaSweepReport): string {
  const headers = [
    'Delta', 'Profile',
    'ECE_Mean', 'ECE_SD', 'ECE_CI_Lo', 'ECE_CI_Hi',
    'Ret7d_Mean', 'Ret7d_SD', 'Ret7d_CI_Lo', 'Ret7d_CI_Hi',
    'Mastery_Mean', 'Mastery_SD',
    'Scaffolds_Mean', 'Scaffolds_SD',
  ];

  const rows = report.results.map(r => [
    r.delta.toFixed(3), r.profile,
    r.final_ece.mean.toFixed(4), r.final_ece.sd.toFixed(4),
    r.final_ece.ci95_lower.toFixed(4), r.final_ece.ci95_upper.toFixed(4),
    r.retention_7day.mean.toFixed(4), r.retention_7day.sd.toFixed(4),
    r.retention_7day.ci95_lower.toFixed(4), r.retention_7day.ci95_upper.toFixed(4),
    r.time_to_mastery.mean.toFixed(1), r.time_to_mastery.sd.toFixed(1),
    r.scaffold_count.mean.toFixed(1), r.scaffold_count.sd.toFixed(1),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
