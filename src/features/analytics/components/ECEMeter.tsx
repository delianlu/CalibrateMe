import { useMemo } from 'react';
import { QuizResponse } from '../../quiz/types';

interface ECEMeterProps {
  responses: QuizResponse[];
}

function computeECE(responses: QuizResponse[], numBins: number = 5): number {
  const bins: { correct: number; total: number; confSum: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    bins.push({ correct: 0, total: 0, confSum: 0 });
  }

  for (const r of responses) {
    const idx = Math.min(Math.floor((r.confidence / 100) * numBins), numBins - 1);
    bins[idx].total += 1;
    bins[idx].confSum += r.confidence / 100;
    if (r.correctness) bins[idx].correct += 1;
  }

  let ece = 0;
  const n = responses.length;
  for (const b of bins) {
    if (b.total === 0) continue;
    const accuracy = b.correct / b.total;
    const meanConf = b.confSum / b.total;
    ece += (b.total / n) * Math.abs(accuracy - meanConf);
  }
  return ece;
}

function getECEColor(ece: number): string {
  if (ece < 0.1) return '#38a169';  // green
  if (ece < 0.2) return '#d69e2e';  // yellow
  return '#e53e3e';                  // red
}

function getECELabel(ece: number): string {
  if (ece < 0.1) return 'Well Calibrated';
  if (ece < 0.2) return 'Moderate';
  return 'Needs Improvement';
}

export default function ECEMeter({ responses }: ECEMeterProps) {
  const ece = useMemo(
    () => (responses.length >= 3 ? computeECE(responses) : null),
    [responses]
  );

  if (ece === null) {
    return (
      <div className="ece-meter">
        <h4 className="ece-meter__title">Calibration Error (ECE)</h4>
        <p className="ece-meter__empty">Need more data...</p>
      </div>
    );
  }

  const pct = Math.min(ece * 100, 100);
  const color = getECEColor(ece);

  return (
    <div className="ece-meter">
      <h4 className="ece-meter__title">Calibration Error (ECE)</h4>
      <div className="ece-meter__value" style={{ color }}>
        {(ece * 100).toFixed(1)}%
      </div>
      <div className="ece-meter__bar-bg">
        <div
          className="ece-meter__bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
        {/* Threshold markers */}
        <div className="ece-meter__marker" style={{ left: '10%' }} />
        <div className="ece-meter__marker" style={{ left: '20%' }} />
      </div>
      <div className="ece-meter__label" style={{ color }}>
        {getECELabel(ece)}
      </div>
    </div>
  );
}
