// =============================================================================
// Comparison View Component
// Shows side-by-side comparison of CalibrateMe vs baselines
// =============================================================================

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SimulationResults, SchedulerType } from '../types';

interface ComparisonViewProps {
  results: Map<SchedulerType, SimulationResults>;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ results }) => {
  // Prepare data for charts
  const retentionData = Array.from(results.entries()).map(([scheduler, result]) => ({
    name: formatSchedulerName(scheduler),
    '1-Day': result.retention_1day * 100,
    '7-Day': result.retention_7day * 100,
    '30-Day': result.retention_30day * 100,
  }));

  const efficiencyData = Array.from(results.entries()).map(([scheduler, result]) => ({
    name: formatSchedulerName(scheduler),
    'Time to Mastery': result.time_to_mastery,
    'Review Efficiency': result.review_efficiency,
  }));

  const calibrationData = Array.from(results.entries()).map(([scheduler, result]) => ({
    name: formatSchedulerName(scheduler),
    'Final ECE': result.ece_trajectory[result.ece_trajectory.length - 1] * 100,
    'Final Brier': result.brier_trajectory[result.brier_trajectory.length - 1] * 100,
  }));

  return (
    <div className="comparison-view">
      <h3 className="card-title">Scheduler Comparison</h3>

      {/* Retention Comparison */}
      <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
        <h4 className="chart-title">Retention Rates</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={retentionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="1-Day" fill="#38a169" />
            <Bar dataKey="7-Day" fill="#4299e1" />
            <Bar dataKey="30-Day" fill="#9f7aea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Efficiency Comparison */}
      <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
        <h4 className="chart-title">Learning Efficiency</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Time to Mastery" fill="#ed8936" name="Sessions to Mastery" />
            <Bar dataKey="Review Efficiency" fill="#4299e1" name="Reviews per Item" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calibration Error Comparison */}
      <div className="chart-container">
        <h4 className="chart-title">Calibration Error (Lower is Better)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={calibrationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 'auto']} />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="Final ECE" fill="#e53e3e" name="ECE (%)" />
            <Bar dataKey="Final Brier" fill="#fc8181" name="Brier (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h4 className="chart-title">Summary Statistics</h4>
        <table className="response-table">
          <thead>
            <tr>
              <th>Scheduler</th>
              <th>Ret. (1d)</th>
              <th>Ret. (7d)</th>
              <th>Ret. (30d)</th>
              <th>Mastery</th>
              <th>Efficiency</th>
              <th>ECE</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(results.entries()).map(([scheduler, result]) => {
              const isBest = scheduler === SchedulerType.CALIBRATEME;
              return (
                <tr key={scheduler} style={{ background: isBest ? '#ebf8ff' : undefined }}>
                  <td><strong>{formatSchedulerName(scheduler)}</strong></td>
                  <td>{(result.retention_1day * 100).toFixed(1)}%</td>
                  <td>{(result.retention_7day * 100).toFixed(1)}%</td>
                  <td>{(result.retention_30day * 100).toFixed(1)}%</td>
                  <td>{result.time_to_mastery} sessions</td>
                  <td>{result.review_efficiency.toFixed(2)}</td>
                  <td>{(result.ece_trajectory[result.ece_trajectory.length - 1] * 100).toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatSchedulerName(scheduler: SchedulerType): string {
  switch (scheduler) {
    case SchedulerType.CALIBRATEME: return 'CalibrateMe';
    case SchedulerType.SM2: return 'SM-2';
    case SchedulerType.BKT_ONLY: return 'BKT-Only';
    case SchedulerType.DECAY_BASED: return 'Decay-Based';
    default: return scheduler;
  }
}

export default ComparisonView;
