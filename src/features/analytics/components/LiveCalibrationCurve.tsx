import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { QuizResponse } from '../../quiz/types';

interface LiveCalibrationCurveProps {
  responses: QuizResponse[];
  bins?: number;
}

interface BinData {
  confidence: number;
  accuracy: number;
  count: number;
  gap: number;
}

function binResponses(responses: QuizResponse[], numBins: number): BinData[] {
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

  return bins
    .map((b) => {
      if (b.total === 0) return null;
      const meanConf = b.confSum / b.total;
      const accuracy = b.correct / b.total;
      return {
        confidence: meanConf,
        accuracy,
        count: b.total,
        gap: meanConf - accuracy,
      };
    })
    .filter((b): b is BinData => b !== null);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p><strong>Confidence:</strong> {(d.confidence * 100).toFixed(0)}%</p>
        <p><strong>Accuracy:</strong> {(d.accuracy * 100).toFixed(0)}%</p>
        <p><strong>Gap:</strong> {(d.gap * 100).toFixed(1)}%</p>
        <p><strong>Responses:</strong> {d.count}</p>
      </div>
    );
  }
  return null;
};

export default function LiveCalibrationCurve({
  responses,
  bins = 5,
}: LiveCalibrationCurveProps) {
  const chartData = useMemo(() => binResponses(responses, bins), [responses, bins]);

  const perfectLine = [
    { confidence: 0, accuracy: 0 },
    { confidence: 1, accuracy: 1 },
  ];

  if (responses.length < 3) {
    return (
      <div className="analytics-empty">
        <p>Complete at least 3 items to see your calibration curve.</p>
      </div>
    );
  }

  return (
    <div className="live-cal-curve">
      <h4 className="live-cal-curve__title">Calibration Curve</h4>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="confidence"
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Confidence', position: 'bottom', offset: 0, fontSize: 12 }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Shaded over/under regions */}
          <Area
            data={perfectLine}
            type="linear"
            dataKey="accuracy"
            fill="#fed7d7"
            fillOpacity={0.25}
            stroke="none"
          />

          {/* Perfect calibration diagonal */}
          <Line
            data={perfectLine}
            type="linear"
            dataKey="accuracy"
            stroke="#a0aec0"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            legendType="none"
          />

          {/* Learner curve */}
          <Line
            data={chartData}
            type="monotone"
            dataKey="accuracy"
            stroke="#4299e1"
            strokeWidth={2}
            dot={{ fill: '#4299e1', r: 5, strokeWidth: 2, stroke: '#fff' }}
            legendType="none"
          />
          <Scatter data={chartData} fill="#4299e1" legendType="none" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="live-cal-curve__legend">
        <span className="live-cal-curve__legend-item live-cal-curve__legend-item--under">
          Underconfident
        </span>
        <span className="live-cal-curve__legend-item live-cal-curve__legend-item--over">
          Overconfident
        </span>
      </div>
    </div>
  );
}
