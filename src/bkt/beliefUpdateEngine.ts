// =============================================================================
// Bayesian Knowledge Tracing Belief Update Engine
// Implements Equation 1 from the project pitch
// =============================================================================

import { Response, SystemBelief, SimulationConfig } from '../types';
import { clip } from '../utils/random';

/**
 * Calculate likelihood of correctness given knowledge estimate
 * P(y|K̂) using slip-guess model
 */
export function likelihoodCorrectness(
  y: boolean,
  K_hat: number,
  slip: number,
  guess: number
): number {
  const p_correct = (1 - slip) * K_hat + guess * (1 - K_hat);
  return y ? p_correct : (1 - p_correct);
}

/**
 * Calculate likelihood of confidence given knowledge estimate
 * P(c|K̂) assuming c ~ N(K̂ + β̂, σ²)
 */
export function likelihoodConfidence(
  c: number,
  K_hat: number,
  beta_hat: number,
  sigma: number
): number {
  const expected_c = K_hat + beta_hat;
  const z = (c - expected_c) / sigma;
  // Gaussian PDF (unnormalized is fine for Bayes)
  return Math.exp(-0.5 * z * z);
}

/**
 * Calculate likelihood of response time given knowledge estimate
 * P(τ|K̂) assuming RT decreases with knowledge
 */
export function likelihoodRT(
  tau: number,
  K_hat: number,
  tau_base: number,
  gamma: number,
  sigma: number
): number {
  const expected_tau = tau_base * (1 + gamma * (1 - K_hat));
  const z = (tau - expected_tau) / sigma;
  return Math.exp(-0.5 * z * z);
}

/**
 * Perform Bayesian belief update (Equation 1)
 * P(K̂|y,c,τ) ∝ P(y|K̂) × P(c|K̂) × P(τ|K̂) × P(K̂)
 *
 * Uses grid approximation for tractability
 */
export function updateBelief(
  response: Response,
  current_belief: SystemBelief,
  config: SimulationConfig,
  grid_points: number = 101
): SystemBelief {
  const { slip_probability, guess_probability, confidence_noise_std, rt_noise_std, rt_base, rt_gamma } = config;

  // Create grid of K̂ values
  const K_values: number[] = [];
  const posteriors: number[] = [];

  for (let i = 0; i < grid_points; i++) {
    const K = i / (grid_points - 1);
    K_values.push(K);

    // Prior: peaked at current belief
    const prior = Math.exp(-0.5 * ((K - current_belief.K_hat) / 0.2) ** 2);

    // Likelihoods
    const L_y = likelihoodCorrectness(response.correctness, K, slip_probability, guess_probability);
    const L_c = likelihoodConfidence(response.confidence, K, current_belief.beta_hat, confidence_noise_std);
    const L_tau = likelihoodRT(response.response_time, K, rt_base, rt_gamma, rt_noise_std);

    // Posterior (unnormalized)
    posteriors.push(prior * L_y * L_c * L_tau);
  }

  // Normalize
  const sum = posteriors.reduce((a, b) => a + b, 0);
  const normalized = posteriors.map(p => p / sum);

  // Compute expected value of K̂
  let K_hat_new = 0;
  for (let i = 0; i < grid_points; i++) {
    K_hat_new += K_values[i] * normalized[i];
  }

  // Compute variance for confidence interval
  let variance = 0;
  for (let i = 0; i < grid_points; i++) {
    variance += (K_values[i] - K_hat_new) ** 2 * normalized[i];
  }

  return {
    K_hat: clip(K_hat_new, 0, 1),
    beta_hat: current_belief.beta_hat, // Updated separately
    confidence_interval: Math.sqrt(variance) * 1.96,
    last_updated: new Date(),
  };
}

/**
 * Update beta_hat estimate based on recent responses
 */
export function updateBetaHat(
  responses: Response[],
  current_beta_hat: number,
  learning_rate: number = 0.1
): number {
  if (responses.length === 0) return current_beta_hat;

  // Calculate recent calibration gap
  const recent = responses.slice(-10); // Last 10 responses
  const mean_conf = recent.reduce((s, r) => s + r.confidence, 0) / recent.length;
  const mean_acc = recent.reduce((s, r) => s + (r.correctness ? 1 : 0), 0) / recent.length;
  const observed_beta = mean_conf - mean_acc;

  // Exponential moving average
  return current_beta_hat + learning_rate * (observed_beta - current_beta_hat);
}

/**
 * Apply forgetting drift to belief between sessions
 */
export function applyBeliefDrift(
  belief: SystemBelief,
  lambda: number,
  days_elapsed: number
): SystemBelief {
  // Belief drifts toward uncertainty (0.5) over time
  const decay = Math.exp(-lambda * days_elapsed);
  const K_hat_drifted = belief.K_hat * decay + 0.5 * (1 - decay);

  return {
    ...belief,
    K_hat: K_hat_drifted,
    confidence_interval: belief.confidence_interval * (1 + 0.1 * days_elapsed), // Uncertainty grows
  };
}
