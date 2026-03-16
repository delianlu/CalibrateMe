import {
  brierScore,
  aggregateBrierScore,
  expectedCalibrationError,
  detectMiscalibration,
  estimateBetaHat,
  calculateCalibrationMetrics,
} from '../src/calibration/scoringModule';
import { Response, CalibrationType } from '../src/types';

describe('Calibration Scoring Module', () => {
  describe('brierScore', () => {
    it('should return 0 for perfect prediction (correct with 100% confidence)', () => {
      expect(brierScore(1.0, true)).toBe(0);
    });

    it('should return 0 for perfect prediction (incorrect with 0% confidence)', () => {
      expect(brierScore(0.0, false)).toBe(0);
    });

    it('should return 1 for worst prediction (incorrect with 100% confidence)', () => {
      expect(brierScore(1.0, false)).toBe(1);
    });

    it('should return 0.25 for 50% confidence on correct answer', () => {
      expect(brierScore(0.5, true)).toBe(0.25);
    });
  });

  describe('aggregateBrierScore', () => {
    it('should return average Brier score', () => {
      const responses: Response[] = [
        { item_id: '1', correctness: true, confidence: 1.0, response_time: 2, timestamp: new Date() },
        { item_id: '2', correctness: false, confidence: 0.0, response_time: 2, timestamp: new Date() },
      ];
      expect(aggregateBrierScore(responses)).toBe(0);
    });
  });

  describe('expectedCalibrationError', () => {
    it('should return 0 for perfectly calibrated responses', () => {
      // Create responses where confidence = accuracy in each bin
      const responses: Response[] = [];
      const rng = new (require('../src/utils/random').SeededRandom)(42);
      for (let i = 0; i < 100; i++) {
        const confidence = (i % 10) / 10 + 0.05;
        const correctness = rng.random() < confidence;
        responses.push({
          item_id: `${i}`,
          correctness,
          confidence,
          response_time: 2,
          timestamp: new Date(),
        });
      }
      // ECE should be relatively low for many responses
      const ece = expectedCalibrationError(responses);
      expect(ece).toBeLessThan(0.2);
    });
  });

  describe('detectMiscalibration', () => {
    it('should detect overconfidence', () => {
      const responses: Response[] = Array(100).fill(null).map((_, i) => ({
        item_id: `${i}`,
        correctness: i < 50, // 50% accuracy
        confidence: 0.8,    // 80% confidence
        response_time: 2,
        timestamp: new Date(),
      }));
      expect(detectMiscalibration(responses)).toBe(CalibrationType.OVERCONFIDENT);
    });

    it('should detect underconfidence', () => {
      const responses: Response[] = Array(100).fill(null).map((_, i) => ({
        item_id: `${i}`,
        correctness: i < 80, // 80% accuracy
        confidence: 0.5,    // 50% confidence
        response_time: 2,
        timestamp: new Date(),
      }));
      expect(detectMiscalibration(responses)).toBe(CalibrationType.UNDERCONFIDENT);
    });
  });

  describe('estimateBetaHat', () => {
    it('should return 0 when no responses', () => {
      expect(estimateBetaHat([])).toBe(0);
    });

    it('should calculate correct beta_hat difference', () => {
      const responses: Response[] = Array(10).fill(null).map((_, i) => ({
        item_id: `${i}`,
        correctness: i < 5, // 50% accuracy
        confidence: 0.8,    // 80% confidence
        response_time: 2,
        timestamp: new Date(),
      }));
      // beta_hat = meanConfidence - meanAccuracy = 0.8 - 0.5 = 0.3
      expect(estimateBetaHat(responses)).toBeCloseTo(0.3);
    });
  });

  describe('calculateCalibrationMetrics', () => {
    it('should return complete metrics', () => {
      const responses: Response[] = [
        { item_id: '1', correctness: true, confidence: 0.9, response_time: 2, timestamp: new Date() },
        { item_id: '2', correctness: false, confidence: 0.9, response_time: 2, timestamp: new Date() },
      ];
      const metrics = calculateCalibrationMetrics(responses);
      
      expect(metrics).toHaveProperty('brier_score');
      expect(metrics).toHaveProperty('ece');
      expect(metrics).toHaveProperty('mce');
      expect(metrics).toHaveProperty('calibration_direction');
      expect(metrics).toHaveProperty('bin_data');
    });
  });
});
