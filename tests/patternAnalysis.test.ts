import { analyzePatterns, PatternReport } from '../src/features/analytics/patternAnalysis';
import { SessionData } from '../src/types';

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

describe('Pattern Analysis', () => {
  describe('analyzePatterns', () => {
    it('should return 5 confidence bins', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_confidence: 0.85 }),
        makeSession({ session_number: 2, mean_confidence: 0.75 }),
        makeSession({ session_number: 3, mean_confidence: 0.55 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.confidenceBins).toHaveLength(5);
    });

    it('should assign sessions to correct confidence bins', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_confidence: 0.85 }),
        makeSession({ session_number: 2, mean_confidence: 0.85 }),
      ];
      const report = analyzePatterns(sessions);
      // 0.85 falls in bin 80-100% (index 4)
      const highBin = report.confidenceBins[4];
      expect(highBin.count).toBeGreaterThan(0);
      expect(highBin.binStart).toBe(0.8);
    });

    it('should compute calibration gap as accuracy - midpoint', () => {
      const sessions: SessionData[] = [
        makeSession({
          session_number: 1,
          mean_confidence: 0.85, // bin 80-100%, midpoint = 0.9
          correct_count: 7,
          items_reviewed: 10, // accuracy = 0.7
        }),
      ];
      const report = analyzePatterns(sessions);
      const highBin = report.confidenceBins[4];
      if (highBin.count > 0) {
        // calibrationGap = accuracy - midpoint = 0.7 - 0.9 = -0.2 (overconfident)
        expect(highBin.calibrationGap).toBeCloseTo(0.7 - 0.9, 2);
      }
    });

    it('should handle empty bins correctly', () => {
      // Only sessions in 80-100% bin
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_confidence: 0.85 }),
      ];
      const report = analyzePatterns(sessions);
      const lowBin = report.confidenceBins[0]; // 0-20%
      expect(lowBin.count).toBe(0);
      expect(lowBin.accuracy).toBe(0);
    });
  });

  describe('dual-process breakdown', () => {
    it('should compute high Type 1 ratio when type1_count dominates', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, type1_count: 8, type2_count: 2 }),
        makeSession({ session_number: 2, type1_count: 9, type2_count: 1 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.dualProcess.type1Ratio).toBeGreaterThan(0.5);
    });

    it('should compute low Type 1 ratio when type2_count dominates', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, type1_count: 1, type2_count: 9 }),
        makeSession({ session_number: 2, type1_count: 2, type2_count: 8 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.dualProcess.type1Ratio).toBeLessThan(0.5);
    });

    it('should detect increasing automatization trend', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, type1_count: 1, type2_count: 9 }),
        makeSession({ session_number: 2, type1_count: 3, type2_count: 7 }),
        makeSession({ session_number: 3, type1_count: 5, type2_count: 5 }),
        makeSession({ session_number: 4, type1_count: 7, type2_count: 3 }),
        makeSession({ session_number: 5, type1_count: 9, type2_count: 1 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.dualProcess.type1Trend).toBe('increasing');
    });

    it('should find automatization session (first >50% Type 1)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, type1_count: 2, type2_count: 8 }),
        makeSession({ session_number: 2, type1_count: 4, type2_count: 6 }),
        makeSession({ session_number: 3, type1_count: 6, type2_count: 4 }), // first > 50%
      ];
      const report = analyzePatterns(sessions);
      expect(report.dualProcess.automatizationSession).toBe(3);
    });

    it('should return null for automatizationSession if never >50%', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, type1_count: 2, type2_count: 8 }),
        makeSession({ session_number: 2, type1_count: 3, type2_count: 7 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.dualProcess.automatizationSession).toBeNull();
    });
  });

  describe('effort analysis', () => {
    it('should detect speeding-up RT trend', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_rt: 4.0 }),
        makeSession({ session_number: 2, mean_rt: 3.5 }),
        makeSession({ session_number: 3, mean_rt: 3.0 }),
        makeSession({ session_number: 4, mean_rt: 2.5 }),
        makeSession({ session_number: 5, mean_rt: 2.0 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.effort.rtTrend).toBe('speeding-up');
    });

    it('should detect high-effort sessions (>1.5x mean RT)', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_rt: 2.0 }),
        makeSession({ session_number: 2, mean_rt: 2.0 }),
        makeSession({ session_number: 3, mean_rt: 5.0 }), // way above 1.5 × mean
        makeSession({ session_number: 4, mean_rt: 2.0 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.effort.highEffortSessions.length).toBeGreaterThan(0);
    });

    it('should compute overall mean RT', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1, mean_rt: 2.0 }),
        makeSession({ session_number: 2, mean_rt: 4.0 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.effort.overallMeanRT).toBeCloseTo(3.0, 2);
    });
  });

  describe('empty input', () => {
    it('should handle empty sessions', () => {
      const report = analyzePatterns([]);
      expect(report.confidenceBins).toHaveLength(0);
      expect(report.dualProcess.type1Ratio).toBe(0);
      expect(report.insight).toBe('No session data available.');
    });
  });

  describe('insight generation', () => {
    it('should generate a non-empty insight string', () => {
      const sessions: SessionData[] = [
        makeSession({ session_number: 1 }),
        makeSession({ session_number: 2 }),
      ];
      const report = analyzePatterns(sessions);
      expect(report.insight.length).toBeGreaterThan(0);
      expect(report.insight.endsWith('.')).toBe(true);
    });
  });
});
