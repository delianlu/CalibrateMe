// =============================================================================
// Simulation Engine (FIXED)
// Orchestrates all modules for running experiments
// =============================================================================

import {
  LearnerProfile,
  ProcessedResponse,
  SimulationConfig,
  SimulationResults,
  SessionData,
  SchedulerType,
  ScaffoldType,
  ResponseType,
  DEFAULT_SIMULATION_CONFIG,
  SystemBelief,
} from '../types';
import { SeededRandom } from '../utils/random';
import { mean } from '../utils/statistics';
import { generateResponse } from './responseGenerator';
import { calculateCalibrationMetrics } from '../calibration/scoringModule';
import { updateBelief, updateBetaHat } from '../bkt/beliefUpdateEngine';
import { applyForgetting, applyLearning, calculateRetention } from '../memory/forgettingModel';
import { DualProcessClassifier, getDifficultyBin } from '../dualProcess/classifier';
import { CalibrateMeScheduler, selectItemsForReview } from '../scheduler/calibrationAwareScheduler';
import { AdaptiveScaffoldingManager } from '../scaffolding/adaptiveScaffolding';
import { SM2Scheduler } from '../baselines/sm2';
import { BKTOnlyScheduler } from '../baselines/bktOnly';
import { DecayBasedScheduler } from '../baselines/decayBased';

/**
 * Progress callback type for UI updates
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Deep clone a learner profile to avoid mutation
 */
function cloneProfile(profile: LearnerProfile): LearnerProfile {
  return JSON.parse(JSON.stringify(profile));
}

/**
 * Create initial system belief
 */
function createInitialBelief(): SystemBelief {
  return {
    K_hat: 0.3,
    beta_hat: 0,
    confidence_interval: 0.2,
    last_updated: new Date(),
  };
}

/**
 * Run a complete simulation for a learner profile
 */
export function runSimulation(
  profile: LearnerProfile,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  onProgress?: ProgressCallback
): SimulationResults {
  // Initialize random generator
  const random = new SeededRandom(config.random_seed ?? Date.now());

  // Clone profile to avoid mutation
  const learner = cloneProfile(profile);

  // Initialize system belief
  let systemBelief = createInitialBelief();

  // Initialize modules
  const dualProcessClassifier = new DualProcessClassifier();
  const scaffoldingManager = new AdaptiveScaffoldingManager(config.scaffolding_delta);

  // Initialize scheduler based on type
  let scheduler: SM2Scheduler | BKTOnlyScheduler | DecayBasedScheduler | CalibrateMeScheduler;

  switch (config.scheduler_type) {
    case SchedulerType.SM2:
      scheduler = new SM2Scheduler();
      break;
    case SchedulerType.BKT_ONLY:
      scheduler = new BKTOnlyScheduler(learner.params.lambda, config);
      break;
    case SchedulerType.DECAY_BASED:
      scheduler = new DecayBasedScheduler();
      break;
    case SchedulerType.CALIBRATEME:
    default:
      scheduler = new CalibrateMeScheduler(
        learner.params.lambda,
        true,
        config.enable_dual_process
      );
      break;
  }

  // Tracking variables
  const eceTrajectory: number[] = [];
  const brierTrajectory: number[] = [];
  const KStarTrajectory: number[] = [];
  const KHatTrajectory: number[] = [];
  const sessionDataList: SessionData[] = [];
  const allResponses: ProcessedResponse[] = [];

  let masteryAchievedSession = -1;
  let masteryCount = 0;

  // Run sessions
  for (let session = 0; session < config.num_sessions; session++) {
    // Report progress
    if (onProgress) {
      const progress = (session / config.num_sessions) * 100;
      onProgress(progress, `Running session ${session + 1}/${config.num_sessions}`);
    }

    // Apply forgetting to all items (simulate time passing)
    const daysBetweenSessions = session === 0 ? 0 : 1;
    learner.items = learner.items.map(item => ({
      ...item,
      true_state: {
        ...item.true_state,
        K_star: applyForgetting(
          item.true_state.K_star,
          learner.params.lambda,
          daysBetweenSessions
        ),
      },
    }));

    // Select items for review
    const itemsToReview = selectItemsForReview(
      learner.items,
      config.items_per_session
    );

    // Session tracking
    let correctCount = 0;
    let type1Count = 0;
    let type2Count = 0;
    let scaffoldsDelivered = 0;
    const sessionResponses: ProcessedResponse[] = [];

    // Process each item
    for (const item of itemsToReview) {
      // Generate response based on true state
      const response = generateResponse(
        item,
        learner.true_state,
        config,
        random
      );

      // Process with dual-process classifier
      const processedResponse = dualProcessClassifier.processResponse(
        response,
        getDifficultyBin(item.difficulty)
      );

      // Update statistics
      if (processedResponse.correctness) correctCount++;
      if (processedResponse.response_type === ResponseType.TYPE1_AUTOMATIC) {
        type1Count++;
      } else {
        type2Count++;
      }

      // Update true knowledge (learning)
      const newKStar = applyLearning(
        item.true_state.K_star,
        response.correctness,
        learner.true_state.alpha,
        learner.true_state.alpha_err
      );
      item.true_state.K_star = newKStar;
      item.true_state.last_review = new Date();

      // Update system belief for BKT-based schedulers
      if (config.scheduler_type === SchedulerType.CALIBRATEME ||
          config.scheduler_type === SchedulerType.BKT_ONLY) {
        systemBelief = updateBelief(response, systemBelief, config);

        // Update beta_hat from recent responses
        const recentResponses = allResponses.slice(-20);
        if (recentResponses.length > 0) {
          systemBelief.beta_hat = updateBetaHat(recentResponses, systemBelief.beta_hat);
        }
      }

      // Apply scaffolding (CalibrateMe only)
      if (config.enable_scaffolding && config.scheduler_type === SchedulerType.CALIBRATEME) {
        const scaffoldResult = scaffoldingManager.processResponse(
          processedResponse,
          systemBelief.beta_hat,
          learner.true_state
        );

        if (scaffoldResult.scaffold !== ScaffoldType.NONE) {
          scaffoldsDelivered++;
          learner.true_state.beta_star = scaffoldResult.updated_beta_star;
        }
      }

      // Schedule next review based on scheduler type
      let scheduleResult: { nextReview: Date; interval: number };

      if (scheduler instanceof CalibrateMeScheduler) {
        scheduleResult = scheduler.processResponse(processedResponse, systemBelief);
      } else {
        scheduleResult = scheduler.processResponse(response);
      }

      item.system_belief.next_review = scheduleResult.nextReview;
      item.system_belief.interval_days = scheduleResult.interval;

      // Store response
      sessionResponses.push(processedResponse);
      allResponses.push(processedResponse);
    }

    // Calculate session metrics
    const metrics = calculateCalibrationMetrics(sessionResponses);
    eceTrajectory.push(metrics.ece);
    brierTrajectory.push(metrics.brier_score);

    const meanKStar = mean(learner.items.map(i => i.true_state.K_star));
    KStarTrajectory.push(meanKStar);
    KHatTrajectory.push(systemBelief.K_hat);

    // Check mastery (K* > 0.9 sustained for 2 consecutive sessions)
    if (meanKStar > 0.9) {
      masteryCount++;
      if (masteryCount >= 2 && masteryAchievedSession < 0) {
        masteryAchievedSession = session;
      }
    } else {
      masteryCount = 0;
    }

    // Store session data
    sessionDataList.push({
      session_number: session,
      items_reviewed: itemsToReview.length,
      correct_count: correctCount,
      mean_confidence: mean(sessionResponses.map(r => r.confidence)),
      mean_rt: mean(sessionResponses.map(r => r.response_time)),
      type1_count: type1Count,
      type2_count: type2Count,
      scaffolds_delivered: scaffoldsDelivered,
      mean_K_star: meanKStar,
      mean_K_hat: systemBelief.K_hat,
      ece: metrics.ece,
      brier: metrics.brier_score,
    });
  }

  // Report completion
  if (onProgress) {
    onProgress(100, 'Simulation complete');
  }

  // Calculate final metrics
  const finalKStar = mean(learner.items.map(i => i.true_state.K_star));
  const retention1 = calculateRetention(finalKStar, learner.params.lambda, 1);
  const retention7 = calculateRetention(finalKStar, learner.params.lambda, 7);
  const retention30 = calculateRetention(finalKStar, learner.params.lambda, 30);

  return {
    profile_id: profile.id,
    scheduler_type: config.scheduler_type,
    config,
    retention_1day: retention1,
    retention_7day: retention7,
    retention_30day: retention30,
    time_to_mastery: masteryAchievedSession >= 0 ? masteryAchievedSession : config.num_sessions,
    review_efficiency: allResponses.length / config.num_items,
    total_review_time: allResponses.reduce((s, r) => s + r.response_time, 0),
    ece_trajectory: eceTrajectory,
    brier_trajectory: brierTrajectory,
    K_star_trajectory: KStarTrajectory,
    K_hat_trajectory: KHatTrajectory,
    session_data: sessionDataList,
  };
}

/**
 * Run simulation asynchronously (for UI responsiveness)
 */
export async function runSimulationAsync(
  profile: LearnerProfile,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  onProgress?: ProgressCallback
): Promise<SimulationResults> {
  return new Promise((resolve) => {
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const results = runSimulation(profile, config, onProgress);
      resolve(results);
    }, 0);
  });
}

/**
 * Run simulations for all profiles and conditions
 */
export function runExperiment(
  profiles: LearnerProfile[],
  schedulerTypes: SchedulerType[],
  config: SimulationConfig,
  replications: number = 1,
  onProgress?: ProgressCallback
): Map<string, Map<SchedulerType, SimulationResults[]>> {
  const results = new Map<string, Map<SchedulerType, SimulationResults[]>>();

  const totalRuns = profiles.length * schedulerTypes.length * replications;
  let completedRuns = 0;

  for (const profile of profiles) {
    const profileResults = new Map<SchedulerType, SimulationResults[]>();

    for (const schedulerType of schedulerTypes) {
      const repResults: SimulationResults[] = [];

      for (let rep = 0; rep < replications; rep++) {
        const simConfig: SimulationConfig = {
          ...config,
          scheduler_type: schedulerType,
          random_seed: config.random_seed ? config.random_seed + rep : null,
        };

        const result = runSimulation(profile, simConfig);
        repResults.push(result);

        completedRuns++;
        if (onProgress) {
          const progress = (completedRuns / totalRuns) * 100;
          onProgress(progress, `${profile.id} - ${schedulerType} - Rep ${rep + 1}`);
        }
      }

      profileResults.set(schedulerType, repResults);
    }

    results.set(profile.id, profileResults);
  }

  return results;
}

/**
 * Run feature-removal tests (ablation study)
 */
export function runFeatureRemovalTests(
  profile: LearnerProfile,
  baseConfig: SimulationConfig,
  replications: number = 5
): Map<string, SimulationResults[]> {
  const conditions = [
    { name: 'Full CalibrateMe', config: { ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME, enable_scaffolding: true, enable_dual_process: true } },
    { name: 'No Dual-Process', config: { ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME, enable_scaffolding: true, enable_dual_process: false } },
    { name: 'No Scaffolding', config: { ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME, enable_scaffolding: false, enable_dual_process: true } },
    { name: 'Calibration Only', config: { ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME, enable_scaffolding: false, enable_dual_process: false } },
    { name: 'SM-2 Baseline', config: { ...baseConfig, scheduler_type: SchedulerType.SM2 } },
    { name: 'BKT-Only', config: { ...baseConfig, scheduler_type: SchedulerType.BKT_ONLY } },
  ];

  const results = new Map<string, SimulationResults[]>();

  for (const condition of conditions) {
    const conditionResults: SimulationResults[] = [];

    for (let rep = 0; rep < replications; rep++) {
      const config: SimulationConfig = {
        ...condition.config,
        random_seed: baseConfig.random_seed ? baseConfig.random_seed + rep : rep,
      };

      const result = runSimulation(profile, config);
      conditionResults.push(result);
    }

    results.set(condition.name, conditionResults);
  }

  return results;
}
