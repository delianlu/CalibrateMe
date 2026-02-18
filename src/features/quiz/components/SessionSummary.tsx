import { useMemo } from 'react';
import { QuizResponse } from '../types';

interface SessionSummaryProps {
  responses: QuizResponse[];
  calibrationECE: number | null;
  onClose: () => void;
}

interface StrugglingItem {
  itemId: string;
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
      'When you feel unsure, give yourself credit — your instincts are better than you think.'
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

export default function SessionSummary({
  responses,
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

    // Find high-confidence incorrect (overconfident misses)
    const struggling: StrugglingItem[] = responses
      .filter(r => !r.correctness && r.confidence > 50)
      .map(r => ({ itemId: r.itemId, confidence: r.confidence, wasCorrect: false }));

    // Find low-confidence correct (underconfident hits)
    const underconfidentHits = responses.filter(
      r => r.correctness && r.confidence < 40
    ).length;

    const calFeedback = getCalibrationFeedback(gap);
    const recommendations = getRecommendations(accuracy, gap, struggling.length);

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
    };
  }, [responses]);

  const ecePct = calibrationECE !== null ? (calibrationECE * 100).toFixed(1) : null;

  return (
    <div className="session-summary card">
      <h2 className="session-summary__title">Session Complete</h2>

      {/* Stats grid */}
      <div className="session-summary__grid">
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">
            {stats.correct}/{stats.total}
          </span>
          <span className="session-summary__stat-label">Correct</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">
            {stats.accuracy.toFixed(0)}%
          </span>
          <span className="session-summary__stat-label">Accuracy</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">
            {stats.avgConf.toFixed(0)}%
          </span>
          <span className="session-summary__stat-label">Avg Confidence</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">
            {(stats.avgRT / 1000).toFixed(1)}s
          </span>
          <span className="session-summary__stat-label">Avg Response Time</span>
        </div>
      </div>

      {/* Calibration section */}
      <div
        className={`session-summary__calibration session-summary__calibration--${stats.calFeedback.type}`}
      >
        <span className="session-summary__calibration-title">Calibration</span>
        {ecePct !== null && (
          <span className="session-summary__calibration-ece">ECE: {ecePct}%</span>
        )}
        <p className="session-summary__calibration-msg">
          {stats.calFeedback.message}
        </p>
        {stats.underconfidentHits > 0 && (
          <p className="session-summary__calibration-detail">
            You got {stats.underconfidentHits} item(s) correct despite low confidence
            — trust yourself more!
          </p>
        )}
      </div>

      {/* Struggling items */}
      {stats.struggling.length > 0 && (
        <div className="session-summary__struggling">
          <span className="session-summary__section-title">Needs Review</span>
          <p className="session-summary__struggling-desc">
            {stats.struggling.length} item(s) you rated high confidence but got wrong:
          </p>
          <div className="session-summary__struggling-list">
            {stats.struggling.slice(0, 5).map(item => (
              <span key={item.itemId} className="session-summary__struggling-item">
                {item.itemId} ({item.confidence}% conf)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="session-summary__recommendations">
        <span className="session-summary__section-title">Recommendations</span>
        <ul className="session-summary__tips">
          {stats.recommendations.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>

      <button className="btn btn-primary btn-block" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
