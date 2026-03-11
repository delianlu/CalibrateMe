import { analyzeLongitudinal, LongitudinalReport } from '../src/features/analytics/longitudinalAnalysis';
import { SessionData } from '../src/types';

/**
 * Helper to create a minimal SessionData object
 */
function makeSession(overrides: Partial<SessionData> & { session_number: number }): SessionData {
  return {
    items_reviewed: 10,
    correct_count: 7,
    mean_confidence: 0.7,
    mean_rt: 2.0,
    type1_count: 3,
    type2_count: 7,
    scaffolds_delivered: 0,
    mean_K_star: 0.5,
    mean_K_hat: 0.5,
    ece: 0.15,
    brier: 0.25,
    ...overrides,
  };
}

describe('Longitudinal Analysis', () => {
  describe('trend detection', () => {
    it('should detect improving ECE trend (decreasing ECE)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, ece: 0.30 }),
        makeSession({ session_number: 2, ece: 0.25 }),
        makeSession({ session_number: 3, ece: 0.20 }),
        makeSession({ session_number: 4, ece: 0.15 }),
        makeSession({ session_number: 5, ece: 0.10 }),
        makeSession({ session_number: 6, ece: 0.05 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.eceTrend.direction).toBe('improving');
      expect(report.eceTrend.slope).toBeLessThan(0);
    });

    it('should detect declining ECE trend (increasing ECE)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, ece: 0.05 }),
        makeSession({ session_number: 2, ece: 0.10 }),
        makeSession({ session_number: 3, ece: 0.15 }),
        makeSession({ session_number: 4, ece: 0.20 }),
        makeSession({ session_number: 5, ece: 0.25 }),
        makeSession({ session_number: 6, ece: 0.30 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.eceTrend.direction).toBe('declining');
      expect(report.eceTrend.slope).toBeGreaterThan(0);
    });

    it('should detect stable trend for near-constant values', () => {
      const sessions: SessionData[] = Array.from({ length: 10 }, (_, i) =>
        makeSession({ session_number: i + 1, ece: 0.10 + (Math.random() * 0.001 - 0.0005) })
      );
      const report = analyzeLongitudinal(sessions);
      expect(report.eceTrend.direction).toBe('stable');
    });

    it('should detect improving accuracy trend', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, correct_count: 3, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 5, items_reviewed: 10 }),
        makeSession({ session_number: 3, correct_count: 7, items_reviewed: 10 }),
        makeSession({ session_number: 4, correct_count: 8, items_reviewed: 10 }),
        makeSession({ session_number: 5, correct_count: 9, items_reviewed: 10 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.accuracyTrend.direction).toBe('improving');
    });

    it('should detect improving knowledge trend', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_K_star: 0.3 }),
        makeSession({ session_number: 2, mean_K_star: 0.5 }),
        makeSession({ session_number: 3, mean_K_star: 0.7 }),
        makeSession({ session_number: 4, mean_K_star: 0.8 }),
        makeSession({ session_number: 5, mean_K_star: 0.9 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.knowledgeTrend.direction).toBe('improving');
    });
  });

  describe('phase classification', () => {
    it('should classify mastered phase when final K* >= 0.9', () => {
      const sessions: SessionData[] = Array.from({ length: 10 }, (_, i) =>
        makeSession({ session_number: i + 1, mean_K_star: 0.3 + i * 0.07 })
      );
      // Last session K* = 0.3 + 9 * 0.07 = 0.93
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.currentPhase).toBe('mastered');
    });

    it('should classify early-learning when K* < 0.4', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_K_star: 0.2 }),
        makeSession({ session_number: 2, mean_K_star: 0.25 }),
        makeSession({ session_number: 3, mean_K_star: 0.3 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.currentPhase).toBe('early-learning');
    });

    it('should classify rapid-growth for intermediate K* with positive gain', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_K_star: 0.4 }),
        makeSession({ session_number: 2, mean_K_star: 0.5 }),
        makeSession({ session_number: 3, mean_K_star: 0.6 }),
        makeSession({ session_number: 4, mean_K_star: 0.7 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.currentPhase).toBe('rapid-growth');
    });

    it('should classify plateau when gains stall', () => {
      // Need > 5 sessions with low gain rate and K* < 0.9
      const sessions: SessionData[] = Array.from({ length: 10 }, (_, i) =>
        makeSession({ session_number: i + 1, mean_K_star: 0.60 + i * 0.001 })
      );
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.currentPhase).toBe('plateau');
    });
  });

  describe('learning velocity', () => {
    it('should detect sessions to 80% accuracy', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, correct_count: 5, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 6, items_reviewed: 10 }),
        makeSession({ session_number: 3, correct_count: 8, items_reviewed: 10 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.sessionsTo80Accuracy).toBe(3);
    });

    it('should return null if 80% accuracy never reached', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, correct_count: 3, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 4, items_reviewed: 10 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.sessionsTo80Accuracy).toBeNull();
    });

    it('should detect sessions to good calibration (ECE < 0.10)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, ece: 0.20 }),
        makeSession({ session_number: 2, ece: 0.15 }),
        makeSession({ session_number: 3, ece: 0.08 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.learningVelocity.sessionsToGoodCalibration).toBe(3);
    });
  });

  describe('calibration drift', () => {
    it('should find best calibration session', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, ece: 0.20 }),
        makeSession({ session_number: 2, ece: 0.05 }),
        makeSession({ session_number: 3, ece: 0.15 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.calibrationDrift.bestCalibrationSession).toBe(2);
      expect(report.calibrationDrift.bestECE).toBe(0.05);
    });
  });

  describe('session quality', () => {
    it('should detect regression sessions (>15pp accuracy drop)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, correct_count: 8, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 5, items_reviewed: 10 }), // 80% → 50% = -30pp
        makeSession({ session_number: 3, correct_count: 7, items_reviewed: 10 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.sessionQuality.regressionSessions).toContain(2);
    });

    it('should detect breakout sessions (>15pp accuracy spike)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, correct_count: 5, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 9, items_reviewed: 10 }), // 50% → 90% = +40pp
        makeSession({ session_number: 3, correct_count: 8, items_reviewed: 10 }),
      ];
      const report = analyzeLongitudinal(sessions);
      expect(report.sessionQuality.breakoutSessions).toContain(2);
    });
  });

  describe('empty input', () => {
    it('should handle empty sessions array', () => {
      const report = analyzeLongitudinal([]);
      expect(report.eceTrend.direction).toBe('stable');
      expect(report.summary).toBe('No session data available.');
    });
  });

  describe('summary generation', () => {
    it('should generate a non-empty summary string', () => {
      const sessions: SessionData[] = Array.from({ length: 5 }, (_, i) =>
        makeSession({ session_number: i + 1, mean_K_star: 0.3 + i * 0.1, ece: 0.20 - i * 0.02 })
      );
      const report = analyzeLongitudinal(sessions);
      expect(report.summary.length).toBeGreaterThan(0);
      expect(report.summary.endsWith('.')).toBe(true);
    });
  });
});
