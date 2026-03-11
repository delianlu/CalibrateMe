// =============================================================================
// Pattern Analysis Module
// Analyzes error patterns by confidence bin, response-type breakdowns,
// and session-level response distributions
// =============================================================================

import { SessionData } from '../../types';
import { mean } from '../../utils/statistics';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ConfidenceBinPattern {
  /** Lower bound of the confidence range */
  binStart: number;
  /** Upper bound of the confidence range */
  binEnd: number;
  /** Label like "0–10%" */
  label: string;
  /** Total responses in this bin */
  count: number;
  /** Proportion correct */
  accuracy: number;
  /** Mean response time (seconds) */
  meanRT: number;
  /** Proportion of Type 1 (automatic) responses */
  type1Ratio: number;
  /** Gap: accuracy - midpoint confidence (positive = underconfident) */
  calibrationGap: number;
}

export interface DualProcessBreakdown {
  /** Fraction of all responses classified as Type 1 */
  type1Ratio: number;
  /** Trend of type1Ratio over sessions */
  type1Trend: 'increasing' | 'decreasing' | 'stable';
  /** Sessions where Type 1 responses first exceeded 50% */
  automatizationSession: number | null;
}

export interface EffortAnalysis {
  /** Mean response time across all sessions */
  overallMeanRT: number;
  /** RT trend direction */
  rtTrend: 'speeding-up' | 'slowing-down' | 'stable';
  /** Sessions with notably high RT (> 1.5× mean) */
  highEffortSessions: number[];
}

export interface PatternReport {
  confidenceBins: ConfidenceBinPattern[];
  dualProcess: DualProcessBreakdown;
  effort: EffortAnalysis;
  /** Key insight sentence */
  insight: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

// -----------------------------------------------------------------------------
// Analysis
// -----------------------------------------------------------------------------

/**
 * Build confidence-bin patterns from session-level data.
 * Since we only have session aggregates (not per-response data),
 * we approximate bins using session-level mean confidence and accuracy.
 */
function buildConfidenceBinPatterns(sessions: SessionData[]): ConfidenceBinPattern[] {
  const NUM_BINS = 5;
  const binWidth = 1 / NUM_BINS;
  const bins: ConfidenceBinPattern[] = [];

  for (let b = 0; b < NUM_BINS; b++) {
    const binStart = b * binWidth;
    const binEnd = (b + 1) * binWidth;
    const midpoint = (binStart + binEnd) / 2;
    const label = `${Math.round(binStart * 100)}–${Math.round(binEnd * 100)}%`;

    // Assign sessions to bins by their mean confidence
    const inBin = sessions.filter(
      s => s.mean_confidence >= binStart && s.mean_confidence < binEnd
    );

    if (inBin.length === 0) {
      bins.push({
        binStart, binEnd, label,
        count: 0, accuracy: 0, meanRT: 0, type1Ratio: 0, calibrationGap: 0,
      });
      continue;
    }

    const totalItems = inBin.reduce((s, sess) => s + sess.items_reviewed, 0);
    const totalCorrect = inBin.reduce((s, sess) => s + sess.correct_count, 0);
    const accuracy = totalItems > 0 ? totalCorrect / totalItems : 0;
    const meanRT = mean(inBin.map(s => s.mean_rt));
    const totalType1 = inBin.reduce((s, sess) => s + sess.type1_count, 0);
    const totalResponses = inBin.reduce((s, sess) => s + sess.type1_count + sess.type2_count, 0);
    const type1Ratio = totalResponses > 0 ? totalType1 / totalResponses : 0;

    bins.push({
      binStart, binEnd, label,
      count: totalItems,
      accuracy,
      meanRT,
      type1Ratio,
      calibrationGap: accuracy - midpoint,
    });
  }

  return bins;
}

function analyzeDualProcess(sessions: SessionData[]): DualProcessBreakdown {
  const ratios = sessions.map(s => {
    const total = s.type1_count + s.type2_count;
    return total > 0 ? s.type1_count / total : 0;
  });

  const overallType1 = sessions.reduce((s, sess) => s + sess.type1_count, 0);
  const overallTotal = sessions.reduce((s, sess) => s + sess.type1_count + sess.type2_count, 0);
  const type1Ratio = overallTotal > 0 ? overallType1 / overallTotal : 0;

  const slope = linearSlope(ratios);
  const type1Trend: DualProcessBreakdown['type1Trend'] =
    slope > 0.005 ? 'increasing' :
    slope < -0.005 ? 'decreasing' : 'stable';

  const automatizationSession = ratios.findIndex(r => r > 0.5);

  return {
    type1Ratio,
    type1Trend,
    automatizationSession: automatizationSession >= 0 ? automatizationSession + 1 : null,
  };
}

function analyzeEffort(sessions: SessionData[]): EffortAnalysis {
  const rts = sessions.map(s => s.mean_rt);
  const overallMeanRT = mean(rts);
  const slope = linearSlope(rts);

  const rtTrend: EffortAnalysis['rtTrend'] =
    slope < -0.02 ? 'speeding-up' :
    slope > 0.02 ? 'slowing-down' : 'stable';

  const threshold = overallMeanRT * 1.5;
  const highEffortSessions = sessions
    .filter(s => s.mean_rt > threshold)
    .map(s => s.session_number + 1);

  return { overallMeanRT, rtTrend, highEffortSessions };
}

function generateInsight(report: Omit<PatternReport, 'insight'>): string {
  const parts: string[] = [];

  // Dual-process insight
  if (report.dualProcess.type1Ratio > 0.5) {
    parts.push(`${(report.dualProcess.type1Ratio * 100).toFixed(0)}% of responses are automatic (Type 1)`);
  } else {
    parts.push('Most responses are deliberate (Type 2)');
  }

  if (report.dualProcess.type1Trend === 'increasing') {
    parts.push('with automaticity increasing over time');
  }

  // Effort
  if (report.effort.rtTrend === 'speeding-up') {
    parts.push('response times are decreasing');
  } else if (report.effort.highEffortSessions.length > 3) {
    parts.push(`with ${report.effort.highEffortSessions.length} high-effort sessions`);
  }

  return parts.join(', ') + '.';
}

// -----------------------------------------------------------------------------
// Main Export
// -----------------------------------------------------------------------------

export function analyzePatterns(sessions: SessionData[]): PatternReport {
  if (sessions.length === 0) {
    return {
      confidenceBins: [],
      dualProcess: { type1Ratio: 0, type1Trend: 'stable', automatizationSession: null },
      effort: { overallMeanRT: 0, rtTrend: 'stable', highEffortSessions: [] },
      insight: 'No session data available.',
    };
  }

  const confidenceBins = buildConfidenceBinPatterns(sessions);
  const dualProcess = analyzeDualProcess(sessions);
  const effort = analyzeEffort(sessions);

  const partial = { confidenceBins, dualProcess, effort };
  return { ...partial, insight: generateInsight(partial) };
}
