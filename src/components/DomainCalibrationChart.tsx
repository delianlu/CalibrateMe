// =============================================================================
// DomainCalibrationChart — Side-by-side domain-specific calibration tracking
// Shows β̂_vocab and β̂_grammar trajectories over sessions
// =============================================================================

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';
import { SimulationResults } from '../types';

interface DomainCalibrationChartProps {
  results: SimulationResults;
}

const DomainCalibrationChart: React.FC<DomainCalibrationChartProps> = ({ results }) => {
  const hasDomainData = results.beta_hat_vocab_trajectory && results.beta_hat_grammar_trajectory;

  const trajectoryData = useMemo(() => {
    if (!hasDomainData) return [];
    return results.beta_hat_vocab_trajectory!.map((vocabBeta, i) => ({
      session: i + 1,
      'β̂ Vocabulary': vocabBeta,
      'β̂ Grammar': results.beta_hat_grammar_trajectory![i],
      'β̂ Global': results.session_data[i]
        ? (results.session_data[i].mean_confidence -
           results.session_data[i].correct_count / Math.max(1, results.session_data[i].items_reviewed))
        : 0,
    }));
  }, [results, hasDomainData]);

  const finalComparison = useMemo(() => {
    if (!hasDomainData || trajectoryData.length === 0) return [];
    const last = trajectoryData[trajectoryData.length - 1];
    return [
      { domain: 'Vocabulary', beta_hat: last['β̂ Vocabulary'] },
      { domain: 'Grammar', beta_hat: last['β̂ Grammar'] },
      { domain: 'Global', beta_hat: last['β̂ Global'] },
    ];
  }, [trajectoryData, hasDomainData]);

  if (!hasDomainData) {
    return (
      <div className="chart-container" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        <p>Domain-split calibration is not enabled for this simulation.</p>
        <p style={{ fontSize: '13px' }}>Enable &quot;Domain-Split Calibration&quot; in simulation controls and select a domain-asymmetric profile.</p>
      </div>
    );
  }

  return (
    <div className="domain-calibration-chart">
      <h3 style={{ margin: '0 0 8px 0' }}>Domain-Specific Calibration Tracking</h3>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
        Tracks β̂ independently for vocabulary and grammar items
      </p>

      {/* β̂ Trajectory by Domain */}
      <div className="chart-container" role="figure" aria-label="Domain-specific calibration bias trajectory">
        <h4 className="chart-title">β̂ Trajectory by Domain</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trajectoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="session"
              tick={{ fontSize: 12 }}
              tickLine={false}
              label={{ value: 'Session', position: 'insideBottom', offset: -2, fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) => v.toFixed(2)}
              domain={[-0.4, 0.4]}
            />
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}
              formatter={(value: number, name: string) => [value.toFixed(3), name]}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Well-calibrated', position: 'right', fontSize: 10 }} />
            <Line type="monotone" dataKey="β̂ Vocabulary" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="β̂ Grammar" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="β̂ Global" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Final β̂ Comparison Bar Chart */}
      <div className="chart-container" role="figure" aria-label="Final domain calibration comparison" style={{ marginTop: '16px' }}>
        <h4 className="chart-title">Final β̂ by Domain</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={finalComparison} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="domain" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => v.toFixed(2)}
              domain={[-0.4, 0.4]}
            />
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}
              formatter={(value: number) => [value.toFixed(3), 'β̂']}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar
              dataKey="beta_hat"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 11, formatter: (v: number) => v.toFixed(3) }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation */}
      <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>
        <strong>Interpretation:</strong>
        {finalComparison.length > 0 && (
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            <li>
              Vocabulary β̂ = {finalComparison[0].beta_hat.toFixed(3)}
              {finalComparison[0].beta_hat > 0.1 ? ' (overconfident)' : finalComparison[0].beta_hat < -0.1 ? ' (underconfident)' : ' (well-calibrated)'}
            </li>
            <li>
              Grammar β̂ = {finalComparison[1].beta_hat.toFixed(3)}
              {finalComparison[1].beta_hat > 0.1 ? ' (overconfident)' : finalComparison[1].beta_hat < -0.1 ? ' (underconfident)' : ' (well-calibrated)'}
            </li>
            {Math.abs(finalComparison[0].beta_hat - finalComparison[1].beta_hat) > 0.1 && (
              <li style={{ color: '#6366f1', fontWeight: 'bold' }}>
                Asymmetric calibration detected — domain-split scheduling is beneficial
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DomainCalibrationChart;
