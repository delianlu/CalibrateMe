import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CalibrationChartProps {
  title: string;
  data: Array<Record<string, number>>;
  dataKeys: string[];
  colors: string[];
}

const CalibrationChart: React.FC<CalibrationChartProps> = ({
  title,
  data,
  dataKeys,
  colors,
}) => {
  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="session"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CalibrationChart;
