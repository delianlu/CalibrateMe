import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ItemState } from '../../user/types';

interface ForgettingCurvesProps {
  itemStates: Record<string, ItemState>;
  forgettingRate?: number;
  maxItems?: number;
}

const COLORS = ['#4299e1', '#38a169', '#d69e2e', '#e53e3e', '#805ad5'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length > 0) {
    return (
      <div className="chart-tooltip">
        <p><strong>Day {label}</strong></p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {(p.value * 100).toFixed(0)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ForgettingCurves({
  itemStates,
  forgettingRate = 0.1,
  maxItems = 5,
}: ForgettingCurvesProps) {
  const chartData = useMemo(() => {
    const reviewed = Object.values(itemStates)
      .filter(s => s.reviewCount > 0)
      .sort((a, b) => b.kHat - a.kHat)
      .slice(0, maxItems);

    if (reviewed.length === 0) return { items: [] as string[], points: [] as any[] };

    const maxDays = 30;
    const points = [];

    for (let d = 0; d <= maxDays; d++) {
      const row: Record<string, number> = { day: d };
      for (const item of reviewed) {
        row[item.itemId] = item.kHat * Math.exp(-forgettingRate * d);
      }
      points.push(row);
    }

    return { items: reviewed.map(i => i.itemId), points };
  }, [itemStates, forgettingRate, maxItems]);

  if (chartData.items.length === 0) {
    return (
      <div className="analytics-empty">
        <p>Complete some reviews to see forgetting curves.</p>
      </div>
    );
  }

  return (
    <div className="forgetting-curves">
      <h4 className="forgetting-curves__title">Forgetting Curves (Top {chartData.items.length} Items)</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData.points} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="day"
            fontSize={11}
            label={{ value: 'Days', position: 'bottom', offset: 0, fontSize: 11 }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {chartData.items.map((id, i) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              name={id}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
