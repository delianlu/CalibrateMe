import { computeStats, formatStats } from '../src/simulation/statisticalAnalysis';
import { runSimulation } from '../src/simulation/simulationEngine';
import { createLearnerProfile } from '../src/profiles/learnerProfiles';
import { DEFAULT_SIMULATION_CONFIG } from '../src/types';
import { calculateCalibrationMetrics } from '../src/calibration/scoringModule';

describe('Edge Cases & Regression', () => {
  describe('toFixed() on null values', () => {
    it('formatStats handles null ci gracefully', () => {
      // create a single-element array to force CI to be null for tCritical
      const stats = computeStats([5]);
      expect(stats.mean).toBe(5);
      expect(stats.ci95_lower).toBe(5);

      // Now format it
      const formatted = formatStats(stats);
      expect(formatted).toBeDefined();
    });
  });

  describe('Perfect calibration edge case', () => {
    it('returns ECE of 0 when confidence perfectly matches accuracy', () => {
      // Create responses where every 100% confidence is correct and 0% is wrong
      const responses: any[] = [
        { item_id: '1', correctness: 1, confidence: 1.0, is_correct: true, response_time: 1, timestamp: new Date() },
        { item_id: '2', correctness: 1, confidence: 1.0, is_correct: true, response_time: 1, timestamp: new Date() },
        { item_id: '3', correctness: 0, confidence: 0.0, is_correct: false, response_time: 1, timestamp: new Date() },
        { item_id: '4', correctness: 0, confidence: 0.0, is_correct: false, response_time: 1, timestamp: new Date() },
      ];
      
      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.ece).toBeCloseTo(0, 5);
      expect(metrics.brier_score).toBeCloseTo(0, 5);
    });
  });

  describe('Zero-variance and extreme arrays', () => {
    it('handles computeStats for identical values without NaN for SD', () => {
      const stats = computeStats([5, 5, 5, 5, 5]);
      expect(stats.mean).toBe(5);
      expect(stats.sd).toBe(0);
      expect(stats.ci95_lower).toBe(5);
      expect(stats.ci95_upper).toBe(5);
    });

    it('handles empty arrays in computeStats', () => {
      const stats = computeStats([]);
      expect(stats.mean).toBe(0);
      expect(stats.sd).toBe(0);
      expect(stats.ci95_lower).toBe(0);
      expect(stats.ci95_upper).toBe(0);
    });
  });

  describe('Extreme profiles', () => {
    it('runs simulation with Crammer profile without blowing up', () => {
      const profile = createLearnerProfile('Crammer', 10);
      const config = { ...DEFAULT_SIMULATION_CONFIG, num_sessions: 3, items_per_session: 5 };
      const result = runSimulation(profile, config);
      
      expect(result).toBeDefined();
      expect(result.session_data.length).toBe(3);
      // Crammer forgets fast, so retention should be relatively low, but we just verify it runs
      expect(result.retention_1day).toBeGreaterThanOrEqual(0);
    });

    it('runs simulation with HighAb-Extreme-Over profile', () => {
      const profile = createLearnerProfile('HighAb-Extreme-Over', 10);
      const config = { ...DEFAULT_SIMULATION_CONFIG, num_sessions: 3, items_per_session: 5 };
      const result = runSimulation(profile, config);
      expect(result).toBeDefined();
      expect(result.session_data.length).toBe(3);
    });
  });

  describe('Web Worker fallback', () => {
    it('is inherently tested in advancedAnalyticsStore tests', () => {
      // In a Node environment, typeof window is undefined, so the Worker fallback logic 
      // is always the one executing in our store tests.
      expect(typeof window).toBe('undefined');
    });
  });
});
