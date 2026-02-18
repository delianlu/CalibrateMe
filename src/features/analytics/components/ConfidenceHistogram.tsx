import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { QuizResponse } from '../../quiz/types';

interface ConfidenceHistogramProps {
  responses: QuizResponse[];
}

interface HistBin {
  label: string;
  count: number;
  correct: number;
  incorrect: number;
}

const BIN_COLORS = ['#fc8181', '#f6ad55', '#faf089', '#9ae6b4', '#68d391'];

function buildHistogram(responses: QuizResponse[]): HistBin[] {
  const labels = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
  const bins: HistBin[] = labels.map(label => ({
    label,
    count: 0,
    correct: 0,
    incorrect: 0,
  }));

  for (const r of responses) {
    const idx = Math.min(Math.floor(r.confidence / 20), 4);
    bins[idx].count += 1;
    if (r.correctness) bins[idx].correct += 1;
    else bins[idx].incorrect += 1;
  }

  return bins;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    const acc = d.count > 0 ? ((d.correct / d.count) * 100).toFixed(0) : '0';
    return (
      <div className="chart-tooltip">
        <p><strong>{d.label}</strong></p>
        <p>Responses: {d.count}</p>
        <p>Accuracy: {acc}%</p>
      </div>
    );
  }
  return null;
};

export default function ConfidenceHistogram({ responses }: ConfidenceHistogramProps) {
  const data = useMemo(() => buildHistogram(responses), [responses]);

  if (responses.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No data yet.</p>
      </div>
    );
  }

  return (
    <div className="conf-histogram">
      <h4 className="conf-histogram__title">Confidence Distribution</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" fontSize={11} />
          <YAxis allowDecimals={false} fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BIN_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
