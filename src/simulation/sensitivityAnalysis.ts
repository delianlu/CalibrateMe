// =============================================================================
// Sensitivity Analysis Module
// Parameter sweeps to test robustness of CalibrateMe's advantage over SM-2
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

export interface SensitivitySweepConfig {
  parameterName: string;
  values: number[];
}

export interface SensitivityResult {
  parameterName: string;
  parameterValue: number;
  profile: string;
  cm_retention: StatisticalResult;
  sm2_retention: StatisticalResult;
  retention_advantage: StatisticalResult;
  cm_ece: StatisticalResult;
  sm2_ece: StatisticalResult;
}

export interface SensitivityReport {
  results: SensitivityResult[];
  parameterName: string;
  values: number[];
  profiles: string[];
  nSeeds: number;
}

// -----------------------------------------------------------------------------
// Default Parameter Sweeps
// -----------------------------------------------------------------------------

export const DEFAULT_SWEEPS: SensitivitySweepConfig[] = [
  { parameterName: 'lambda', values: [0.03, 0.05, 0.10, 0.15, 0.20] },
  { parameterName: 'slip_probability', values: [0.05, 0.10, 0.15, 0.20] },
  { parameterName: 'guess_probability', values: [0.10, 0.20, 0.30] },
  { parameterName: 'confidence_noise_std', values: [0.05, 0.10, 0.15, 0.20] },
  { parameterName: 'beta_star', values: [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30] },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Apply a parameter override. For profile-level params (lambda, beta_star),
 * we override them in the profile creation. For config-level params, we modify
 * the SimulationConfig.
 */
function isProfileParam(name: string): boolean {
  return name === 'lambda' || name === 'beta_star';
}

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

/**
 * Run a single parameter sweep: for each value of the parameter,
 * run CalibrateMe and SM-2 on all profiles × seeds.
 */
export function runSensitivitySweep(
  sweep: SensitivitySweepConfig,
  nSeeds: number = 10,
  baseConfig: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  profileNames?: string[],
  onProgress?: ProgressCallback
): SensitivityReport {
  const profiles = profileNames ?? getAllProfileNames();
  const totalRuns = sweep.values.length * profiles.length * 2 * nSeeds; // ×2 for CM + SM2
  let completed = 0;

  const results: SensitivityResult[] = [];

  for (const value of sweep.values) {
    for (const profileName of profiles) {
      const cmRetentions: number[] = [];
      const sm2Retentions: number[] = [];
      const cmECEs: number[] = [];
      const sm2ECEs: number[] = [];

      for (let seed = 0; seed < nSeeds; seed++) {
        // Build configs for both schedulers
        for (const schedulerType of [SchedulerType.CALIBRATEME, SchedulerType.SM2]) {
          let config: SimulationConfig = {
            ...baseConfig,
            scheduler_type: schedulerType,
            random_seed: seed + 1,
          };

          // Apply parameter override
          let profile;
          if (isProfileParam(sweep.parameterName)) {
            // Override at profile level — create a custom profile
            profile = createLearnerProfile(profileName, baseConfig.num_items);
            if (sweep.parameterName === 'lambda') {
              profile.true_state.lambda = value;
              profile.params = { ...profile.params, lambda: value };
            } else if (sweep.parameterName === 'beta_star') {
              profile.true_state.beta_star = value;
              profile.params = { ...profile.params, beta_star: value };
            }
          } else {
            profile = createLearnerProfile(profileName, baseConfig.num_items);
            // Override at config level
            config = { ...config, [sweep.parameterName]: value };
          }

          const result = runSimulation(profile, config);

          const finalECE = result.session_data.length > 0
            ? result.session_data[result.session_data.length - 1].ece
            : 0;

          if (schedulerType === SchedulerType.CALIBRATEME) {
            cmRetentions.push(result.retention_7day);
            cmECEs.push(finalECE);
          } else {
            sm2Retentions.push(result.retention_7day);
            sm2ECEs.push(finalECE);
          }

          completed++;
          if (onProgress) {
            onProgress(
              (completed / totalRuns) * 100,
              `${sweep.parameterName}=${value} / ${profileName} / ${schedulerType}`
            );
          }
        }
      }

      // Compute advantage per seed, then aggregate
      const advantages = cmRetentions.map((cm, i) => cm - sm2Retentions[i]);

      results.push({
        parameterName: sweep.parameterName,
        parameterValue: value,
        profile: profileName,
        cm_retention: computeStats(cmRetentions),
        sm2_retention: computeStats(sm2Retentions),
        retention_advantage: computeStats(advantages),
        cm_ece: computeStats(cmECEs),
        sm2_ece: computeStats(sm2ECEs),
      });
    }
  }

  return {
    results,
    parameterName: sweep.parameterName,
    values: sweep.values,
    profiles,
    nSeeds,
  };
}

/**
 * Export sensitivity results as CSV
 */
export function sensitivityToCSV(report: SensitivityReport): string {
  const headers = [
    'Parameter', 'Value', 'Profile',
    'CM_Ret7d_Mean', 'CM_Ret7d_SD',
    'SM2_Ret7d_Mean', 'SM2_Ret7d_SD',
    'Advantage_Mean', 'Advantage_CI_Lo', 'Advantage_CI_Hi',
    'CM_ECE_Mean', 'SM2_ECE_Mean',
  ];

  const rows = report.results.map(r => [
    r.parameterName, r.parameterValue.toFixed(3), r.profile,
    r.cm_retention.mean.toFixed(4), r.cm_retention.sd.toFixed(4),
    r.sm2_retention.mean.toFixed(4), r.sm2_retention.sd.toFixed(4),
    r.retention_advantage.mean.toFixed(4),
    r.retention_advantage.ci95_lower.toFixed(4),
    r.retention_advantage.ci95_upper.toFixed(4),
    r.cm_ece.mean.toFixed(4), r.sm2_ece.mean.toFixed(4),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
