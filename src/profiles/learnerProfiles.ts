// =============================================================================
// Learner Profiles
// Defines the 9 synthetic learner profiles (3 Ability × 3 Calibration)
// =============================================================================

import {
  AbilityLevel,
  CalibrationType,
  LearnerProfile,
  LearnerProfileParams,
  TrueLearnerState,
  SystemBelief,
  Item,
} from '../types';

/**
 * Profile parameter definitions (Table 2 from pitch)
 */
export const PROFILE_PARAMS: Record<string, LearnerProfileParams> = {
  'Low-Over': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: 0.25,
  },
  'Low-Under': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: -0.20,
  },
  'Low-Well': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: 0.00,
  },
  'Med-Over': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.20,
  },
  'Med-Under': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: -0.15,
  },
  'Med-Well': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.00,
  },
  'High-Over': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: 0.15,
  },
  'High-Under': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: -0.10,
  },
  'High-Well': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: 0.00,
  },
};

/**
 * Create a learner profile by name
 */
export function createLearnerProfile(
  profileName: string,
  numItems: number = 100
): LearnerProfile {
  const params = PROFILE_PARAMS[profileName];
  if (!params) {
    throw new Error(`Unknown profile: ${profileName}`);
  }

  const trueState: TrueLearnerState = {
    K_star: 0.3, // Initial global knowledge
    beta_star: params.beta_star,
    alpha: params.alpha,
    alpha_err: params.alpha * 0.5,
    lambda: params.lambda,
  };

  const systemBelief: SystemBelief = {
    K_hat: 0.3,
    beta_hat: 0, // System starts with no calibration estimate
    confidence_interval: 0.2,
    last_updated: new Date(),
  };

  // Create item pool
  const items: Item[] = [];
  for (let i = 0; i < numItems; i++) {
    const difficulty = (i % 3) * 0.33 + 0.17; // Easy/Medium/Hard
    items.push(createItem(`item-${i}`, difficulty));
  }

  return {
    id: profileName,
    name: profileName,
    params,
    true_state: trueState,
    system_belief: systemBelief,
    items,
    response_history: [],
    session_count: 0,
  };
}

/**
 * Create an item
 */
export function createItem(id: string, difficulty: number): Item {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    id,
    difficulty,
    true_state: {
      K_star: 0.1, // Start with low knowledge
      last_review: null,
    },
    system_belief: {
      K_hat: 0.1,
      beta_hat: 0,
      next_review: tomorrow,
      interval_days: 1,
      ease_factor: 2.5,
    },
    review_history: [],
  };
}

/**
 * Get all profile names
 */
export function getAllProfileNames(): string[] {
  return Object.keys(PROFILE_PARAMS);
}

/**
 * Create all 9 profiles
 */
export function createAllProfiles(numItems: number = 100): LearnerProfile[] {
  return getAllProfileNames().map(name => createLearnerProfile(name, numItems));
}
