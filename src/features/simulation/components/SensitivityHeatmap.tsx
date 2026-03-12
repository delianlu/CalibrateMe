// =============================================================================
// Sensitivity Heatmap Component
// Shows how CalibrateMe's advantage varies across parameter values
// =============================================================================

import { useMemo, useState, useCallback } from 'react';
import ExportableChart from '../../../components/ExportableChart';
import { Download, Thermometer } from 'lucide-react';
import { SensitivityReport, sensitivityToCSV } from '../../../simulation/sensitivityAnalysis';
import { downloadFile } from '../../../utils/export';

interface SensitivityHeatmapProps {
  reports: SensitivityReport[];
}

function advantageColor(value: number): string {
  if (value > 0.05) return 'rgba(16, 185, 129, 0.7)';  // strong green
  if (value > 0.02) return 'rgba(16, 185, 129, 0.35)';  // light green
  if (value > -0.02) return 'rgba(148, 163, 184, 0.2)'; // gray (near-zero)
  if (value > -0.05) return 'rgba(239, 68, 68, 0.25)';  // light red
  return 'rgba(239, 68, 68, 0.5)';                       // strong red
}

export default function SensitivityHeatmap({ reports }: SensitivityHeatmapProps) {
  const [selectedParam, setSelectedParam] = useState(0);
  const report = reports[selectedParam];

  const profiles = useMemo(() => report?.profiles ?? [], [report]);
  const values = useMemo(() => report?.values ?? [], [report]);

  // Build 2D grid: profiles × values
  const grid = useMemo(() => {
    if (!report) return [];
    return profiles.map(profile => {
      return values.map(value => {
        const entry = report.results.find(
          r => r.profile === profile && r.parameterValue === value
        );
        return entry ? entry.retention_advantage.mean : 0;
      });
    });
  }, [report, profiles, values]);

  const handleExport = useCallback(() => {
    if (report) {
      downloadFile(sensitivityToCSV(report), `sensitivity-${report.parameterName}.csv`, 'text/csv');
    }
  }, [report]);

  if (reports.length === 0) return null;

  return (
    <ExportableChart id="chart-sensitivity" title="sensitivity_heatmap">
    <div className="sensitivity-container">
      <div className="sensitivity__header">
        <h3 className="sensitivity__title">
          <Thermometer size={18} /> Sensitivity Analysis
        </h3>
        <div className="sensitivity__controls">
          <select
            className="form-select"
            value={selectedParam}
            onChange={e => setSelectedParam(Number(e.target.value))}
            style={{ maxWidth: 220 }}
            aria-label="Select parameter for sensitivity analysis"
          >
            {reports.map((r, i) => (
              <option key={r.parameterName} value={i}>
                {r.parameterName} ({r.nSeeds} seeds)
              </option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <p className="sensitivity__legend">
        Cell = CalibrateMe 7-day retention advantage over SM-2.{' '}
        <span style={{ color: 'rgba(16, 185, 129, 1)' }}>Green = positive</span>,{' '}
        <span style={{ color: 'rgba(239, 68, 68, 1)' }}>Red = negative</span>,{' '}
        <span style={{ color: 'var(--text-faint)' }}>Gray = near-zero</span>.
      </p>

      <div className="ablation-table-scroll">
        <table className="sensitivity-table" aria-label={`Sensitivity analysis for ${report?.parameterName ?? 'parameter'}`}>
          <thead>
            <tr>
              <th scope="col">Profile</th>
              {values.map(v => (
                <th scope="col" key={v}>{v.toFixed(v % 1 === 0 ? 0 : 2)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile, pi) => (
              <tr key={profile}>
                <td className="ablation-condition-name">{profile}</td>
                {grid[pi]?.map((adv, vi) => (
                  <td
                    key={vi}
                    className="sensitivity-cell"
                    style={{ background: advantageColor(adv) }}
                  >
                    {adv > 0 ? '+' : ''}{(adv * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </ExportableChart>
  );
}
