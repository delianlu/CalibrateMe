// =============================================================================
// CalibrateMe Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export enum AbilityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CalibrationType {
  OVERCONFIDENT = 'OVERCONFIDENT',
  UNDERCONFIDENT = 'UNDERCONFIDENT',
  WELL_CALIBRATED = 'WELL_CALIBRATED',
}

export enum ResponseType {
  TYPE1_AUTOMATIC = 'TYPE1_AUTOMATIC',
  TYPE2_DELIBERATE = 'TYPE2_DELIBERATE',
}

export enum ScaffoldType {
  REFLECTION = 'REFLECTION',           // For overconfident learners
  ENCOURAGEMENT = 'ENCOURAGEMENT',     // For underconfident learners
  NONE = 'NONE',
}

export enum SchedulerType {
  CALIBRATEME = 'CALIBRATEME',
  SM2 = 'SM2',
  BKT_ONLY = 'BKT_ONLY',
  DECAY_BASED = 'DECAY_BASED',
}

// -----------------------------------------------------------------------------
// Core Interfaces
// -----------------------------------------------------------------------------

/**
 * True (hidden) state of the learner - generates observable behavior
 * The system cannot directly access this; it must infer from responses
 */
export interface TrueLearnerState {
  K_star: number;           // True knowledge level [0, 1]
  beta_star: number;        // True calibration bias [-0.3, +0.3]
  alpha: number;            // Learning rate on correct responses [0.1, 0.3]
  alpha_err: number;        // Learning rate on errors (typically 0.5 * alpha)
  lambda: number;           // Forgetting rate [0.05, 0.15]
}

/**
 * System's belief about the learner - updated via BKT from observations
 */
export interface SystemBelief {
  K_hat: number;            // Estimated knowledge level [0, 1]
  beta_hat: number;         // Estimated calibration bias
  confidence_interval: number; // Uncertainty in estimate
  last_updated: Date;
}

/**
 * Item being learned (e.g., a vocabulary word, flashcard)
 */
export interface Item {
  id: string;
  difficulty: number;       // Item difficulty [0, 1]
  true_state: ItemTrueState;
  system_belief: ItemSystemBelief;
  review_history: ReviewRecord[];
}

export interface ItemTrueState {
  K_star: number;           // True knowledge for this specific item
  last_review: Date | null;
}

export interface ItemSystemBelief {
  K_hat: number;
  beta_hat: number;
  next_review: Date;
  interval_days: number;
  ease_factor: number;      // For SM-2 compatibility
}

/**
 * A single response from the learner
 */
export interface Response {
  item_id: string;
  correctness: boolean;     // y: correct (true) or incorrect (false)
  confidence: number;       // c: reported confidence [0, 1]
  response_time: number;    // τ: response time in seconds
  timestamp: Date;
}

/**
 * Processed response with additional computed fields
 */
export interface ProcessedResponse extends Response {
  response_type: ResponseType;
  normalized_rt: number;
  dual_process_score: number;
  brier_score: number;
}

/**
 * Record of a single review session
 */
export interface ReviewRecord {
  response: ProcessedResponse;
  K_star_before: number;
  K_star_after: number;
  K_hat_before: number;
  K_hat_after: number;
  interval_assigned: number;
  scaffold_delivered: ScaffoldType;
}

// -----------------------------------------------------------------------------
// Learner Profile
// -----------------------------------------------------------------------------

export interface LearnerProfileParams {
  ability: AbilityLevel;
  calibration: CalibrationType;
  alpha: number;
  lambda: number;
  beta_star: number;
}

export interface LearnerProfile {
  id: string;
  name: string;
  params: LearnerProfileParams;
  true_state: TrueLearnerState;
  system_belief: SystemBelief;
  items: Item[];
  response_history: ProcessedResponse[];
  session_count: number;
}

// -----------------------------------------------------------------------------
// Calibration Metrics
// -----------------------------------------------------------------------------

export interface CalibrationMetrics {
  brier_score: number;      // Mean squared error of confidence
  ece: number;              // Expected Calibration Error
  mce: number;              // Maximum Calibration Error
  calibration_direction: CalibrationType;
  bin_data: CalibrationBin[];
}

export interface CalibrationBin {
  bin_start: number;
  bin_end: number;
  mean_confidence: number;
  mean_accuracy: number;
  count: number;
  calibration_gap: number;  // accuracy - confidence
}

// -----------------------------------------------------------------------------
// Simulation Configuration
// -----------------------------------------------------------------------------

export interface SimulationConfig {
  num_items: number;
  num_sessions: number;
  items_per_session: number;
  scheduler_type: SchedulerType;
  enable_scaffolding: boolean;
  enable_dual_process: boolean;
  random_seed: number | null;

  // Model parameters
  slip_probability: number;       // s = 0.1
  guess_probability: number;      // g = 0.2
  confidence_noise_std: number;   // σ_c = 0.1
  rt_noise_std: number;           // σ_τ = 0.5
  rt_base: number;                // Base response time in seconds
  rt_gamma: number;               // Knowledge-RT relationship strength
  scaffolding_delta: number;      // δ ∈ [0.02, 0.05]
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  num_items: 100,
  num_sessions: 30,
  items_per_session: 20,
  scheduler_type: SchedulerType.CALIBRATEME,
  enable_scaffolding: true,
  enable_dual_process: true,
  random_seed: null,
  slip_probability: 0.1,
  guess_probability: 0.2,
  confidence_noise_std: 0.1,
  rt_noise_std: 0.5,
  rt_base: 3.0,
  rt_gamma: 2.0,
  scaffolding_delta: 0.03,
};

// -----------------------------------------------------------------------------
// Simulation Results
// -----------------------------------------------------------------------------

export interface SimulationResults {
  profile_id: string;
  scheduler_type: SchedulerType;
  config: SimulationConfig;

  // Primary metrics
  retention_1day: number;
  retention_7day: number;
  retention_30day: number;
  time_to_mastery: number;      // Sessions until K* > 0.9 sustained
  review_efficiency: number;    // Reviews per mastered item
  total_review_time: number;    // Cost proxy

  // Calibration trajectory
  ece_trajectory: number[];
  brier_trajectory: number[];

  // Knowledge trajectory
  K_star_trajectory: number[];
  K_hat_trajectory: number[];

  // Per-session data
  session_data: SessionData[];
}

export interface SessionData {
  session_number: number;
  items_reviewed: number;
  correct_count: number;
  mean_confidence: number;
  mean_rt: number;
  type1_count: number;
  type2_count: number;
  scaffolds_delivered: number;
  mean_K_star: number;
  mean_K_hat: number;
  ece: number;
  brier: number;
}

// -----------------------------------------------------------------------------
// Experiment Configuration
// -----------------------------------------------------------------------------

export interface ExperimentConfig {
  profiles: LearnerProfile[];
  conditions: SchedulerType[];
  simulation_config: SimulationConfig;
  num_replications: number;
}

export interface ExperimentResults {
  config: ExperimentConfig;
  results: Map<string, Map<SchedulerType, SimulationResults[]>>;
  summary: ExperimentSummary;
}

export interface ExperimentSummary {
  by_profile: Map<string, ProfileSummary>;
  by_scheduler: Map<SchedulerType, SchedulerSummary>;
  hypothesis_tests: HypothesisTestResults;
}

export interface ProfileSummary {
  profile_id: string;
  mean_retention_1day: Map<SchedulerType, number>;
  mean_retention_7day: Map<SchedulerType, number>;
  mean_retention_30day: Map<SchedulerType, number>;
  mean_time_to_mastery: Map<SchedulerType, number>;
  improvement_vs_sm2: number;
}

export interface SchedulerSummary {
  scheduler_type: SchedulerType;
  mean_retention_1day: number;
  mean_retention_7day: number;
  mean_retention_30day: number;
  mean_time_to_mastery: number;
}

export interface HypothesisTestResults {
  h1_overconfident_largest_improvement: boolean;
  h2_underconfident_moderate_improvement: boolean;
  h3_wellcalibrated_minimal_difference: boolean;
  effect_sizes: Map<string, number>;
  p_values: Map<string, number>;
}
