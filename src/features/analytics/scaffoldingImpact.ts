// =============================================================================
// Scaffolding Impact Tracker
// Measures the effectiveness of SRL scaffolding interventions
// =============================================================================

import { SessionData } from '../../types';
import { mean } from '../../utils/statistics';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ScaffoldingEffectiveness {
  /** Total scaffolds delivered across all sessions */
  totalScaffolds: number;
  /** Sessions that had at least one scaffold */
  sessionsWithScaffolds: number;
  /** Rate of scaffold delivery (scaffolds per session) */
  scaffoldRate: number;
  /** Did sessions with scaffolds show better subsequent accuracy? */
  postScaffoldImprovement: number | null;
  /** ECE change from pre-scaffold to post-scaffold windows */
  eceImpact: number | null;
  /** Is scaffold frequency decreasing over time? (good sign) */
  scaffoldTrend: 'decreasing' | 'increasing' | 'stable';
  /** Estimated calibration bias reduction attributable to scaffolding */
  biasReduction: number | null;
}

export interface ScaffoldingPhase {
  label: string;
  sessions: string;
  scaffoldsPerSession: number;
  meanECE: number;
  meanAccuracy: number;
}

export interface ScaffoldingReport {
  effectiveness: ScaffoldingEffectiveness;
  phases: ScaffoldingPhase[];
  summary: string;
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

function analyzeEffectiveness(sessions: SessionData[]): ScaffoldingEffectiveness {
  const totalScaffolds = sessions.reduce((s, sess) => s + sess.scaffolds_delivered, 0);
  const sessionsWithScaffolds = sessions.filter(s => s.scaffolds_delivered > 0).length;
  const scaffoldRate = sessions.length > 0 ? totalScaffolds / sessions.length : 0;

  // Scaffold trend over time
  const scaffoldCounts = sessions.map(s => s.scaffolds_delivered);
  const slope = linearSlope(scaffoldCounts);
  const scaffoldTrend: ScaffoldingEffectiveness['scaffoldTrend'] =
    slope < -0.05 ? 'decreasing' :
    slope > 0.05 ? 'increasing' : 'stable';

  // Post-scaffold improvement: compare accuracy after scaffold sessions vs before
  let postScaffoldImprovement: number | null = null;
  let eceImpact: number | null = null;

  if (sessionsWithScaffolds >= 2 && sessions.length >= 4) {
    const scaffoldSessionIndices = sessions
      .map((s, i) => s.scaffolds_delivered > 0 ? i : -1)
      .filter(i => i >= 0);

    // Compare the session AFTER a scaffold session to the scaffold session itself
    const preAccuracies: number[] = [];
    const postAccuracies: number[] = [];
    const preECEs: number[] = [];
    const postECEs: number[] = [];

    for (const idx of scaffoldSessionIndices) {
      if (idx + 1 < sessions.length) {
        const pre = sessions[idx];
        const post = sessions[idx + 1];
        const preAcc = pre.items_reviewed > 0 ? pre.correct_count / pre.items_reviewed : 0;
        const postAcc = post.items_reviewed > 0 ? post.correct_count / post.items_reviewed : 0;
        preAccuracies.push(preAcc);
        postAccuracies.push(postAcc);
        preECEs.push(pre.ece);
        postECEs.push(post.ece);
      }
    }

    if (preAccuracies.length > 0) {
      postScaffoldImprovement = mean(postAccuracies) - mean(preAccuracies);
      eceImpact = mean(postECEs) - mean(preECEs);
    }
  }

  // Bias reduction: compare first-third confidence-accuracy gap to last-third
  let biasReduction: number | null = null;
  if (sessions.length >= 6 && totalScaffolds > 0) {
    const third = Math.floor(sessions.length / 3);
    const firstThird = sessions.slice(0, third);
    const lastThird = sessions.slice(-third);

    const gapFirst = mean(firstThird.map(s => {
      const acc = s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0;
      return Math.abs(s.mean_confidence - acc);
    }));
    const gapLast = mean(lastThird.map(s => {
      const acc = s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0;
      return Math.abs(s.mean_confidence - acc);
    }));

    biasReduction = gapFirst - gapLast;
  }

  return {
    totalScaffolds,
    sessionsWithScaffolds,
    scaffoldRate,
    postScaffoldImprovement,
    eceImpact,
    scaffoldTrend,
    biasReduction,
  };
}

function buildPhases(sessions: SessionData[]): ScaffoldingPhase[] {
  if (sessions.length < 3) return [];

  const third = Math.max(1, Math.floor(sessions.length / 3));
  const slices = [
    { label: 'Early', data: sessions.slice(0, third) },
    { label: 'Middle', data: sessions.slice(third, third * 2) },
    { label: 'Late', data: sessions.slice(third * 2) },
  ];

  return slices.map(({ label, data }) => {
    const totalScaffolds = data.reduce((s, sess) => s + sess.scaffolds_delivered, 0);
    return {
      label,
      sessions: `${data[0].session_number + 1}–${data[data.length - 1].session_number + 1}`,
      scaffoldsPerSession: data.length > 0 ? totalScaffolds / data.length : 0,
      meanECE: mean(data.map(s => s.ece)),
      meanAccuracy: mean(data.map(s =>
        s.items_reviewed > 0 ? s.correct_count / s.items_reviewed : 0
      )),
    };
  });
}

function generateSummary(eff: ScaffoldingEffectiveness, _phases: ScaffoldingPhase[]): string {
  if (eff.totalScaffolds === 0) {
    return 'No scaffolding prompts were delivered during this simulation.';
  }

  const parts: string[] = [];
  parts.push(`${eff.totalScaffolds} scaffolds delivered across ${eff.sessionsWithScaffolds} sessions`);

  if (eff.scaffoldTrend === 'decreasing') {
    parts.push('scaffold frequency decreased over time (indicating improving calibration)');
  } else if (eff.scaffoldTrend === 'increasing') {
    parts.push('scaffold frequency increased (learner may need different intervention strategies)');
  }

  if (eff.postScaffoldImprovement !== null && eff.postScaffoldImprovement > 0) {
    parts.push(`accuracy improved by ${(eff.postScaffoldImprovement * 100).toFixed(1)}pp after scaffold sessions`);
  }

  if (eff.biasReduction !== null && eff.biasReduction > 0.02) {
    parts.push(`calibration bias reduced by ${(eff.biasReduction * 100).toFixed(1)}pp from early to late sessions`);
  }

  return parts.join('; ') + '.';
}

// -----------------------------------------------------------------------------
// Main Export
// -----------------------------------------------------------------------------

export function analyzeScaffoldingImpact(sessions: SessionData[]): ScaffoldingReport {
  if (sessions.length === 0) {
    return {
      effectiveness: {
        totalScaffolds: 0, sessionsWithScaffolds: 0, scaffoldRate: 0,
        postScaffoldImprovement: null, eceImpact: null, scaffoldTrend: 'stable',
        biasReduction: null,
      },
      phases: [],
      summary: 'No session data available.',
    };
  }

  const effectiveness = analyzeEffectiveness(sessions);
  const phases = buildPhases(sessions);
  const summary = generateSummary(effectiveness, phases);

  return { effectiveness, phases, summary };
}
