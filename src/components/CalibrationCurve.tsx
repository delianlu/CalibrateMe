// =============================================================================
// Calibration Curve Component
// Shows confidence vs accuracy with diagonal reference line
// =============================================================================

import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { CalibrationBin } from '../types';

interface CalibrationCurveProps {
  bins: CalibrationBin[];
  title?: string;
  showRegions?: boolean;
}

const CalibrationCurve: React.FC<CalibrationCurveProps> = ({
  bins,
  title = 'Calibration Curve',
  showRegions = true,
}) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    return bins.map(bin => ({
      confidence: bin.mean_confidence,
      accuracy: bin.mean_accuracy,
      count: bin.count,
      gap: bin.calibration_gap,
    }));
  }, [bins]);

  // Perfect calibration line data
  const perfectLine = [
    { confidence: 0, accuracy: 0 },
    { confidence: 1, accuracy: 1 },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
        }}>
          <p><strong>Confidence:</strong> {(data.confidence * 100).toFixed(0)}%</p>
          <p><strong>Accuracy:</strong> {(data.accuracy * 100).toFixed(0)}%</p>
          <p><strong>Gap:</strong> {(data.gap * 100).toFixed(1)}%</p>
          <p><strong>Responses:</strong> {data.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="confidence"
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Reported Confidence', position: 'bottom', offset: 0 }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Actual Accuracy', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Underconfidence region (above diagonal) */}
          {showRegions && (
            <Area
              data={[
                { confidence: 0, accuracy: 0, upper: 1 },
                { confidence: 1, accuracy: 1, upper: 1 },
              ]}
              dataKey="upper"
              fill="#c6f6d5"
              fillOpacity={0.3}
              stroke="none"
            />
          )}

          {/* Perfect calibration line */}
          <Line
            data={perfectLine}
            type="linear"
            dataKey="accuracy"
            stroke="#718096"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Perfect Calibration"
          />

          {/* Actual calibration points */}
          <Scatter
            data={chartData}
            fill="#4299e1"
            name="Learner Calibration"
          />

          {/* Connect points with line */}
          <Line
            data={chartData}
            type="monotone"
            dataKey="accuracy"
            stroke="#4299e1"
            strokeWidth={2}
            dot={{ fill: '#4299e1', r: 6 }}
            name="Calibration Curve"
          />

          <Legend />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Region labels */}
      {showRegions && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '12px',
          color: '#718096',
        }}>
          <span style={{ color: '#38a169' }}>Underconfidence Region</span>
          <span style={{ color: '#e53e3e' }}>Overconfidence Region</span>
        </div>
      )}
    </div>
  );
};

export default CalibrationCurve;
