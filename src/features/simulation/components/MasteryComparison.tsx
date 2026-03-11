// =============================================================================
// Mastery Comparison Component (Task 4)
// Shows time-to-mastery and review efficiency across schedulers
// =============================================================================

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Clock } from 'lucide-react';
import { AblationResults } from '../../../simulation/ablationRunner';

interface MasteryComparisonProps {
  results: AblationResults;
}

const CONDITION_COLORS: Record<string, string> = {
  'Full CalibrateMe': '#6366F1',
  'No Dual-Process': '#8B5CF6',
  'No Scaffolding': '#A78BFA',
  'Calibration Only': '#C4B5FD',
  'SM-2 Baseline': '#EF4444',
  'BKT-Only': '#F59E0B',
};

export default function MasteryComparison({ results }: MasteryComparisonProps) {
  // Build chart data: one row per profile, one bar per condition
  const masteryData = useMemo(() => {
    return results.profiles.map(profile => {
      const row: Record<string, number | string> = { profile };
      for (const condition of results.conditions) {
        const entry = results.comparisons.find(
          c => c.profile === profile && c.condition === condition
        );
        if (entry) {
          row[`${condition}_mastery`] = +entry.time_to_mastery.mean.toFixed(1);
        }
      }
      return row;
    });
  }, [results]);

  const efficiencyData = useMemo(() => {
    return results.profiles.map(profile => {
      const row: Record<string, number | string> = { profile };
      for (const condition of results.conditions) {
        const entry = results.comparisons.find(
          c => c.profile === profile && c.condition === condition
        );
        if (entry) {
          row[`${condition}_eff`] = +entry.review_efficiency.mean.toFixed(1);
        }
      }
      return row;
    });
  }, [results]);

  // Only show key conditions to avoid clutter
  const keyConditions = ['Full CalibrateMe', 'SM-2 Baseline', 'BKT-Only'];

  return (
    <div className="mastery-comparison">
      <h3 className="mastery-comparison__title">
        <Clock size={18} /> Time-to-Mastery & Review Efficiency
      </h3>

      <div className="report-charts-row">
        <div className="report-chart card">
          <h4 className="report-chart__title">Sessions to Mastery (lower is better)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={masteryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="profile" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {keyConditions.map(condition => (
                <Bar
                  key={condition}
                  dataKey={`${condition}_mastery`}
                  name={condition}
                  fill={CONDITION_COLORS[condition] ?? '#999'}
                  radius={[0, 4, 4, 0]}
                  barSize={8}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-chart card">
          <h4 className="report-chart__title">Reviews per Mastered Item (lower is better)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={efficiencyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="profile" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {keyConditions.map(condition => (
                <Bar
                  key={condition}
                  dataKey={`${condition}_eff`}
                  name={condition}
                  fill={CONDITION_COLORS[condition] ?? '#999'}
                  radius={[0, 4, 4, 0]}
                  barSize={8}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
