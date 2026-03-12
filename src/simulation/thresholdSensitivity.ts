// =============================================================================
// Threshold Sensitivity Analysis
// Re-runs analytical modules with varied thresholds on existing simulation
// results to test which conclusions are robust vs. threshold-sensitive.
// =============================================================================

import { SimulationResults, LearnerProfileParams } from '../types';
import { ANALYTICS_THRESHOLDS, AnalyticsThresholds } from '../config/analyticsThresholds';
import { analyzeLongitudinal } from '../features/analytics/longitudinalAnalysis';
import { analyzePatterns } from '../features/analytics/patternAnalysis';
import { analyzeLearnerInsights } from '../features/analytics/learnerInsights';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ThresholdSweepConfig {
  parameter: keyof AnalyticsThresholds;
  values: number[];
}

export interface ThresholdSensitivityResult {
  parameter: string;
  value: number;
  profile: string;
  learning_phase: string;
  calibration_quality: string;
  archetype: string;
  automatization_session: number | null;
  headline_changes: string[];
}

export interface ThresholdSensitivityReport {
  results: ThresholdSensitivityResult[];
  sweeps: ThresholdSweepConfig[];
  profiles: string[];
  totalConclusions: number;
  robustConclusions: number;
}

// -----------------------------------------------------------------------------
// Default Sweeps
// -----------------------------------------------------------------------------

export const DEFAULT_THRESHOLD_SWEEPS: ThresholdSweepConfig[] = [
  { parameter: 'session_break_minutes', values: [5, 10, 15, 20] },
  { parameter: 'regression_threshold_pp', values: [10, 15, 20] },
  { parameter: 'good_calibration_ece', values: [0.05, 0.08, 0.10, 0.12, 0.15] },
  { parameter: 'automatization_type1_ratio', values: [0.40, 0.50, 0.60] },
  { parameter: 'high_effort_rt_multiplier', values: [1.25, 1.50, 1.75] },
  { parameter: 'phase_mastered_k_star', values: [0.85, 0.90, 0.95] },
  { parameter: 'beta_well_calibrated', values: [0.05, 0.08, 0.10, 0.12] },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface DerivedLabels {
  learning_phase: string;
  calibration_quality: string;
  archetype: string;
  automatization_session: number | null;
}

function deriveLabels(
  results: SimulationResults,
  params: LearnerProfileParams,
  thresholds: Partial<AnalyticsThresholds>
): DerivedLabels {
  const longitudinal = analyzeLongitudinal(results, thresholds);
  const patterns = analyzePatterns(results.session_data, thresholds);
  const insights = analyzeLearnerInsights(results, params, undefined, thresholds);

  const finalECE = results.session_data.length > 0
    ? results.session_data[results.session_data.length - 1].ece
    : 1;

  const t = { ...ANALYTICS_THRESHOLDS, ...thresholds };
  const calibration_quality = finalECE < t.good_calibration_ece ? 'Good'
    : finalECE < 0.20 ? 'Moderate'
    : 'Poor';

  return {
    learning_phase: longitudinal.learningVelocity.currentPhase,
    calibration_quality,
    archetype: insights.archetype,
    automatization_session: patterns.dualProcess.automatizationSession,
  };
}

function findChanges(defaultLabels: DerivedLabels, newLabels: DerivedLabels): string[] {
  const changes: string[] = [];
  if (defaultLabels.learning_phase !== newLabels.learning_phase)
    changes.push(`phase: ${defaultLabels.learning_phase} → ${newLabels.learning_phase}`);
  if (defaultLabels.calibration_quality !== newLabels.calibration_quality)
    changes.push(`calibration: ${defaultLabels.calibration_quality} → ${newLabels.calibration_quality}`);
  if (defaultLabels.archetype !== newLabels.archetype)
    changes.push(`archetype: ${defaultLabels.archetype} → ${newLabels.archetype}`);
  if (defaultLabels.automatization_session !== newLabels.automatization_session)
    changes.push(`automatization: session ${defaultLabels.automatization_session ?? 'none'} → ${newLabels.automatization_session ?? 'none'}`);
  return changes;
}

// -----------------------------------------------------------------------------
// Main Runner
// -----------------------------------------------------------------------------

export interface ProfileSimData {
  profileName: string;
  results: SimulationResults;
  params: LearnerProfileParams;
}

export function runThresholdSensitivity(
  profileData: ProfileSimData[],
  sweeps: ThresholdSweepConfig[] = DEFAULT_THRESHOLD_SWEEPS
): ThresholdSensitivityReport {
  const results: ThresholdSensitivityResult[] = [];
  let totalConclusions = 0;
  let robustConclusions = 0;

  for (const { profileName, results: simResults, params } of profileData) {
    const defaultLabels = deriveLabels(simResults, params, {});

    for (const sweep of sweeps) {
      for (const value of sweep.values) {
        const overrides: Partial<AnalyticsThresholds> = { [sweep.parameter]: value };
        const newLabels = deriveLabels(simResults, params, overrides);
        const headline_changes = findChanges(defaultLabels, newLabels);

        totalConclusions += 4;
        robustConclusions += (4 - headline_changes.length);

        results.push({
          parameter: sweep.parameter,
          value,
          profile: profileName,
          learning_phase: newLabels.learning_phase,
          calibration_quality: newLabels.calibration_quality,
          archetype: newLabels.archetype,
          automatization_session: newLabels.automatization_session,
          headline_changes,
        });
      }
    }
  }

  return { results, sweeps, profiles: profileData.map(p => p.profileName), totalConclusions, robustConclusions };
}

export function thresholdSensitivityToCSV(report: ThresholdSensitivityReport): string {
  const headers = ['parameter', 'value', 'profile', 'learning_phase', 'calibration_quality', 'archetype', 'automatization_session', 'changed', 'headline_changes'];
  const rows = report.results.map(r => [
    r.parameter, r.value.toString(), r.profile,
    r.learning_phase, r.calibration_quality, r.archetype,
    r.automatization_session?.toString() ?? 'none',
    r.headline_changes.length > 0 ? 'true' : 'false',
    r.headline_changes.length > 0 ? `"${r.headline_changes.join('; ')}"` : '',
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}
