import { QuizResponse } from '../types';

interface SessionSummaryProps {
  responses: QuizResponse[];
  calibrationECE: number | null;
  onClose: () => void;
}

/**
 * End-of-session summary showing accuracy, calibration, and stats.
 */
export default function SessionSummary({
  responses,
  calibrationECE,
  onClose,
}: SessionSummaryProps) {
  const total = responses.length;
  const correct = responses.filter(r => r.correctness).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const avgConfidence = total > 0
    ? responses.reduce((s, r) => s + r.confidence, 0) / total
    : 0;
  const avgRT = total > 0
    ? responses.reduce((s, r) => s + r.responseTime, 0) / total
    : 0;
  const ecePct = calibrationECE !== null ? (calibrationECE * 100).toFixed(1) : '—';

  const calibrationGap = avgConfidence - accuracy;
  let calibrationMessage: string;
  if (calibrationGap > 10) {
    calibrationMessage = 'You tend to be overconfident. Try pausing before rating high confidence.';
  } else if (calibrationGap < -10) {
    calibrationMessage = 'You know more than you think! Trust yourself a bit more.';
  } else {
    calibrationMessage = 'Great calibration! Your confidence matches your performance well.';
  }

  return (
    <div className="session-summary card">
      <h2 className="session-summary__title">Session Complete</h2>

      <div className="session-summary__grid">
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{correct}/{total}</span>
          <span className="session-summary__stat-label">Correct</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{accuracy.toFixed(0)}%</span>
          <span className="session-summary__stat-label">Accuracy</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{avgConfidence.toFixed(0)}%</span>
          <span className="session-summary__stat-label">Avg Confidence</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{(avgRT / 1000).toFixed(1)}s</span>
          <span className="session-summary__stat-label">Avg Response Time</span>
        </div>
      </div>

      <div className="session-summary__calibration">
        <span className="session-summary__calibration-title">Calibration</span>
        <span className="session-summary__calibration-ece">ECE: {ecePct}%</span>
        <p className="session-summary__calibration-msg">{calibrationMessage}</p>
      </div>

      <button className="btn btn-primary btn-block" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
