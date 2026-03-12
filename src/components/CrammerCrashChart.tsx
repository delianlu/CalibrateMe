// =============================================================================
// CrammerCrashChart — Visualization for Prompt D: Crammer's Crash Stress Test
// Shows K*, K̂ (SM-2 vs CalibrateMe), and β̂ trajectory over 30 sessions
// =============================================================================

import React, { useMemo, useState } from 'react';
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
  Area,
  ComposedChart,
} from 'recharts';
import { createLearnerProfile } from '../profiles/learnerProfiles';
import { runSimulation } from '../simulation/simulationEngine';
import { SchedulerType, SimulationConfig, DEFAULT_SIMULATION_CONFIG } from '../types';

interface CrammerChartData {
  session: number;
  K_star: number;
  K_hat_sm2: number;
  K_hat_calibrateme: number;
  beta_hat: number;
  ece_sm2: number;
  ece_calibrateme: number;
  confidence_sm2: number;
  confidence_calibrateme: number;
}

interface CrammerAnalysis {
  data: CrammerChartData[];
  sm2Results: {
    retention_1day: number;
    retention_7day: number;
    retention_30day: number;
    time_to_mastery: number;
    final_ece: number;
  };
  calibratemeResults: {
    retention_1day: number;
    retention_7day: number;
    retention_30day: number;
    time_to_mastery: number;
    final_ece: number;
  };
  crashDetectionSession_sm2: number;
  crashDetectionSession_calibrateme: number;
}

function runCrammerAnalysis(seed: number = 42): CrammerAnalysis {
  const baseConfig: SimulationConfig = {
    ...DEFAULT_SIMULATION_CONFIG,
    num_sessions: 30,
    num_items: 100,
    items_per_session: 20,
    random_seed: seed,
    enable_scaffolding: true,
    enable_dual_process: true,
  };

  const profileSM2 = createLearnerProfile('Crammer', baseConfig.num_items);
  const profileCM = createLearnerProfile('Crammer', baseConfig.num_items);

  const sm2Config: SimulationConfig = { ...baseConfig, scheduler_type: SchedulerType.SM2 };
  const cmConfig: SimulationConfig = { ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME };

  const sm2Results = runSimulation(profileSM2, sm2Config);
  const cmResults = runSimulation(profileCM, cmConfig);

  // Build session-by-session comparison data
  const data: CrammerChartData[] = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      session: i + 1,
      K_star: cmResults.K_star_trajectory[i],
      K_hat_sm2: sm2Results.K_hat_trajectory[i],
      K_hat_calibrateme: cmResults.K_hat_trajectory[i],
      beta_hat: cmResults.session_data[i]
        ? (cmResults.session_data[i].mean_confidence -
           cmResults.session_data[i].correct_count / cmResults.session_data[i].items_reviewed)
        : 0,
      ece_sm2: sm2Results.ece_trajectory[i],
      ece_calibrateme: cmResults.ece_trajectory[i],
      confidence_sm2: sm2Results.session_data[i]?.mean_confidence ?? 0,
      confidence_calibrateme: cmResults.session_data[i]?.mean_confidence ?? 0,
    });
  }

  // Detect "crash" — session where K* drops below 0.4 after being above 0.5
  let crashDetectionSM2 = -1;
  let crashDetectionCM = -1;

  // For SM-2: detect when K̂ finally tracks the K* drop (gap narrows)
  // For CalibrateMe: detect when β̂ exceeds threshold (early warning)
  for (let i = 1; i < data.length; i++) {
    if (crashDetectionSM2 === -1 && data[i].K_hat_sm2 < 0.5 && data[i].K_star < 0.5) {
      crashDetectionSM2 = i + 1;
    }
    if (crashDetectionCM === -1 && data[i].beta_hat > 0.15) {
      crashDetectionCM = i + 1;
    }
  }

  return {
    data,
    sm2Results: {
      retention_1day: sm2Results.retention_1day,
      retention_7day: sm2Results.retention_7day,
      retention_30day: sm2Results.retention_30day,
      time_to_mastery: sm2Results.time_to_mastery,
      final_ece: sm2Results.ece_trajectory[sm2Results.ece_trajectory.length - 1],
    },
    calibratemeResults: {
      retention_1day: cmResults.retention_1day,
      retention_7day: cmResults.retention_7day,
      retention_30day: cmResults.retention_30day,
      time_to_mastery: cmResults.time_to_mastery,
      final_ece: cmResults.ece_trajectory[cmResults.ece_trajectory.length - 1],
    },
    crashDetectionSession_sm2: crashDetectionSM2,
    crashDetectionSession_calibrateme: crashDetectionCM,
  };
}

function generateCSV(data: CrammerChartData[]): string {
  const header = 'session,K_star,K_hat_sm2,K_hat_calibrateme,beta_hat,ece_sm2,ece_calibrateme,confidence_sm2,confidence_calibrateme';
  const rows = data.map(d =>
    `${d.session},${d.K_star.toFixed(4)},${d.K_hat_sm2.toFixed(4)},${d.K_hat_calibrateme.toFixed(4)},${d.beta_hat.toFixed(4)},${d.ece_sm2.toFixed(4)},${d.ece_calibrateme.toFixed(4)},${d.confidence_sm2.toFixed(4)},${d.confidence_calibrateme.toFixed(4)}`
  );
  return [header, ...rows].join('\n');
}

function generateLatexTable(analysis: CrammerAnalysis): string {
  const { sm2Results: sm2, calibratemeResults: cm } = analysis;
  return `\\begin{table}[h]
\\centering
\\caption{Crammer Profile: SM-2 vs CalibrateMe Comparison}
\\label{tab:crammer-comparison}
\\begin{tabular}{lcc}
\\toprule
\\textbf{Metric} & \\textbf{SM-2} & \\textbf{CalibrateMe} \\\\
\\midrule
Retention (1-day) & ${sm2.retention_1day.toFixed(3)} & ${cm.retention_1day.toFixed(3)} \\\\
Retention (7-day) & ${sm2.retention_7day.toFixed(3)} & ${cm.retention_7day.toFixed(3)} \\\\
Retention (30-day) & ${sm2.retention_30day.toFixed(3)} & ${cm.retention_30day.toFixed(3)} \\\\
Time to Mastery & ${sm2.time_to_mastery} & ${cm.time_to_mastery} \\\\
Final ECE & ${sm2.final_ece.toFixed(3)} & ${cm.final_ece.toFixed(3)} \\\\
Crash Detection (session) & ${analysis.crashDetectionSession_sm2 > 0 ? analysis.crashDetectionSession_sm2 : 'Never'} & ${analysis.crashDetectionSession_calibrateme > 0 ? analysis.crashDetectionSession_calibrateme : 'Never'} \\\\
\\bottomrule
\\end{tabular}
\\end{table}`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface CrammerCrashChartProps {
  seed?: number;
}

const CrammerCrashChart: React.FC<CrammerCrashChartProps> = ({ seed = 42 }) => {
  const [showExports, setShowExports] = useState(false);

  const analysis = useMemo(() => runCrammerAnalysis(seed), [seed]);

  const handleExportCSV = () => {
    downloadFile(generateCSV(analysis.data), 'crammer_session_trace.csv', 'text/csv');
  };

  const handleExportLatex = () => {
    downloadFile(generateLatexTable(analysis), 'crammer_comparison.tex', 'text/plain');
  };

  const { sm2Results: sm2, calibratemeResults: cm, crashDetectionSession_sm2, crashDetectionSession_calibrateme } = analysis;

  return (
    <div className="crammer-crash-chart">
      <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0 }}>Crammer&apos;s Crash: SM-2 vs CalibrateMe</h3>
        <div>
          <button
            className="export-btn"
            onClick={() => setShowExports(!showExports)}
            style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            Export
          </button>
          {showExports && (
            <div style={{ position: 'absolute', right: 0, zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <button className="export-btn" onClick={handleExportCSV} style={{ display: 'block', marginBottom: '4px', cursor: 'pointer' }}>
                CSV Trace
              </button>
              <button className="export-btn" onClick={handleExportLatex} style={{ display: 'block', cursor: 'pointer' }}>
                LaTeX Table
              </button>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
        Profile: β*=0.30, λ=0.25, α=0.10 — high overconfidence, fast forgetting, slow learning
      </p>

      {/* Knowledge Tracking Chart */}
      <div className="chart-container" role="figure" aria-label="Knowledge tracking: K* vs K̂ estimates">
        <h4 className="chart-title">Knowledge Tracking (K* vs K̂)</h4>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={analysis.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="session" tick={{ fontSize: 12 }} tickLine={false} label={{ value: 'Session', position: 'insideBottom', offset: -2, fontSize: 12 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(v: number) => v.toFixed(1)} />
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}
              formatter={(value: number, name: string) => [value.toFixed(3), name]}
            />
            <Legend />
            <ReferenceLine y={0.9} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'Mastery', position: 'right', fontSize: 10 }} />
            {crashDetectionSession_calibrateme > 0 && (
              <ReferenceLine x={crashDetectionSession_calibrateme} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'CM detects', position: 'top', fontSize: 10 }} />
            )}
            {crashDetectionSession_sm2 > 0 && (
              <ReferenceLine x={crashDetectionSession_sm2} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'SM-2 detects', position: 'top', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="K_star" stroke="#1e293b" strokeWidth={3} dot={false} name="K* (True)" />
            <Line type="monotone" dataKey="K_hat_sm2" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" name="K̂ (SM-2)" />
            <Line type="monotone" dataKey="K_hat_calibrateme" stroke="#22c55e" strokeWidth={2} dot={false} name="K̂ (CalibrateMe)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Beta-hat Trajectory */}
      <div className="chart-container" role="figure" aria-label="Calibration bias trajectory" style={{ marginTop: '16px' }}>
        <h4 className="chart-title">Calibration Bias (β̂) Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={analysis.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="session" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(v: number) => v.toFixed(2)} />
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}
              formatter={(value: number) => [value.toFixed(3), 'β̂']}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <ReferenceLine y={0.15} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Overconfidence threshold', position: 'right', fontSize: 10 }} />
            <Area type="monotone" dataKey="beta_hat" fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={2} name="β̂ (observed)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ECE Comparison */}
      <div className="chart-container" role="figure" aria-label="ECE comparison" style={{ marginTop: '16px' }}>
        <h4 className="chart-title">Expected Calibration Error (ECE)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analysis.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="session" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis domain={[0, 0.5]} tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(v: number) => v.toFixed(2)} />
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}
              formatter={(value: number, name: string) => [value.toFixed(3), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="ece_sm2" stroke="#ef4444" strokeWidth={2} dot={false} name="ECE (SM-2)" />
            <Line type="monotone" dataKey="ece_calibrateme" stroke="#22c55e" strokeWidth={2} dot={false} name="ECE (CalibrateMe)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats Table */}
      <div style={{ marginTop: '16px', overflowX: 'auto' }}>
        <h4 className="chart-title">Summary Comparison</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Metric</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#ef4444' }}>SM-2</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#22c55e' }}>CalibrateMe</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 8px' }}>Retention (1-day)</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{sm2.retention_1day.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{cm.retention_1day.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', color: cm.retention_1day > sm2.retention_1day ? '#22c55e' : '#ef4444' }}>
                {((cm.retention_1day - sm2.retention_1day) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 8px' }}>Retention (7-day)</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{sm2.retention_7day.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{cm.retention_7day.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', color: cm.retention_7day > sm2.retention_7day ? '#22c55e' : '#ef4444' }}>
                {((cm.retention_7day - sm2.retention_7day) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 8px' }}>Retention (30-day)</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{sm2.retention_30day.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{cm.retention_30day.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', color: cm.retention_30day > sm2.retention_30day ? '#22c55e' : '#ef4444' }}>
                {((cm.retention_30day - sm2.retention_30day) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 8px' }}>Time to Mastery (sessions)</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{sm2.time_to_mastery}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{cm.time_to_mastery}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', color: cm.time_to_mastery < sm2.time_to_mastery ? '#22c55e' : '#ef4444' }}>
                {cm.time_to_mastery - sm2.time_to_mastery}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 8px' }}>Final ECE</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{sm2.final_ece.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>{cm.final_ece.toFixed(3)}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', color: cm.final_ece < sm2.final_ece ? '#22c55e' : '#ef4444' }}>
                {((cm.final_ece - sm2.final_ece) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Crash Detection</td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                {crashDetectionSession_sm2 > 0 ? `Session ${crashDetectionSession_sm2}` : 'Not detected'}
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                {crashDetectionSession_calibrateme > 0 ? `Session ${crashDetectionSession_calibrateme}` : 'Not detected'}
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px', color: '#22c55e', fontWeight: 'bold' }}>
                {crashDetectionSession_sm2 > 0 && crashDetectionSession_calibrateme > 0
                  ? `${crashDetectionSession_sm2 - crashDetectionSession_calibrateme} sessions earlier`
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrammerCrashChart;
