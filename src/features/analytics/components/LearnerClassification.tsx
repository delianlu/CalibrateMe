// =============================================================================
// Learner Classification Dashboard (Task 7)
// Classifies real users and shows calibration trend from session data
// =============================================================================

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { UserCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { QuizResponse } from '../../quiz/types';
import { ANALYTICS_THRESHOLDS } from '../../../config/analyticsThresholds';
import HeuristicTooltip from '../../../components/HeuristicTooltip';
import ChartTooltip from '../../../components/ChartTooltip';

interface LearnerClassificationProps {
  responses: QuizResponse[];
  betaHat: number;
}

interface SessionBin {
  session: number;
  betaHat: number;
  accuracy: number;
  avgConfidence: number;
  count: number;
}

function classifyBias(beta: number): { label: string; color: string } {
  if (beta > ANALYTICS_THRESHOLDS.classification_overconfident) return { label: 'Overconfident', color: 'var(--color-error)' };
  if (beta < ANALYTICS_THRESHOLDS.classification_underconfident) return { label: 'Underconfident', color: 'var(--color-info, #3B82F6)' };
  return { label: 'Well-Calibrated', color: 'var(--color-success)' };
}

/**
 * Split responses into sessions (>10 min gap) and compute per-session β̂
 */
function buildSessionBins(responses: QuizResponse[]): SessionBin[] {
  if (responses.length === 0) return [];

  const sorted = [...responses].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const sessions: QuizResponse[][] = [[]];
  const GAP_MS = ANALYTICS_THRESHOLDS.session_break_minutes * 60 * 1000;

  for (const r of sorted) {
    const current = sessions[sessions.length - 1];
    if (current.length > 0) {
      const lastTs = current[current.length - 1].timestamp.getTime();
      if (r.timestamp.getTime() - lastTs > GAP_MS) {
        sessions.push([]);
      }
    }
    sessions[sessions.length - 1].push(r);
  }

  return sessions
    .filter(s => s.length >= 3) // need enough data for meaningful β̂
    .map((s, i) => {
      const accuracy = s.filter(r => r.correctness).length / s.length;
      const avgConf = s.reduce((sum, r) => sum + r.confidence / 100, 0) / s.length;
      return {
        session: i + 1,
        betaHat: +(avgConf - accuracy).toFixed(3),
        accuracy: +(accuracy * 100).toFixed(1),
        avgConfidence: +(avgConf * 100).toFixed(1),
        count: s.length,
      };
    });
}

export default function LearnerClassification({ responses, betaHat }: LearnerClassificationProps) {
  const classification = classifyBias(betaHat);
  const sessionBins = useMemo(() => buildSessionBins(responses), [responses]);

  // Trend direction
  const trend = useMemo(() => {
    if (sessionBins.length < 3) return 'stable';
    const recent = sessionBins.slice(-3);
    const early = sessionBins.slice(0, 3);
    const recentAvg = recent.reduce((s, b) => s + Math.abs(b.betaHat), 0) / recent.length;
    const earlyAvg = early.reduce((s, b) => s + Math.abs(b.betaHat), 0) / early.length;
    if (recentAvg < earlyAvg - 0.03) return 'improving';
    if (recentAvg > earlyAvg + 0.03) return 'worsening';
    return 'stable';
  }, [sessionBins]);

  const TrendIcon = trend === 'improving' ? TrendingDown : trend === 'worsening' ? TrendingUp : Minus;
  const trendColor = trend === 'improving' ? 'var(--color-success)' : trend === 'worsening' ? 'var(--color-error)' : 'var(--text-faint)';

  if (responses.length < 5) return null;

  return (
    <div className="learner-classification card">
      <h3 className="learner-classification__title">
        <UserCheck size={18} /> Your Calibration Profile
      </h3>

      <div className="learner-classification__summary">
        <div className="learner-classification__badge" style={{ borderColor: classification.color, color: classification.color }}>
          {classification.label}
          <HeuristicTooltip label={`Classification uses heuristic thresholds (β̂ > ${ANALYTICS_THRESHOLDS.classification_overconfident} = overconfident, < ${ANALYTICS_THRESHOLDS.classification_underconfident} = underconfident). These are researcher-chosen cut-offs, not ground truth.`} />
        </div>
        <div className="learner-classification__beta">
          <span className="learner-classification__beta-label">β̂ =</span>
          <span className="learner-classification__beta-value" style={{ color: classification.color }}>
            {betaHat > 0 ? '+' : ''}{betaHat.toFixed(3)}
          </span>
        </div>
        <div className="learner-classification__trend" style={{ color: trendColor }}>
          <TrendIcon size={14} />
          <span>Bias {trend === 'improving' ? 'decreasing' : trend === 'worsening' ? 'increasing' : 'stable'}</span>
        </div>
      </div>

      <p className="learner-classification__desc">
        {classification.label === 'Overconfident'
          ? 'Your confidence tends to exceed your actual accuracy. The system shortens review intervals to compensate.'
          : classification.label === 'Underconfident'
            ? 'You know more than you think! The system extends intervals since your true knowledge is higher than your ratings suggest.'
            : 'Your confidence closely matches your performance. The system schedules reviews based on your actual knowledge level.'}
      </p>

      {sessionBins.length >= 2 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '0.5rem' }}>
            Calibration Bias Over Sessions
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={sessionBins}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
              <XAxis dataKey="session" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[-0.3, 0.3]} />
              <Tooltip content={<ChartTooltip formatter={(v) => typeof v === 'number' ? v.toFixed(3) : String(v)} />} />
              <ReferenceLine y={0} stroke="var(--color-success)" strokeDasharray="4 4" />
              <ReferenceLine y={0.1} stroke="var(--color-error)" strokeDasharray="2 2" opacity={0.5} />
              <ReferenceLine y={-0.1} stroke="var(--color-info, #3B82F6)" strokeDasharray="2 2" opacity={0.5} />
              <Line
                type="monotone"
                dataKey="betaHat"
                name="β̂ (bias)"
                stroke={classification.color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
