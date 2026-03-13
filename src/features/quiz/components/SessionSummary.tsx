import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Brain, Clock, AlertTriangle, Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { QuizItem, QuizResponse } from '../types';
import HeuristicTooltip from '../../../components/HeuristicTooltip';

interface SessionSummaryProps {
  responses: QuizResponse[];
  items?: QuizItem[];
  calibrationECE: number | null;
  onClose: () => void;
}

interface StrugglingItem {
  itemId: string;
  label: string;
  confidence: number;
  wasCorrect: boolean;
}

const calibrationMessages = {
  overconfident: {
    mild: "You're slightly overconfident. Try pausing a moment before rating high confidence.",
    moderate:
      "Your confidence often exceeds your accuracy. Ask yourself: 'Do I really know this, or does it just feel familiar?'",
    severe:
      "There's a significant gap between your confidence and accuracy. Focus on testing yourself before feeling certain.",
  },
  underconfident: {
    mild: 'You know more than you think! Trust your knowledge a bit more.',
    moderate:
      "You're consistently underestimating yourself. Your accuracy is higher than your confidence suggests.",
    severe:
      "You're being too hard on yourself. Your performance shows you've learned more than you realize.",
  },
  wellCalibrated: 'Excellent calibration! Your confidence accurately reflects your knowledge.',
};

function getCalibrationFeedback(gap: number): { message: string; type: string } {
  if (gap > 20)
    return { message: calibrationMessages.overconfident.severe, type: 'overconfident' };
  if (gap > 10)
    return { message: calibrationMessages.overconfident.moderate, type: 'overconfident' };
  if (gap > 5)
    return { message: calibrationMessages.overconfident.mild, type: 'overconfident' };
  if (gap < -20)
    return { message: calibrationMessages.underconfident.severe, type: 'underconfident' };
  if (gap < -10)
    return { message: calibrationMessages.underconfident.moderate, type: 'underconfident' };
  if (gap < -5)
    return { message: calibrationMessages.underconfident.mild, type: 'underconfident' };
  return { message: calibrationMessages.wellCalibrated, type: 'well-calibrated' };
}

function getRecommendations(
  accuracy: number,
  gap: number,
  strugglingCount: number
): string[] {
  const tips: string[] = [];

  if (accuracy < 50) {
    tips.push('Focus on reviewing items you missed. Consider studying in shorter sessions.');
  } else if (accuracy < 75) {
    tips.push('Good progress! Try to identify patterns in the items you miss.');
  }

  if (gap > 15) {
    tips.push(
      'Before rating confidence, try to mentally recall the answer first.'
    );
  } else if (gap < -15) {
    tips.push(
      'When you feel unsure, give yourself credit -- your instincts are better than you think.'
    );
  }

  if (strugglingCount > 3) {
    tips.push(
      `You struggled with ${strugglingCount} items. These will be prioritized in your next session.`
    );
  }

  if (tips.length === 0) {
    tips.push('Keep it up! Consistent practice builds lasting knowledge.');
  }

  return tips;
}

function getItemLabel(itemId: string, items?: QuizItem[]): string {
  if (!items) return itemId;
  const item = items.find(i => i.id === itemId);
  if (!item) return itemId;
  // For grammar items, show the question; for vocab, show the word
  if (item.question) return item.question.slice(0, 60) + (item.question.length > 60 ? '...' : '');
  return item.word;
}

/** Classify responses as "fast + confident" (automatic) vs "slow + deliberate" */
function classifyDualProcess(responses: QuizResponse[]): { automatic: number; deliberate: number } {
  if (responses.length < 3) return { automatic: 0, deliberate: 0 };

  const rts = responses.map(r => r.responseTime);
  const meanRT = rts.reduce((a, b) => a + b, 0) / rts.length;

  let automatic = 0;
  let deliberate = 0;
  for (const r of responses) {
    if (r.correctness && r.responseTime < meanRT && r.confidence > 70) {
      automatic++;
    } else {
      deliberate++;
    }
  }
  return { automatic, deliberate };
}

export default function SessionSummary({
  responses,
  items,
  calibrationECE,
  onClose,
}: SessionSummaryProps) {
  const stats = useMemo(() => {
    const total = responses.length;
    const correct = responses.filter(r => r.correctness).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgConf =
      total > 0 ? responses.reduce((s, r) => s + r.confidence, 0) / total : 0;
    const avgRT =
      total > 0 ? responses.reduce((s, r) => s + r.responseTime, 0) / total : 0;
    const gap = avgConf - accuracy;

    const struggling: StrugglingItem[] = responses
      .filter(r => !r.correctness && r.confidence > 50)
      .map(r => ({
        itemId: r.itemId,
        label: getItemLabel(r.itemId, items),
        confidence: r.confidence,
        wasCorrect: false,
      }));

    const underconfidentHits = responses.filter(
      r => r.correctness && r.confidence < 40
    ).length;

    const calFeedback = getCalibrationFeedback(gap);
    const recommendations = getRecommendations(accuracy, gap, struggling.length);
    const dualProcess = classifyDualProcess(responses);

    return {
      total,
      correct,
      accuracy,
      avgConf,
      avgRT,
      gap,
      struggling,
      underconfidentHits,
      calFeedback,
      recommendations,
      dualProcess,
    };
  }, [responses, items]);

  const ecePct = calibrationECE !== null ? (calibrationECE * 100).toFixed(1) : null;

  return (
    <motion.div
      className="session-summary card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="session-summary__header">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
        >
          <Trophy size={36} className="session-summary__trophy" />
        </motion.div>
        <h2 className="session-summary__title">Session Complete!</h2>
      </div>

      {/* Stats grid */}
      <div className="session-summary__grid">
        <div className="session-summary__stat session-summary__stat--accent-green">
          <div className="session-summary__stat-icon">
            <Target size={18} />
          </div>
          <span className="session-summary__stat-value">
            {stats.correct}/{stats.total}
          </span>
          <span className="session-summary__stat-label">Correct</span>
        </div>
        <div className="session-summary__stat session-summary__stat--accent-blue">
          <div className="session-summary__stat-icon">
            <Trophy size={18} />
          </div>
          <span className="session-summary__stat-value">
            {stats.accuracy.toFixed(0)}%
          </span>
          <span className="session-summary__stat-label">Accuracy</span>
        </div>
        <div className="session-summary__stat session-summary__stat--accent-purple">
          <div className="session-summary__stat-icon">
            <Brain size={18} />
          </div>
          <span className="session-summary__stat-value">
            {stats.avgConf.toFixed(0)}%
          </span>
          <span className="session-summary__stat-label">Avg Confidence</span>
        </div>
        <div className="session-summary__stat session-summary__stat--accent-amber">
          <div className="session-summary__stat-icon">
            <Clock size={18} />
          </div>
          <span className="session-summary__stat-value">
            {(stats.avgRT / 1000).toFixed(1)}s
          </span>
          <span className="session-summary__stat-label">Avg Response Time</span>
        </div>
      </div>

      {/* Dual-process insight */}
      {(stats.dualProcess.automatic > 0 || stats.dualProcess.deliberate > 0) && (
        <div className="session-summary__dual-process">
          <span className="session-summary__section-title">
            <Zap size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Response Patterns <HeuristicTooltip label="Dual-process classification uses response time and confidence heuristics. 'Automatic' = fast + confident + correct. This is an approximation, not a cognitive diagnosis." />
          </span>
          <p className="heuristic-subtitle">Estimated from timing and confidence patterns</p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <strong>{stats.dualProcess.automatic}</strong> automatic (fast + confident) &middot;{' '}
            <strong>{stats.dualProcess.deliberate}</strong> deliberate (slower / less certain)
          </p>
          {stats.dualProcess.automatic > stats.dualProcess.deliberate && (
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-faint)' }}>
              Many automatized responses suggest strong familiarity. The scheduler will space these items further apart.
            </p>
          )}
        </div>
      )}

      {/* Calibration section */}
      <div
        className={`session-summary__calibration session-summary__calibration--${stats.calFeedback.type}`}
      >
        <span className="session-summary__calibration-title">
          <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Calibration
        </span>
        {ecePct !== null && (
          <span className="session-summary__calibration-ece">ECE: {ecePct}%</span>
        )}
        <p className="session-summary__calibration-msg">
          {stats.calFeedback.message}
        </p>
        {stats.underconfidentHits > 0 && (
          <p className="session-summary__calibration-detail">
            You got {stats.underconfidentHits} item(s) correct despite low confidence
            -- trust yourself more!
          </p>
        )}
      </div>

      {/* Struggling items */}
      {stats.struggling.length > 0 && (
        <div className="session-summary__struggling">
          <span className="session-summary__section-title">
            <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Needs Review
          </span>
          <p className="session-summary__struggling-desc">
            {stats.struggling.length} item(s) you rated high confidence but got wrong:
          </p>
          <div className="session-summary__struggling-list">
            {stats.struggling.slice(0, 5).map(item => (
              <span key={item.itemId} className="session-summary__struggling-item">
                {item.label} ({item.confidence}% conf)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="session-summary__recommendations">
        <span className="session-summary__section-title">
          <Lightbulb size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Recommendations
        </span>
        <ul className="session-summary__tips">
          {stats.recommendations.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>

      <motion.button
        className="btn btn-primary btn-block btn-lg"
        onClick={onClose}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Continue
        <ArrowRight size={16} style={{ marginLeft: 8 }} />
      </motion.button>
    </motion.div>
  );
}
