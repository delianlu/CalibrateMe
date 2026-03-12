import { analyzeLearnerInsights, LearnerInsightsReport } from '../src/features/analytics/learnerInsights';
import { SessionData, SimulationResults, LearnerProfileParams, AbilityLevel, CalibrationType, SchedulerType } from '../src/types';

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

function makeResults(sessions: SessionData[], overrides?: Partial<SimulationResults>): SimulationResults {
  return {
    profile_id: 'test',
    scheduler_type: SchedulerType.CALIBRATEME,
    config: {} as any,
    retention_1day: 0.85,
    retention_7day: 0.75,
    retention_30day: 0.60,
    time_to_mastery: 10,
    review_efficiency: 3.5,
    K_star_trajectory: sessions.map(s => s.mean_K_star),
    K_hat_trajectory: sessions.map(s => s.mean_K_hat),
    ece_trajectory: sessions.map(s => s.ece),
    brier_trajectory: sessions.map(s => s.brier),
    session_data: sessions,
    ...overrides,
  };
}

describe('Learner Insights', () => {
  describe('parameter interpretation', () => {
    it('should classify alpha >= 0.25 as fast learner', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.30,
        lambda: 0.10,
        beta_star: 0.0,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const alphaParam = report.parameters.find(p => p.parameter.includes('α'));
      expect(alphaParam).toBeDefined();
      expect(alphaParam!.label).toBe('Fast learner');
      expect(alphaParam!.rating).toBe('high');
    });

    it('should classify lambda <= 0.07 as strong retention', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20,
        lambda: 0.05,
        beta_star: 0.0,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const lambdaParam = report.parameters.find(p => p.parameter.includes('λ'));
      expect(lambdaParam).toBeDefined();
      expect(lambdaParam!.label).toBe('Strong retention');
    });

    it('should classify beta_star > 0.1 as overconfident', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.OVERCONFIDENT,
        alpha: 0.20,
        lambda: 0.10,
        beta_star: 0.25,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const betaParam = report.parameters.find(p => p.parameter.includes('β'));
      expect(betaParam).toBeDefined();
      expect(betaParam!.label).toBe('Overconfident');
    });

    it('should classify beta_star < -0.1 as underconfident', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.UNDERCONFIDENT,
        alpha: 0.20,
        lambda: 0.10,
        beta_star: -0.20,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const betaParam = report.parameters.find(p => p.parameter.includes('β'));
      expect(betaParam!.label).toBe('Underconfident');
    });

    it('should classify |beta_star| <= 0.08 as well-calibrated', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20,
        lambda: 0.10,
        beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const betaParam = report.parameters.find(p => p.parameter.includes('β'));
      expect(betaParam!.label).toBe('Well-calibrated');
    });
  });

  describe('archetype classification', () => {
    it('should classify Calibrated Expert when mastered and well-calibrated', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20,
        lambda: 0.08,
        beta_star: 0.05,
      };
      const sessions = Array.from({ length: 10 }, (_, i) =>
        makeSession({ session_number: i + 1, mean_K_star: 0.95 })
      );
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Calibrated Expert');
    });

    it('should classify Confident Expert when mastered but overconfident', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.OVERCONFIDENT,
        alpha: 0.20,
        lambda: 0.08,
        beta_star: 0.25,
      };
      const sessions = Array.from({ length: 10 }, (_, i) =>
        makeSession({ session_number: i + 1, mean_K_star: 0.95 })
      );
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Confident Expert');
    });

    it('should classify Fast but Overconfident when fast and overconfident', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.OVERCONFIDENT,
        alpha: 0.30,
        lambda: 0.08,
        beta_star: 0.25,
      };
      const sessions = [makeSession({ session_number: 1, mean_K_star: 0.6 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Fast but Overconfident');
    });

    it('should classify Capable but Self-Doubting when fast and underconfident', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.UNDERCONFIDENT,
        alpha: 0.30,
        lambda: 0.08,
        beta_star: -0.20,
      };
      const sessions = [makeSession({ session_number: 1, mean_K_star: 0.6 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Capable but Self-Doubting');
    });

    it('should classify Optimistic Learner when overconfident but not fast', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.OVERCONFIDENT,
        alpha: 0.15,
        lambda: 0.08,
        beta_star: 0.25,
      };
      const sessions = [makeSession({ session_number: 1, mean_K_star: 0.5 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Optimistic Learner');
    });

    it('should classify Cautious Learner when underconfident but not fast', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.UNDERCONFIDENT,
        alpha: 0.15,
        lambda: 0.08,
        beta_star: -0.20,
      };
      const sessions = [makeSession({ session_number: 1, mean_K_star: 0.5 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Cautious Learner');
    });

    it('should classify High-Decay Learner when lambda > 0.12', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.15,
        lambda: 0.15,
        beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1, mean_K_star: 0.5 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('High-Decay Learner');
    });

    it('should classify Steady Learner as default', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20,
        lambda: 0.10,
        beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1, mean_K_star: 0.5 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.archetype).toBe('Steady Learner');
    });
  });

  describe('strength/weakness detection', () => {
    it('should detect accuracy as strength when >= 80%', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.10, beta_star: 0.05,
      };
      const sessions = [
        makeSession({ session_number: 1, correct_count: 9, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 8, items_reviewed: 10 }),
      ];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const accStrength = report.strengths.find(s => s.area === 'Accuracy');
      expect(accStrength).toBeDefined();
    });

    it('should detect accuracy as weakness when < 50%', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.LOW,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.10, lambda: 0.10, beta_star: 0.0,
      };
      const sessions = [
        makeSession({ session_number: 1, correct_count: 3, items_reviewed: 10 }),
        makeSession({ session_number: 2, correct_count: 4, items_reviewed: 10 }),
      ];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const accWeakness = report.weaknesses.find(w => w.area === 'Accuracy');
      expect(accWeakness).toBeDefined();
    });

    it('should detect calibration as strength when ECE < 0.08', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.10, beta_star: 0.05,
      };
      const sessions = [
        makeSession({ session_number: 1, ece: 0.06 }),
        makeSession({ session_number: 2, ece: 0.05 }),
      ];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const calStrength = report.strengths.find(s => s.area === 'Calibration');
      expect(calStrength).toBeDefined();
    });

    it('should detect calibration as weakness when ECE > 0.20', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.OVERCONFIDENT,
        alpha: 0.20, lambda: 0.10, beta_star: 0.25,
      };
      const sessions = [
        makeSession({ session_number: 1, ece: 0.25 }),
        makeSession({ session_number: 2, ece: 0.22 }),
      ];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const calWeakness = report.weaknesses.find(w => w.area === 'Calibration');
      expect(calWeakness).toBeDefined();
      expect(calWeakness!.recommendation).toBeDefined();
    });

    it('should detect knowledge mastery as strength when K* >= 0.9', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.HIGH,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.08, beta_star: 0.05,
      };
      const sessions = [
        makeSession({ session_number: 1, mean_K_star: 0.92 }),
      ];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const knowStrength = report.strengths.find(s => s.area === 'Knowledge');
      expect(knowStrength).toBeDefined();
    });

    it('should detect retention weakness when lambda > 0.12', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.15, beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const retWeakness = report.weaknesses.find(w => w.area === 'Retention');
      expect(retWeakness).toBeDefined();
    });

    it('should detect retention strength when lambda < 0.07', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.05, beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      const retStrength = report.strengths.find(s => s.area === 'Retention');
      expect(retStrength).toBeDefined();
    });
  });

  describe('recommendations', () => {
    it('should always produce at least one recommendation', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.10, beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
    });

    it('should include weakness recommendations in the list', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.LOW,
        calibration: CalibrationType.OVERCONFIDENT,
        alpha: 0.10, lambda: 0.15, beta_star: 0.25,
      };
      const sessions = [
        makeSession({ session_number: 1, correct_count: 3, items_reviewed: 10, ece: 0.25 }),
        makeSession({ session_number: 2, correct_count: 4, items_reviewed: 10, ece: 0.22 }),
      ];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      // Should have recommendations from detected weaknesses
      expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('scheduler comparison', () => {
    it('should compute comparisons when baseline provided', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.10, beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const cmResults = makeResults(sessions, { retention_7day: 0.80 });
      const baseResults = makeResults(sessions, {
        retention_7day: 0.70,
        scheduler_type: SchedulerType.SM2,
      });
      const report = analyzeLearnerInsights(cmResults, params, baseResults);
      expect(report.comparisons.length).toBeGreaterThan(0);
      const ret7 = report.comparisons.find(c => c.metric === '7-Day Retention');
      expect(ret7).toBeDefined();
      expect(ret7!.improvement).toBeGreaterThan(0);
    });

    it('should return empty comparisons when no baseline', () => {
      const params: LearnerProfileParams = {
        ability: AbilityLevel.MEDIUM,
        calibration: CalibrationType.WELL_CALIBRATED,
        alpha: 0.20, lambda: 0.10, beta_star: 0.05,
      };
      const sessions = [makeSession({ session_number: 1 })];
      const report = analyzeLearnerInsights(makeResults(sessions), params);
      expect(report.comparisons).toHaveLength(0);
    });
  });
});
