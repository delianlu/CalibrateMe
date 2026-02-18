// =============================================================================
// Calibration Scoring Module
// Implements ECE, Brier Score, and calibration detection
// =============================================================================

import {
  Response,
  CalibrationMetrics,
  CalibrationBin,
  CalibrationType,
} from '../types';
import { mean } from '../utils/statistics';

/**
 * Calculate Brier score for a single response
 * Brier Score = (confidence - correctness)²
 */
export function brierScore(confidence: number, correctness: boolean): number {
  const outcome = correctness ? 1 : 0;
  return (confidence - outcome) ** 2;
}

/**
 * Calculate aggregate Brier score over multiple responses
 */
export function aggregateBrierScore(responses: Response[]): number {
  if (responses.length === 0) return 0;
  const scores = responses.map(r => brierScore(r.confidence, r.correctness));
  return mean(scores);
}

/**
 * Bin responses by confidence level for ECE calculation
 */
export function binResponses(
  responses: Response[],
  numBins: number = 10
): CalibrationBin[] {
  const bins: CalibrationBin[] = [];
  const binWidth = 1 / numBins;

  for (let i = 0; i < numBins; i++) {
    const binStart = i * binWidth;
    const binEnd = (i + 1) * binWidth;

    const binResponses = responses.filter(
      r => r.confidence >= binStart && r.confidence < binEnd
    );

    if (binResponses.length > 0) {
      const meanConfidence = mean(binResponses.map(r => r.confidence));
      const meanAccuracy = mean(binResponses.map(r => r.correctness ? 1 : 0));

      bins.push({
        bin_start: binStart,
        bin_end: binEnd,
        mean_confidence: meanConfidence,
        mean_accuracy: meanAccuracy,
        count: binResponses.length,
        calibration_gap: meanAccuracy - meanConfidence,
      });
    }
  }

  return bins;
}

/**
 * Calculate Expected Calibration Error (ECE)
 * ECE = Σ (|bin_size|/n) × |accuracy(bin) - mean_confidence(bin)|
 */
export function expectedCalibrationError(
  responses: Response[],
  numBins: number = 10
): number {
  if (responses.length === 0) return 0;

  const bins = binResponses(responses, numBins);
  const n = responses.length;

  let ece = 0;
  for (const bin of bins) {
    const weight = bin.count / n;
    const gap = Math.abs(bin.mean_accuracy - bin.mean_confidence);
    ece += weight * gap;
  }

  return ece;
}

/**
 * Calculate Maximum Calibration Error (MCE)
 */
export function maximumCalibrationError(
  responses: Response[],
  numBins: number = 10
): number {
  if (responses.length === 0) return 0;

  const bins = binResponses(responses, numBins);

  let mce = 0;
  for (const bin of bins) {
    const gap = Math.abs(bin.mean_accuracy - bin.mean_confidence);
    mce = Math.max(mce, gap);
  }

  return mce;
}

/**
 * Detect miscalibration direction from responses
 */
export function detectMiscalibration(
  responses: Response[],
  threshold: number = 0.05
): CalibrationType {
  if (responses.length === 0) return CalibrationType.WELL_CALIBRATED;

  // Calculate mean confidence - mean accuracy
  const meanConfidence = mean(responses.map(r => r.confidence));
  const meanAccuracy = mean(responses.map(r => r.correctness ? 1 : 0));
  const gap = meanConfidence - meanAccuracy;

  if (gap > threshold) {
    return CalibrationType.OVERCONFIDENT;
  } else if (gap < -threshold) {
    return CalibrationType.UNDERCONFIDENT;
  } else {
    return CalibrationType.WELL_CALIBRATED;
  }
}

/**
 * Estimate beta_hat (calibration bias) from response history
 */
export function estimateBetaHat(responses: Response[]): number {
  if (responses.length === 0) return 0;

  // β̂ ≈ mean(confidence) - mean(accuracy)
  const meanConfidence = mean(responses.map(r => r.confidence));
  const meanAccuracy = mean(responses.map(r => r.correctness ? 1 : 0));

  return meanConfidence - meanAccuracy;
}

/**
 * Calculate complete calibration metrics
 */
export function calculateCalibrationMetrics(
  responses: Response[],
  numBins: number = 10
): CalibrationMetrics {
  return {
    brier_score: aggregateBrierScore(responses),
    ece: expectedCalibrationError(responses, numBins),
    mce: maximumCalibrationError(responses, numBins),
    calibration_direction: detectMiscalibration(responses),
    bin_data: binResponses(responses, numBins),
  };
}
