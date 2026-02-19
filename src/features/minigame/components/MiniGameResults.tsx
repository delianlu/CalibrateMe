import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TriviAnswer, TriviQuestion } from '../types';

interface MiniGameResultsProps {
  answers: TriviAnswer[];
  questions: TriviQuestion[];
  onPlayAgain: () => void;
  onClose: () => void;
}

interface CalibrationBin {
  label: string;
  binMidpoint: number;
  avgConfidence: number;
  accuracy: number;
  count: number;
  perfect: number; // the perfect calibration value for this bin
}

const BIN_RANGES = [
  { label: '0-25%', min: 0, max: 25, midpoint: 12.5, perfect: 0.125 },
  { label: '25-50%', min: 25, max: 50, midpoint: 37.5, perfect: 0.375 },
  { label: '50-75%', min: 50, max: 75, midpoint: 62.5, perfect: 0.625 },
  { label: '75-100%', min: 75, max: 100, midpoint: 87.5, perfect: 0.875 },
];

function computeCalibrationBins(answers: TriviAnswer[]): CalibrationBin[] {
  return BIN_RANGES.map(({ label, min, max, midpoint, perfect }) => {
    const inBin = answers.filter(a => {
      if (max === 100) return a.confidence >= min && a.confidence <= max;
      return a.confidence >= min && a.confidence < max;
    });

    if (inBin.length === 0) {
      return {
        label,
        binMidpoint: midpoint,
        avgConfidence: midpoint,
        accuracy: 0,
        count: 0,
        perfect,
      };
    }

    const correctCount = inBin.filter(a => a.correct).length;
    const avgConf = inBin.reduce((sum, a) => sum + a.confidence, 0) / inBin.length;

    return {
      label,
      binMidpoint: midpoint,
      avgConfidence: avgConf,
      accuracy: correctCount / inBin.length,
      count: inBin.length,
      perfect,
    };
  });
}

type Verdict = 'overconfident' | 'underconfident' | 'well-calibrated';

function getVerdict(answers: TriviAnswer[]): { verdict: Verdict; message: string } {
  if (answers.length === 0) {
    return { verdict: 'well-calibrated', message: 'No answers to evaluate.' };
  }

  const avgConfidence = answers.reduce((s, a) => s + a.confidence, 0) / answers.length;
  const accuracy = (answers.filter(a => a.correct).length / answers.length) * 100;

  if (avgConfidence > accuracy + 15) {
    return {
      verdict: 'overconfident',
      message: 'You tend to be OVERCONFIDENT. Your confidence exceeds your accuracy.',
    };
  }
  if (avgConfidence < accuracy - 15) {
    return {
      verdict: 'underconfident',
      message: 'You tend to be UNDERCONFIDENT. You know more than you think!',
    };
  }
  return {
    verdict: 'well-calibrated',
    message: 'You are WELL CALIBRATED! Your confidence matches your accuracy.',
  };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload as CalibrationBin;
    if (d.count === 0) return null;
    return (
      <div className="chart-tooltip">
        <p><strong>Bin:</strong> {d.label}</p>
        <p><strong>Avg Confidence:</strong> {d.avgConfidence.toFixed(0)}%</p>
        <p><strong>Accuracy:</strong> {(d.accuracy * 100).toFixed(0)}%</p>
        <p><strong>Questions:</strong> {d.count}</p>
      </div>
    );
  }
  return null;
};

export default function MiniGameResults({
  answers,
  questions,
  onPlayAgain,
  onClose,
}: MiniGameResultsProps) {
  const totalCorrect = useMemo(() => answers.filter(a => a.correct).length, [answers]);
  const avgConfidence = useMemo(
    () => answers.length > 0 ? answers.reduce((s, a) => s + a.confidence, 0) / answers.length : 0,
    [answers]
  );
  const bins = useMemo(() => computeCalibrationBins(answers), [answers]);
  const { verdict, message } = useMemo(() => getVerdict(answers), [answers]);

  // Build a lookup map from question id to question
  const questionMap = useMemo(() => {
    const map = new Map<string, TriviQuestion>();
    for (const q of questions) {
      map.set(q.id, q);
    }
    return map;
  }, [questions]);

  // Chart data: only include bins that have answers
  const chartData = useMemo(() => {
    return bins.map(b => ({
      ...b,
      accuracyPct: b.count > 0 ? b.accuracy * 100 : null,
      perfectPct: b.perfect * 100,
    }));
  }, [bins]);

  // Perfect calibration line data for overlay
  const perfectLineData = useMemo(() => {
    return BIN_RANGES.map(({ label, perfect }) => ({
      label,
      perfectPct: perfect * 100,
    }));
  }, []);

  const verdictClass =
    verdict === 'overconfident'
      ? 'minigame-results__verdict--overconfident'
      : verdict === 'underconfident'
      ? 'minigame-results__verdict--underconfident'
      : 'minigame-results__verdict--well-calibrated';

  return (
    <div className="minigame-results card">
      <h2 className="minigame-results__title">Calibration Results</h2>

      {/* Score overview */}
      <div className="minigame-results__score">
        <div className="minigame-results__score-item">
          <span className="minigame-results__score-value">{totalCorrect}/{answers.length}</span>
          <span className="minigame-results__score-label">Correct</span>
        </div>
        <div className="minigame-results__score-item">
          <span className="minigame-results__score-value">{avgConfidence.toFixed(0)}%</span>
          <span className="minigame-results__score-label">Avg Confidence</span>
        </div>
        <div className="minigame-results__score-item">
          <span className="minigame-results__score-value">
            {answers.length > 0 ? ((totalCorrect / answers.length) * 100).toFixed(0) : 0}%
          </span>
          <span className="minigame-results__score-label">Accuracy</span>
        </div>
      </div>

      {/* Calibration chart */}
      <div className="minigame-results__chart">
        <h3>Calibration Curve</h3>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              label={{ value: 'Confidence Bin', position: 'bottom', offset: 0, fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Perfect calibration diagonal reference */}
            <Line
              data={perfectLineData}
              dataKey="perfectPct"
              type="linear"
              stroke="#a0aec0"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Perfect Calibration"
              legendType="none"
            />

            {/* Actual accuracy bars */}
            <Bar
              dataKey="accuracyPct"
              fill="#4299e1"
              radius={[4, 4, 0, 0]}
              name="Your Accuracy"
              barSize={40}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="minigame-results__chart-legend">
          <span className="minigame-results__chart-legend-item">
            <span className="minigame-results__chart-legend-swatch minigame-results__chart-legend-swatch--bar" />
            Your Accuracy
          </span>
          <span className="minigame-results__chart-legend-item">
            <span className="minigame-results__chart-legend-swatch minigame-results__chart-legend-swatch--line" />
            Perfect Calibration
          </span>
        </div>
      </div>

      {/* Verdict */}
      <div className={`minigame-results__verdict ${verdictClass}`}>
        <p>{message}</p>
      </div>

      {/* Per-question breakdown */}
      <div className="minigame-results__breakdown">
        <h3>Question Breakdown</h3>
        <div className="minigame-results__breakdown-list">
          {answers.map((answer, idx) => {
            const question = questionMap.get(answer.questionId);
            if (!question) return null;

            const isOverconfident = !answer.correct && answer.confidence >= 70;
            const isUnderconfident = answer.correct && answer.confidence <= 40;

            let itemClass = 'minigame-results__item';
            if (isOverconfident) itemClass += ' minigame-results__item--overconfident';
            if (isUnderconfident) itemClass += ' minigame-results__item--underconfident';

            return (
              <div key={answer.questionId} className={itemClass}>
                <div className="minigame-results__item-header">
                  <span className="minigame-results__item-number">Q{idx + 1}</span>
                  <span
                    className={`badge ${answer.correct ? 'badge-success' : 'badge-error'}`}
                  >
                    {answer.correct ? 'Correct' : 'Wrong'}
                  </span>
                  <span className="minigame-results__item-confidence">
                    {answer.confidence}% confident
                  </span>
                </div>
                <p className="minigame-results__item-question">{question.question}</p>
                <div className="minigame-results__item-answers">
                  <span className="minigame-results__item-your-answer">
                    Your answer: {question.options[answer.selectedIndex]}
                  </span>
                  {!answer.correct && (
                    <span className="minigame-results__item-correct-answer">
                      Correct: {question.options[question.correctIndex]}
                    </span>
                  )}
                </div>
                {isOverconfident && (
                  <span className="minigame-results__item-tag minigame-results__item-tag--over">
                    Overconfident
                  </span>
                )}
                {isUnderconfident && (
                  <span className="minigame-results__item-tag minigame-results__item-tag--under">
                    Underconfident
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="minigame-results__actions">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Back to App
        </button>
      </div>
    </div>
  );
}
