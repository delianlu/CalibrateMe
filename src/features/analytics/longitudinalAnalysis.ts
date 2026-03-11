// =============================================================================
// Longitudinal Analysis Module
// Detects trends, learning velocity, calibration drift across sessions
// =============================================================================

import { SessionData, SimulationResults } from '../../types';
import { mean, std } from '../../utils/statistics';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface TrendResult {
  slope: number;           // Linear regression slope per session
  direction: 'improving' | 'declining' | 'stable';
  magnitude: 'negligible' | 'small' | 'moderate' | 'large';
  pctChange: number;       // Percentage change from first to last
}

export interface LearningVelocity {
  /** Sessions until accuracy first exceeded 80% */
  sessionsTo80Accuracy: number | null;
  /** Sessions until ECE dropped below 0.10 */
  sessionsToGoodCalibration: number | null;
  /** Average K* gain per session in the learning phase */
  knowledgeGainRate: number;
  /** Phase classification */
  currentPhase: 'early-learning' | 'rapid-growth' | 'plateau' | 'mastered';
}

export interface CalibrationDrift {
  /** Moving-window β̂ trend (positive = drifting overconfident) */
  biasTrend: TrendResult;
  /** Is calibration improving, stable, or worsening? */
  calibrationTrajectory: 'improving' | 'stable' | 'worsening';
  /** Session where calibration was best */
  bestCalibrationSession: number;
  /** ECE at best session */
  bestECE: number;
}

export interface SessionQuality {
  /** Coefficient of variation of accuracy across sessions */
  accuracyConsistency: number;
  /** Sessions where accuracy dropped > 15pp from prior */
  regressionSessions: number[];
  /** Sessions where performance spiked > 15pp from prior */
  breakoutSessions: number[];
}

export interface LongitudinalReport {
  eceTrend: TrendResult;
  brierTrend: TrendResult;
  accuracyTrend: TrendResult;
  knowledgeTrend: TrendResult;
  learningVelocity: LearningVelocity;
  calibrationDrift: CalibrationDrift;
  sessionQuality: SessionQuality;
  /** One-sentence natural-language summary */
  summary: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Simple linear regression returning slope and intercept.
 * x = 0, 1, 2, ... (session index)
 */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function classifyTrend(slope: number, values: number[], higherIsBetter: boolean): TrendResult {
  const first = mean(values.slice(0, Math.max(1, Math.floor(values.length * 0.2))));
  const last = mean(values.slice(-Math.max(1, Math.floor(values.length * 0.2))));
  const pctChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  const absSlope = Math.abs(slope);
  const magnitude: TrendResult['magnitude'] =
    absSlope < 0.001 ? 'negligible' :
    absSlope < 0.005 ? 'small' :
    absSlope < 0.015 ? 'moderate' : 'large';

  let direction: TrendResult['direction'];
  if (magnitude === 'negligible') {
    direction = 'stable';
  } else if (higherIsBetter) {
    direction = slope > 0 ? 'improving' : 'declining';
  } else {
    direction = slope < 0 ? 'improving' : 'declining';
  }

  return { slope, direction, magnitude, pctChange };
}

// -----------------------------------------------------------------------------
// Analysis Functions
// -----------------------------------------------------------------------------

function analyzeLearningVelocity(sessions: SessionData[]): LearningVelocity {
  // Sessions to 80% accuracy
  const sessionsTo80 = sessions.findIndex(
    s => s.items_reviewed > 0 && (s.correct_count / s.items_reviewed) >= 0.8
  );

  // Sessions to good calibration (ECE < 0.10)
  const sessionsToGoodCal = sessions.findIndex(s => s.ece < 0.10);

  // Knowledge gain rate: average ΔK* per session during learning phase
  const kStarValues = sessions.map(s => s.mean_K_star);
  const gains: number[] = [];
  for (let i = 1; i < kStarValues.length; i++) {
    gains.push(kStarValues[i] - kStarValues[i - 1]);
  }
  const knowledgeGainRate = gains.length > 0 ? mean(gains) : 0;

  // Phase classification
  const lastKStar = kStarValues[kStarValues.length - 1] ?? 0;
  const recentGains = gains.slice(-5);
  const recentGainRate = recentGains.length > 0 ? mean(recentGains) : 0;

  let currentPhase: LearningVelocity['currentPhase'];
  if (lastKStar >= 0.9) {
    currentPhase = 'mastered';
  } else if (recentGainRate < 0.005 && sessions.length > 5) {
    currentPhase = 'plateau';
  } else if (lastKStar < 0.4) {
    currentPhase = 'early-learning';
  } else {
    currentPhase = 'rapid-growth';
  }

  return {
    sessionsTo80Accuracy: sessionsTo80 >= 0 ? sessionsTo80 + 1 : null,
    sessionsToGoodCalibration: sessionsToGoodCal >= 0 ? sessionsToGoodCal + 1 : null,
    knowledgeGainRate,
    currentPhase,
  };
}

function analyzeCalibrationDrift(sessions: SessionData[]): CalibrationDrift {
  // Use ECE trajectory as calibration proxy
  const eceValues = sessions.map(s => s.ece);
  const reg = linearRegression(eceValues);
  const biasTrend = classifyTrend(reg.slope, eceValues, false);

  // Confidence - accuracy gap per session (proxy for bias)
  const gapValues = sessions.map(s => {
    const accuracy = s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0;
    return s.mean_confidence - accuracy;
  });
  const gapReg = linearRegression(gapValues);
  const gapTrend = classifyTrend(gapReg.slope, gapValues, false);

  // Best calibration session
  let bestIdx = 0;
  let bestECE = eceValues[0] ?? 1;
  for (let i = 1; i < eceValues.length; i++) {
    if (eceValues[i] < bestECE) {
      bestECE = eceValues[i];
      bestIdx = i;
    }
  }

  const calibrationTrajectory: CalibrationDrift['calibrationTrajectory'] =
    biasTrend.direction === 'improving' ? 'improving' :
    biasTrend.direction === 'declining' ? 'worsening' : 'stable';

  return {
    biasTrend: gapTrend,
    calibrationTrajectory,
    bestCalibrationSession: bestIdx + 1,
    bestECE,
  };
}

function analyzeSessionQuality(sessions: SessionData[]): SessionQuality {
  const accuracies = sessions.map(s =>
    s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0
  );

  const m = mean(accuracies);
  const s = std(accuracies);
  const accuracyConsistency = m > 0 ? s / m : 0;

  const regressionSessions: number[] = [];
  const breakoutSessions: number[] = [];

  for (let i = 1; i < accuracies.length; i++) {
    const delta = accuracies[i] - accuracies[i - 1];
    if (delta < -0.15) regressionSessions.push(i + 1);
    if (delta > 0.15) breakoutSessions.push(i + 1);
  }

  return { accuracyConsistency, regressionSessions, breakoutSessions };
}

function generateSummary(report: Omit<LongitudinalReport, 'summary'>): string {
  const parts: string[] = [];

  // Learning progress
  if (report.learningVelocity.currentPhase === 'mastered') {
    parts.push('Knowledge has reached mastery level');
  } else if (report.knowledgeTrend.direction === 'improving') {
    parts.push(`Knowledge is ${report.knowledgeTrend.magnitude === 'large' ? 'rapidly' : 'steadily'} improving`);
  } else {
    parts.push('Knowledge growth has stalled');
  }

  // Calibration
  if (report.calibrationDrift.calibrationTrajectory === 'improving') {
    parts.push('calibration is getting better over time');
  } else if (report.calibrationDrift.calibrationTrajectory === 'worsening') {
    parts.push('but calibration accuracy is declining');
  } else {
    parts.push('with stable calibration');
  }

  // Quality
  if (report.sessionQuality.regressionSessions.length > 2) {
    parts.push(`(${report.sessionQuality.regressionSessions.length} regression sessions detected)`);
  }

  return parts.join(', ') + '.';
}

// -----------------------------------------------------------------------------
// Main Export
// -----------------------------------------------------------------------------

export function analyzeLongitudinal(results: SimulationResults): LongitudinalReport;
export function analyzeLongitudinal(sessions: SessionData[]): LongitudinalReport;
export function analyzeLongitudinal(input: SimulationResults | SessionData[]): LongitudinalReport {
  const sessions = Array.isArray(input) ? input : input.session_data;

  if (sessions.length === 0) {
    const empty: TrendResult = { slope: 0, direction: 'stable', magnitude: 'negligible', pctChange: 0 };
    return {
      eceTrend: empty,
      brierTrend: empty,
      accuracyTrend: empty,
      knowledgeTrend: empty,
      learningVelocity: { sessionsTo80Accuracy: null, sessionsToGoodCalibration: null, knowledgeGainRate: 0, currentPhase: 'early-learning' },
      calibrationDrift: { biasTrend: empty, calibrationTrajectory: 'stable', bestCalibrationSession: 0, bestECE: 1 },
      sessionQuality: { accuracyConsistency: 0, regressionSessions: [], breakoutSessions: [] },
      summary: 'No session data available.',
    };
  }

  const eceValues = sessions.map(s => s.ece);
  const brierValues = sessions.map(s => s.brier);
  const accuracyValues = sessions.map(s =>
    s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0
  );
  const kStarValues = sessions.map(s => s.mean_K_star);

  const eceTrend = classifyTrend(linearRegression(eceValues).slope, eceValues, false);
  const brierTrend = classifyTrend(linearRegression(brierValues).slope, brierValues, false);
  const accuracyTrend = classifyTrend(linearRegression(accuracyValues).slope, accuracyValues, true);
  const knowledgeTrend = classifyTrend(linearRegression(kStarValues).slope, kStarValues, true);

  const learningVelocity = analyzeLearningVelocity(sessions);
  const calibrationDrift = analyzeCalibrationDrift(sessions);
  const sessionQuality = analyzeSessionQuality(sessions);

  const partial = {
    eceTrend,
    brierTrend,
    accuracyTrend,
    knowledgeTrend,
    learningVelocity,
    calibrationDrift,
    sessionQuality,
  };

  return { ...partial, summary: generateSummary(partial) };
}
