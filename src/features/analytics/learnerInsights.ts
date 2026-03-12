// =============================================================================
// Learner Profile Insights Module
// Interprets estimated parameters, identifies strengths/weaknesses,
// and generates personalized recommendations
// =============================================================================

import { SimulationResults, SessionData, LearnerProfileParams } from '../../types';
import { mean } from '../../utils/statistics';
import { ANALYTICS_THRESHOLDS, AnalyticsThresholds } from '../../config/analyticsThresholds';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ParameterInterpretation {
  parameter: string;
  value: number;
  label: string;
  /** Human-readable interpretation */
  interpretation: string;
  /** Percentile-like rating: 'low' | 'average' | 'high' */
  rating: 'low' | 'average' | 'high';
}

export interface StrengthWeakness {
  area: string;
  type: 'strength' | 'weakness';
  evidence: string;
  recommendation?: string;
}

export interface ComparisonInsight {
  metric: string;
  calibrateMeValue: number;
  baselineValue: number;
  improvement: number;
  /** Percentage improvement */
  improvementPct: number;
  label: string;
}

export interface LearnerInsightsReport {
  parameters: ParameterInterpretation[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  recommendations: string[];
  /** Optional scheduler comparison insights */
  comparisons: ComparisonInsight[];
  /** Overall learner archetype label */
  archetype: string;
}

// -----------------------------------------------------------------------------
// Parameter Interpretation
// -----------------------------------------------------------------------------

function interpretParams(params: LearnerProfileParams, t: AnalyticsThresholds): ParameterInterpretation[] {
  const interpretations: ParameterInterpretation[] = [];

  // Learning rate (alpha)
  const alphaRating = params.alpha >= t.alpha_high ? 'high' : params.alpha >= t.alpha_low ? 'average' : 'low';
  interpretations.push({
    parameter: 'α (learning rate)',
    value: params.alpha,
    label: alphaRating === 'high' ? 'Fast learner' : alphaRating === 'average' ? 'Moderate learner' : 'Gradual learner',
    interpretation: alphaRating === 'high'
      ? 'Absorbs new material quickly — fewer repetitions needed.'
      : alphaRating === 'average'
        ? 'Learns at a steady pace with regular practice.'
        : 'Benefits from more repetitions and spaced practice.',
    rating: alphaRating,
  });

  // Forgetting rate (lambda)
  const lambdaRating = params.lambda <= t.lambda_low ? 'low' : params.lambda <= t.lambda_high ? 'average' : 'high';
  interpretations.push({
    parameter: 'λ (forgetting rate)',
    value: params.lambda,
    label: lambdaRating === 'low' ? 'Strong retention' : lambdaRating === 'average' ? 'Typical retention' : 'Rapid forgetting',
    interpretation: lambdaRating === 'low'
      ? 'Retains information well; longer intervals are safe.'
      : lambdaRating === 'average'
        ? 'Standard forgetting curve — regular review keeps knowledge fresh.'
        : 'Knowledge decays quickly; more frequent reviews are essential.',
    rating: lambdaRating === 'high' ? 'low' : lambdaRating === 'low' ? 'high' : 'average',
  });

  // Calibration bias (beta_star)
  const absBeta = Math.abs(params.beta_star);
  const betaLabel = params.beta_star > t.classification_overconfident ? 'Overconfident' : params.beta_star < t.classification_underconfident ? 'Underconfident' : 'Well-calibrated';
  const betaRating = absBeta <= t.beta_well_calibrated ? 'high' : absBeta <= t.beta_severe ? 'average' : 'low';
  interpretations.push({
    parameter: 'β* (calibration bias)',
    value: params.beta_star,
    label: betaLabel,
    interpretation: params.beta_star > t.classification_overconfident
      ? 'Tends to overestimate knowledge — confidence exceeds actual accuracy.'
      : params.beta_star < t.classification_underconfident
        ? 'Tends to underestimate knowledge — knows more than they think.'
        : 'Confidence ratings closely match true knowledge level.',
    rating: betaRating,
  });

  return interpretations;
}

// -----------------------------------------------------------------------------
// Strength / Weakness Detection
// -----------------------------------------------------------------------------

function detectStrengthsWeaknesses(
  sessions: SessionData[],
  params: LearnerProfileParams,
  t: AnalyticsThresholds
): { strengths: StrengthWeakness[]; weaknesses: StrengthWeakness[] } {
  const strengths: StrengthWeakness[] = [];
  const weaknesses: StrengthWeakness[] = [];

  if (sessions.length === 0) return { strengths, weaknesses };

  const accuracies = sessions.map(s =>
    s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0
  );
  const overallAccuracy = mean(accuracies);
  const eceValues = sessions.map(s => s.ece);
  const finalECE = eceValues[eceValues.length - 1] ?? 0;
  const finalKStar = sessions[sessions.length - 1]?.mean_K_star ?? 0;

  // Accuracy
  if (overallAccuracy >= 0.8) {
    strengths.push({
      area: 'Accuracy',
      type: 'strength',
      evidence: `${(overallAccuracy * 100).toFixed(0)}% overall accuracy across ${sessions.length} sessions.`,
    });
  } else if (overallAccuracy < 0.5) {
    weaknesses.push({
      area: 'Accuracy',
      type: 'weakness',
      evidence: `Only ${(overallAccuracy * 100).toFixed(0)}% accuracy — many items are not yet learned.`,
      recommendation: 'Focus on fewer items per session for deeper processing.',
    });
  }

  // Calibration
  if (finalECE < t.beta_well_calibrated) {
    strengths.push({
      area: 'Calibration',
      type: 'strength',
      evidence: `Final ECE of ${(finalECE * 100).toFixed(1)}% — excellent self-awareness.`,
    });
  } else if (finalECE > 0.20) {
    weaknesses.push({
      area: 'Calibration',
      type: 'weakness',
      evidence: `Final ECE of ${(finalECE * 100).toFixed(1)}% — large gap between confidence and performance.`,
      recommendation: params.beta_star > 0
        ? 'Practice recalling answers before assigning confidence. Ask: "Can I explain this from memory?"'
        : 'Trust your knowledge more — your accuracy is better than your confidence suggests.',
    });
  }

  // Knowledge mastery
  if (finalKStar >= t.phase_mastered_k_star) {
    strengths.push({
      area: 'Knowledge',
      type: 'strength',
      evidence: `Reached mastery level (K* = ${finalKStar.toFixed(2)}).`,
    });
  } else if (finalKStar < 0.5 && sessions.length >= 10) {
    weaknesses.push({
      area: 'Knowledge Growth',
      type: 'weakness',
      evidence: `K* still at ${finalKStar.toFixed(2)} after ${sessions.length} sessions.`,
      recommendation: 'Consider easier material first to build foundational knowledge.',
    });
  }

  // Automaticity
  const totalType1 = sessions.reduce((s, sess) => s + sess.type1_count, 0);
  const totalResponses = sessions.reduce((s, sess) => s + sess.type1_count + sess.type2_count, 0);
  const type1Ratio = totalResponses > 0 ? totalType1 / totalResponses : 0;
  if (type1Ratio > 0.6) {
    strengths.push({
      area: 'Automaticity',
      type: 'strength',
      evidence: `${(type1Ratio * 100).toFixed(0)}% automatic responses — knowledge is well-embedded.`,
    });
  }

  // Retention
  if (params.lambda > t.lambda_high) {
    weaknesses.push({
      area: 'Retention',
      type: 'weakness',
      evidence: `High forgetting rate (λ > ${t.lambda_high}) means knowledge decays quickly.`,
      recommendation: 'Use more frequent, shorter review sessions. Interleave difficult items.',
    });
  } else if (params.lambda < t.lambda_low) {
    strengths.push({
      area: 'Retention',
      type: 'strength',
      evidence: 'Low forgetting rate — information sticks well between sessions.',
    });
  }

  return { strengths, weaknesses };
}

// -----------------------------------------------------------------------------
// Recommendations
// -----------------------------------------------------------------------------

function generateRecommendations(
  sessions: SessionData[],
  _params: LearnerProfileParams,
  _strengths: StrengthWeakness[],
  weaknesses: StrengthWeakness[]
): string[] {
  const recs: string[] = [];

  // From weaknesses with recommendations
  for (const w of weaknesses) {
    if (w.recommendation) recs.push(w.recommendation);
  }

  // Additional data-driven recommendations
  if (sessions.length >= 5) {
    const recentAccuracies = sessions.slice(-5).map(s =>
      s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0
    );
    const recentMean = mean(recentAccuracies);

    if (recentMean > 0.9 && weaknesses.length === 0) {
      recs.push('Performance is excellent. Consider increasing difficulty or adding new material.');
    }

    // Check for scaffolding engagement
    const totalScaffolds = sessions.reduce((s, sess) => s + sess.scaffolds_delivered, 0);
    if (totalScaffolds > sessions.length * 2) {
      recs.push('Scaffolding prompts are firing frequently — take time to reflect on each one rather than dismissing them.');
    }
  }

  if (recs.length === 0) {
    recs.push('Continue current study patterns — steady improvement detected.');
  }

  return recs;
}

// -----------------------------------------------------------------------------
// Archetype Classification
// -----------------------------------------------------------------------------

function classifyArchetype(
  params: LearnerProfileParams,
  sessions: SessionData[],
  t: AnalyticsThresholds
): string {
  const finalKStar = sessions.length > 0 ? sessions[sessions.length - 1].mean_K_star : 0;
  const isFast = params.alpha >= t.alpha_high;
  const isOverconf = params.beta_star > t.classification_overconfident;
  const isUnderconf = params.beta_star < t.classification_underconfident;
  const hasMastered = finalKStar >= t.phase_mastered_k_star;

  if (hasMastered && !isOverconf && !isUnderconf) return 'Calibrated Expert';
  if (hasMastered && isOverconf) return 'Confident Expert';
  if (isFast && isOverconf) return 'Fast but Overconfident';
  if (isFast && isUnderconf) return 'Capable but Self-Doubting';
  if (isFast) return 'Quick Learner';
  if (isOverconf) return 'Optimistic Learner';
  if (isUnderconf) return 'Cautious Learner';
  if (params.lambda > t.lambda_high) return 'High-Decay Learner';
  return 'Steady Learner';
}

// -----------------------------------------------------------------------------
// Comparison Insights
// -----------------------------------------------------------------------------

function compareSchedulers(
  calibrateMeResults: SimulationResults,
  baselineResults?: SimulationResults
): ComparisonInsight[] {
  if (!baselineResults) return [];

  const comparisons: ComparisonInsight[] = [];
  const metrics: { key: keyof SimulationResults; label: string; higherIsBetter: boolean }[] = [
    { key: 'retention_1day', label: '1-Day Retention', higherIsBetter: true },
    { key: 'retention_7day', label: '7-Day Retention', higherIsBetter: true },
    { key: 'retention_30day', label: '30-Day Retention', higherIsBetter: true },
    { key: 'time_to_mastery', label: 'Time to Mastery', higherIsBetter: false },
    { key: 'review_efficiency', label: 'Review Efficiency', higherIsBetter: false },
  ];

  for (const { key, label, higherIsBetter } of metrics) {
    const cmVal = calibrateMeResults[key] as number;
    const blVal = baselineResults[key] as number;
    const diff = cmVal - blVal;
    const pct = blVal !== 0 ? (diff / Math.abs(blVal)) * 100 : 0;

    comparisons.push({
      metric: label,
      calibrateMeValue: cmVal,
      baselineValue: blVal,
      improvement: higherIsBetter ? diff : -diff,
      improvementPct: higherIsBetter ? pct : -pct,
      label: `${label}: ${higherIsBetter ? (diff > 0 ? '+' : '') : (diff < 0 ? '+' : '-')}${Math.abs(pct).toFixed(1)}%`,
    });
  }

  return comparisons;
}

// -----------------------------------------------------------------------------
// Main Export
// -----------------------------------------------------------------------------

export function analyzeLearnerInsights(
  results: SimulationResults,
  params: LearnerProfileParams,
  baselineResults?: SimulationResults,
  thresholds?: Partial<AnalyticsThresholds>
): LearnerInsightsReport {
  const t: AnalyticsThresholds = { ...ANALYTICS_THRESHOLDS, ...thresholds };
  const sessions = results.session_data;
  const parameters = interpretParams(params, t);
  const { strengths, weaknesses } = detectStrengthsWeaknesses(sessions, params, t);
  const recommendations = generateRecommendations(sessions, params, strengths, weaknesses);
  const comparisons = compareSchedulers(results, baselineResults);
  const archetype = classifyArchetype(params, sessions, t);

  return {
    parameters,
    strengths,
    weaknesses,
    recommendations,
    comparisons,
    archetype,
  };
}
