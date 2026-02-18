// =============================================================================
// Adaptive Scaffolding Module
// Delivers prompts that modify β* over time (Equation 7)
// =============================================================================

import {
  ScaffoldType,
  CalibrationType,
  TrueLearnerState,
  ProcessedResponse,
} from '../types';

/**
 * Scaffold prompt templates
 */
export const SCAFFOLD_PROMPTS = {
  [ScaffoldType.REFLECTION]: [
    "Take a moment to reflect: Was your confidence level accurate for this item?",
    "Consider: Are you perhaps overestimating your knowledge of this topic?",
    "Think about what made this item challenging. Does your confidence match the difficulty?",
    "Pause and ask yourself: Do I truly know this, or am I just familiar with it?",
  ],
  [ScaffoldType.ENCOURAGEMENT]: [
    "You're doing better than you think! Trust your knowledge more.",
    "Your answer was correct - have more confidence in your abilities!",
    "Remember: You've studied this material. Give yourself credit for what you know.",
    "Great job! Your performance suggests you know more than you realize.",
  ],
  [ScaffoldType.NONE]: [],
};

/**
 * Select appropriate scaffold based on calibration estimate
 */
export function selectScaffold(
  beta_hat: number,
  _recent_responses: ProcessedResponse[],
  threshold: number = 0.1
): ScaffoldType {
  if (beta_hat > threshold) {
    return ScaffoldType.REFLECTION;
  } else if (beta_hat < -threshold) {
    return ScaffoldType.ENCOURAGEMENT;
  }
  return ScaffoldType.NONE;
}

/**
 * Check if scaffold should be triggered
 */
export function shouldTriggerScaffold(
  calibration_type: CalibrationType,
  responses_since_last_scaffold: number,
  min_interval: number = 5
): boolean {
  // Don't scaffold well-calibrated learners
  if (calibration_type === CalibrationType.WELL_CALIBRATED) {
    return false;
  }

  // Don't scaffold too frequently
  if (responses_since_last_scaffold < min_interval) {
    return false;
  }

  return true;
}

/**
 * Apply scaffolding effect on true calibration (Equation 7)
 * β*_{t+1} = β*_t × (1 - δ)
 */
export function applyScaffoldingEffect(
  beta_star: number,
  delta: number
): number {
  // Scaffolding reduces the magnitude of miscalibration
  return beta_star * (1 - delta);
}

/**
 * Get a random prompt for the scaffold type
 */
export function getScaffoldPrompt(
  scaffoldType: ScaffoldType,
  randomIndex: number = Math.floor(Math.random() * 4)
): string {
  const prompts = SCAFFOLD_PROMPTS[scaffoldType];
  if (prompts.length === 0) return '';
  return prompts[randomIndex % prompts.length];
}

/**
 * Adaptive Scaffolding Manager
 */
export class AdaptiveScaffoldingManager {
  private delta: number;
  private threshold: number;
  private minInterval: number;
  private responsesSinceLastScaffold: number;
  private scaffoldHistory: Array<{ type: ScaffoldType; timestamp: Date }>;

  constructor(
    delta: number = 0.03,
    threshold: number = 0.1,
    minInterval: number = 5
  ) {
    this.delta = delta;
    this.threshold = threshold;
    this.minInterval = minInterval;
    this.responsesSinceLastScaffold = 0;
    this.scaffoldHistory = [];
  }

  /**
   * Process a response and potentially deliver scaffold
   */
  processResponse(
    _response: ProcessedResponse,
    beta_hat: number,
    learner_state: TrueLearnerState
  ): {
    scaffold: ScaffoldType;
    prompt: string;
    updated_beta_star: number;
  } {
    this.responsesSinceLastScaffold++;

    // Determine calibration type
    let calibration_type: CalibrationType;
    if (beta_hat > this.threshold) {
      calibration_type = CalibrationType.OVERCONFIDENT;
    } else if (beta_hat < -this.threshold) {
      calibration_type = CalibrationType.UNDERCONFIDENT;
    } else {
      calibration_type = CalibrationType.WELL_CALIBRATED;
    }

    // Check if we should trigger scaffold
    if (!shouldTriggerScaffold(calibration_type, this.responsesSinceLastScaffold, this.minInterval)) {
      return {
        scaffold: ScaffoldType.NONE,
        prompt: '',
        updated_beta_star: learner_state.beta_star,
      };
    }

    // Select and apply scaffold
    const scaffold = selectScaffold(beta_hat, [], this.threshold);

    if (scaffold !== ScaffoldType.NONE) {
      this.responsesSinceLastScaffold = 0;
      this.scaffoldHistory.push({ type: scaffold, timestamp: new Date() });

      const updated_beta_star = applyScaffoldingEffect(learner_state.beta_star, this.delta);
      const prompt = getScaffoldPrompt(scaffold);

      return {
        scaffold,
        prompt,
        updated_beta_star,
      };
    }

    return {
      scaffold: ScaffoldType.NONE,
      prompt: '',
      updated_beta_star: learner_state.beta_star,
    };
  }

  /**
   * Get scaffold history
   */
  getHistory(): Array<{ type: ScaffoldType; timestamp: Date }> {
    return [...this.scaffoldHistory];
  }

  /**
   * Reset manager state
   */
  reset(): void {
    this.responsesSinceLastScaffold = 0;
    this.scaffoldHistory = [];
  }
}
