// =============================================================================
// Response Generator Module
// Implements Equations 4, 5, 6 from the project pitch
// =============================================================================

import { Response, TrueLearnerState, Item, SimulationConfig } from '../types';
import { SeededRandom, clip } from '../utils/random';

/**
 * Generate correctness based on slip-guess model (Equation 4)
 * P(y=1|K*) = (1-s) × K* + g × (1-K*)
 */
export function generateCorrectness(
  K_star: number,
  slip: number,
  guess: number,
  random: SeededRandom
): boolean {
  const p_correct = (1 - slip) * K_star + guess * (1 - K_star);
  return random.randomBoolean(p_correct);
}

/**
 * Generate confidence based on true knowledge + miscalibration (Equation 5)
 * c = clip(K* + β* + ε_c, 0, 1)
 */
export function generateConfidence(
  K_star: number,
  beta_star: number,
  noise_std: number,
  random: SeededRandom
): number {
  const epsilon_c = random.randomNormal(0, noise_std);
  return clip(K_star + beta_star + epsilon_c, 0, 1);
}

/**
 * Generate response time based on knowledge level (Equation 6)
 * τ = τ_base × (1 + γ × (1 - K*)) + ε_τ
 */
export function generateResponseTime(
  K_star: number,
  tau_base: number,
  gamma: number,
  noise_std: number,
  random: SeededRandom
): number {
  const epsilon_tau = random.randomNormal(0, noise_std);
  const tau = tau_base * (1 + gamma * (1 - K_star)) + epsilon_tau;
  return Math.max(0.5, tau); // Minimum 0.5 seconds
}

/**
 * Generate a complete response for an item
 */
export function generateResponse(
  item: Item,
  learner_state: TrueLearnerState,
  config: SimulationConfig,
  random: SeededRandom
): Response {
  const K_star = item.true_state.K_star;

  // Adjust base RT by item difficulty
  const tau_base_adjusted = config.rt_base * (1 + item.difficulty * 0.5);

  const correctness = generateCorrectness(
    K_star,
    config.slip_probability,
    config.guess_probability,
    random
  );

  const confidence = generateConfidence(
    K_star,
    learner_state.beta_star,
    config.confidence_noise_std,
    random
  );

  const response_time = generateResponseTime(
    K_star,
    tau_base_adjusted,
    config.rt_gamma,
    config.rt_noise_std,
    random
  );

  return {
    item_id: item.id,
    correctness,
    confidence,
    response_time,
    timestamp: new Date(),
  };
}

/**
 * Batch generate responses for multiple items
 */
export function generateResponses(
  items: Item[],
  learner_state: TrueLearnerState,
  config: SimulationConfig,
  random: SeededRandom
): Response[] {
  return items.map(item => generateResponse(item, learner_state, config, random));
}
