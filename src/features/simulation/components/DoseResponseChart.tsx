// =============================================================================
// Dose-Response Chart Component
// Shows how scaffolding δ affects outcomes across profiles
// =============================================================================

import { useMemo, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Download, Sliders } from 'lucide-react';
import { DeltaSweepReport, deltaSweepToCSV } from '../../../simulation/deltaSweep';
import { PROFILE_PARAMS } from '../../../profiles/learnerProfiles';
import { downloadFile } from '../../../utils/export';

interface DoseResponseChartProps {
  report: DeltaSweepReport;
}

type MetricKey = 'retention_7day' | 'final_ece' | 'time_to_mastery' | 'scaffold_count';

const METRIC_OPTIONS: { key: MetricKey; label: string; pct: boolean }[] = [
  { key: 'retention_7day', label: '7-Day Retention', pct: true },
  { key: 'final_ece', label: 'Final ECE', pct: true },
  { key: 'time_to_mastery', label: 'Time to Mastery (sessions)', pct: false },
  { key: 'scaffold_count', label: 'Total Scaffolds', pct: false },
];

const CAL_COLORS: Record<string, string> = {
  OVERCONFIDENT: '#EF4444',
  UNDERCONFIDENT: '#3B82F6',
  WELL_CALIBRATED: '#10B981',
};

function getCalColor(profile: string): string {
  const params = PROFILE_PARAMS[profile];
  if (!params) return '#6366F1';
  return CAL_COLORS[params.calibration] ?? '#6366F1';
}

export default function DoseResponseChart({ report }: DoseResponseChartProps) {
  const [metric, setMetric] = useState<MetricKey>('retention_7day');
  const metricInfo = METRIC_OPTIONS.find(m => m.key === metric)!;

  // Group profiles by calibration type for cleaner display
  const [groupBy, setGroupBy] = useState<'all' | 'calibration'>('calibration');

  // Build chart data: one row per delta, one column per profile
  const chartData = useMemo(() => {
    return report.deltas.map(delta => {
      const row: Record<string, number | string> = { delta: delta.toFixed(2) };
      for (const profile of report.profiles) {
        const entry = report.results.find(
          r => r.delta === delta && r.profile === profile
        );
        if (entry) {
          const val = entry[metric].mean;
          row[profile] = metricInfo.pct ? +(val * 100).toFixed(2) : +val.toFixed(2);
        }
      }
      return row;
    });
  }, [report, metric, metricInfo]);

  // When grouping by calibration type, average profiles of same type
  const aggregatedData = useMemo(() => {
    if (groupBy !== 'calibration') return null;

    const calTypes = ['OVERCONFIDENT', 'UNDERCONFIDENT', 'WELL_CALIBRATED'];
    return report.deltas.map(delta => {
      const row: Record<string, number | string> = { delta: delta.toFixed(2) };
      for (const calType of calTypes) {
        const matchingProfiles = report.profiles.filter(
          p => PROFILE_PARAMS[p]?.calibration === calType
        );
        const values = matchingProfiles.map(p => {
          const entry = report.results.find(
            r => r.delta === delta && r.profile === p
          );
          return entry ? entry[metric].mean : 0;
        });
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        row[calType] = metricInfo.pct ? +(avg * 100).toFixed(2) : +avg.toFixed(2);
      }
      return row;
    });
  }, [report, metric, metricInfo, groupBy]);

  const handleExport = useCallback(() => {
    downloadFile(deltaSweepToCSV(report), 'delta-sweep.csv', 'text/csv');
  }, [report]);

  const displayData = groupBy === 'calibration' ? aggregatedData! : chartData;

  return (
    <div className="dose-response-container">
      <div className="dose-response__header">
        <h3 className="dose-response__title">
          <Sliders size={18} /> Scaffolding Dose-Response (δ Sweep)
        </h3>
        <div className="dose-response__controls">
          <select
            className="form-select"
            value={metric}
            onChange={e => setMetric(e.target.value as MetricKey)}
            style={{ maxWidth: 200 }}
          >
            {METRIC_OPTIONS.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as 'all' | 'calibration')}
            style={{ maxWidth: 170 }}
          >
            <option value="calibration">Group by Calibration</option>
            <option value="all">All Profiles</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
          <XAxis
            dataKey="delta"
            label={{ value: 'δ (scaffolding rate)', position: 'insideBottom', offset: -5, fontSize: 12 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {groupBy === 'calibration' ? (
            <>
              <Line type="monotone" dataKey="OVERCONFIDENT" name="Overconfident" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="UNDERCONFIDENT" name="Underconfident" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="WELL_CALIBRATED" name="Well-Calibrated" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </>
          ) : (
            report.profiles.map(profile => (
              <Line
                key={profile}
                type="monotone"
                dataKey={profile}
                stroke={getCalColor(profile)}
                strokeWidth={1.5}
                dot={{ r: 2 }}
              />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>

      <p className="dose-response__note">
        {report.nSeeds} seeds per point · δ = 0.00 is the no-scaffolding baseline
      </p>
    </div>
  );
}
