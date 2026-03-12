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
  ItemType,
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
  // Extended profiles for boundary/robustness testing
  'Extreme-Over': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.15,
    lambda: 0.12,
    beta_star: 0.35,
  },
  'Extreme-Under': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.15,
    lambda: 0.12,
    beta_star: -0.30,
  },
  'Fast-Forget-Over': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.20,
    lambda: 0.20,
    beta_star: 0.25,
  },
  'Noisy-Confidence': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.15,
  },
  'HighAb-Extreme-Over': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: 0.30,
  },
  'Minimal-Bias': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.05,
  },
  // Crammer's Crash profile: high overconfidence, fast forgetting, slow learning
  'Crammer': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.10,
    lambda: 0.25,
    beta_star: 0.30,
    initial_k_star: 0.5,
    rt_base: 2.0,
    rt_gamma: 1.5,
    confidence_noise_std: 0.08,
  },
  // Domain-asymmetric profiles for domain-split calibration testing
  'Vocab-Over-Grammar-Under': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT, // dominant direction
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.05, // mild global bias
    beta_star_vocab: 0.25,
    beta_star_grammar: -0.15,
  },
  'Vocab-Under-Grammar-Over': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.05,
    beta_star_vocab: -0.15,
    beta_star_grammar: 0.25,
  },
  'Vocab-Well-Grammar-Over': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.25,
    lambda: 0.08,
    beta_star: 0.10,
    beta_star_vocab: 0.00,
    beta_star_grammar: 0.20,
  },
  'Both-Over-Asymmetric': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.15,
    lambda: 0.12,
    beta_star: 0.20,
    beta_star_vocab: 0.30,
    beta_star_grammar: 0.10,
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

  const initialKStar = params.initial_k_star ?? 0.3;

  const trueState: TrueLearnerState = {
    K_star: initialKStar,
    beta_star: params.beta_star,
    alpha: params.alpha,
    alpha_err: params.alpha * 0.5,
    lambda: params.lambda,
  };

  const systemBelief: SystemBelief = {
    K_hat: initialKStar,
    beta_hat: 0, // System starts with no calibration estimate
    confidence_interval: 0.2,
    last_updated: new Date(),
  };

  // Create item pool — alternate between vocabulary and grammar items
  const items: Item[] = [];
  const itemInitialK = params.initial_k_star ? params.initial_k_star * 0.3 : 0.1;
  for (let i = 0; i < numItems; i++) {
    const difficulty = (i % 3) * 0.33 + 0.17; // Easy/Medium/Hard
    const itemType = i % 2 === 0 ? ItemType.VOCABULARY : ItemType.GRAMMAR;
    items.push(createItem(`item-${i}`, difficulty, itemInitialK, itemType));
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
export function createItem(id: string, difficulty: number, initialKStar: number = 0.1, itemType?: ItemType): Item {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    id,
    difficulty,
    item_type: itemType,
    true_state: {
      K_star: initialKStar,
      last_review: null,
    },
    system_belief: {
      K_hat: initialKStar,
      beta_hat: 0,
      next_review: tomorrow,
      interval_days: 1,
      ease_factor: 2.5,
    },
    review_history: [],
  };
}

/** The original 9 core profiles (3×3 ability × calibration grid) */
export const CORE_PROFILE_NAMES = [
  'Low-Over', 'Low-Under', 'Low-Well',
  'Med-Over', 'Med-Under', 'Med-Well',
  'High-Over', 'High-Under', 'High-Well',
];

/** The 6 extended boundary-testing profiles */
export const EXTENDED_PROFILE_NAMES = [
  'Extreme-Over', 'Extreme-Under', 'Fast-Forget-Over',
  'Noisy-Confidence', 'HighAb-Extreme-Over', 'Minimal-Bias',
  'Crammer',
];

export const DOMAIN_SPLIT_PROFILE_NAMES = [
  'Vocab-Over-Grammar-Under', 'Vocab-Under-Grammar-Over',
  'Vocab-Well-Grammar-Over', 'Both-Over-Asymmetric',
];

/**
 * Get all profile names (core + extended)
 */
export function getAllProfileNames(): string[] {
  return Object.keys(PROFILE_PARAMS);
}

/**
 * Get only the core 9 profile names
 */
export function getCoreProfileNames(): string[] {
  return [...CORE_PROFILE_NAMES];
}

/**
 * Create all profiles
 */
export function createAllProfiles(numItems: number = 100): LearnerProfile[] {
  return getAllProfileNames().map(name => createLearnerProfile(name, numItems));
}
