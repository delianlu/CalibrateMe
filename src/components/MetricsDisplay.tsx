import React from 'react';
import { SimulationResults } from '../types';

interface MetricsDisplayProps {
  results: SimulationResults;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ results }) => {
  const metrics = [
    {
      label: 'Retention (1 day)',
      value: `${(results.retention_1day * 100).toFixed(1)}%`,
      positive: results.retention_1day > 0.8,
    },
    {
      label: 'Retention (7 days)',
      value: `${(results.retention_7day * 100).toFixed(1)}%`,
      positive: results.retention_7day > 0.7,
    },
    {
      label: 'Retention (30 days)',
      value: `${(results.retention_30day * 100).toFixed(1)}%`,
      positive: results.retention_30day > 0.6,
    },
    {
      label: 'Time to Mastery',
      value: `${results.time_to_mastery} sessions`,
      positive: results.time_to_mastery < results.config.num_sessions,
    },
    {
      label: 'Review Efficiency',
      value: `${results.review_efficiency.toFixed(2)}`,
      positive: results.review_efficiency < 5,
    },
    {
      label: 'Final ECE',
      value: results.ece_trajectory[results.ece_trajectory.length - 1]?.toFixed(3) || 'N/A',
      positive: (results.ece_trajectory[results.ece_trajectory.length - 1] || 1) < 0.1,
    },
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-label">{metric.label}</div>
          <div className={`metric-value ${metric.positive ? 'positive' : ''}`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsDisplay;
