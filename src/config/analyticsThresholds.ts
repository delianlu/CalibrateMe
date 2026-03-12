// =============================================================================
// Centralized Analytics Thresholds
// All heuristic thresholds used by analytical modules.
// Every value here is an engineering choice, not a validated empirical constant.
// Sensitivity to these thresholds is tested in thresholdSensitivity.ts.
// =============================================================================

export const ANALYTICS_THRESHOLDS = {
  // -- Session segmentation --
  session_break_minutes: 10,

  // -- Session quality --
  regression_threshold_pp: 15,
  breakout_threshold_pp: 15,

  // -- Calibration quality --
  good_calibration_ece: 0.10,

  // -- Learning phase classification --
  phase_novice_k_star: 0.40,
  phase_mastered_k_star: 0.90,
  phase_plateau_gain_rate: 0.005,
  phase_min_sessions_for_plateau: 5,

  // -- Dual-process --
  automatization_type1_ratio: 0.50,

  // -- Effort --
  high_effort_rt_multiplier: 1.5,

  // -- Learner parameter interpretation --
  alpha_high: 0.25,
  alpha_low: 0.15,
  lambda_low: 0.07,
  lambda_high: 0.12,
  beta_well_calibrated: 0.08,
  beta_severe: 0.18,

  // -- Real-user classification --
  classification_overconfident: 0.10,
  classification_underconfident: -0.10,
} as const;

export type AnalyticsThresholds = typeof ANALYTICS_THRESHOLDS;
