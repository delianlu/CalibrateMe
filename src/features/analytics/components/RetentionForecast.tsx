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
  ReferenceLine,
} from 'recharts';
import { ItemState } from '../../user/types';

interface RetentionForecastProps {
  itemStates: Record<string, ItemState>;
  forgettingRate?: number; // lambda, default 0.1
}

function predictRetention(kHat: number, lambda: number, days: number): number {
  return kHat * Math.exp(-lambda * days);
}

function getBarColor(retention: number): string {
  if (retention >= 0.8) return '#38a169';
  if (retention >= 0.6) return '#d69e2e';
  return '#e53e3e';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p><strong>{d.label}</strong></p>
        <p>Predicted retention: {(d.retention * 100).toFixed(0)}%</p>
        <p>Items at risk: {d.atRisk} / {d.total}</p>
      </div>
    );
  }
  return null;
};

export default function RetentionForecast({
  itemStates,
  forgettingRate = 0.1,
}: RetentionForecastProps) {
  const data = useMemo(() => {
    const items = Object.values(itemStates).filter(s => s.reviewCount > 0);
    if (items.length === 0) return [];

    const forecastDays = [
      { label: 'Tomorrow', days: 1 },
      { label: '3 Days', days: 3 },
      { label: '1 Week', days: 7 },
      { label: '2 Weeks', days: 14 },
      { label: '1 Month', days: 30 },
    ];

    return forecastDays.map(({ label, days }) => {
      let totalRetention = 0;
      let atRisk = 0;
      for (const item of items) {
        const ret = predictRetention(item.kHat, forgettingRate, days);
        totalRetention += ret;
        if (ret < 0.5) atRisk++;
      }
      return {
        label,
        days,
        retention: totalRetention / items.length,
        atRisk,
        total: items.length,
      };
    });
  }, [itemStates, forgettingRate]);

  if (data.length === 0) {
    return (
      <div className="analytics-empty">
        <p>Complete some reviews to see retention forecasts.</p>
      </div>
    );
  }

  const atRiskToday = data[0]?.atRisk ?? 0;

  return (
    <div className="retention-forecast">
      <h4 className="retention-forecast__title">Retention Forecast</h4>
      {atRiskToday > 0 && (
        <p className="retention-forecast__alert">
          Review {atRiskToday} item(s) today to maintain 85%+ retention
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" fontSize={11} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0.85} stroke="#a0aec0" strokeDasharray="3 3" />
          <Bar dataKey="retention" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={getBarColor(d.retention)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
