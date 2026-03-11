// =============================================================================
// Ablation Table Component
// Displays multi-seed ablation results with CIs and effect sizes
// =============================================================================

import { useMemo, useCallback } from 'react';
import { Download, FlaskConical } from 'lucide-react';
import { AblationResults, ablationToCSV } from '../../../simulation/ablationRunner';
import { StatisticalResult, EffectSize } from '../../../simulation/statisticalAnalysis';
import { downloadFile } from '../../../utils/export';

interface AblationTableProps {
  results: AblationResults;
}

function effectColor(es: EffectSize | null): string {
  if (!es) return 'inherit';
  switch (es.interpretation) {
    case 'large': return 'var(--color-success)';
    case 'medium': return 'var(--color-warning)';
    case 'small': return 'var(--color-info, #3B82F6)';
    default: return 'var(--text-faint)';
  }
}

function StatCell({ stat, pct }: { stat: StatisticalResult; pct?: boolean }) {
  const factor = pct ? 100 : 1;
  const suffix = pct ? '%' : '';
  return (
    <td className="ablation-stat-cell">
      <span className="ablation-stat-cell__mean">
        {(stat.mean * factor).toFixed(1)}{suffix}
      </span>
      <span className="ablation-stat-cell__ci">
        [{(stat.ci95_lower * factor).toFixed(1)}, {(stat.ci95_upper * factor).toFixed(1)}]
      </span>
    </td>
  );
}

function EffectCell({ effect }: { effect: EffectSize | null }) {
  if (!effect) return <td>—</td>;
  return (
    <td style={{ color: effectColor(effect), fontWeight: 600 }}>
      {effect.cohens_d.toFixed(2)}{' '}
      <span style={{ fontSize: '0.7em', opacity: 0.8 }}>({effect.interpretation})</span>
    </td>
  );
}

export default function AblationTable({ results }: AblationTableProps) {
  // Group by profile for display
  const groupedByProfile = useMemo(() => {
    const grouped = new Map<string, typeof results.comparisons>();
    for (const c of results.comparisons) {
      if (!grouped.has(c.profile)) grouped.set(c.profile, []);
      grouped.get(c.profile)!.push(c);
    }
    return grouped;
  }, [results]);

  const handleExport = useCallback(() => {
    downloadFile(ablationToCSV(results), 'ablation-results.csv', 'text/csv');
  }, [results]);

  return (
    <div className="ablation-table-container">
      <div className="ablation-table__header">
        <h3 className="ablation-table__title">
          <FlaskConical size={18} /> Ablation Analysis
          <span className="ablation-table__subtitle">
            {results.nSeeds} seeds per condition · {results.profiles.length} profiles · {results.conditions.length} conditions
          </span>
        </h3>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {Array.from(groupedByProfile.entries()).map(([profile, comparisons]) => (
        <div key={profile} className="ablation-profile-block">
          <h4 className="ablation-profile-block__title">{profile}</h4>
          <div className="ablation-table-scroll">
            <table className="ablation-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>7-Day Retention</th>
                  <th>Final ECE</th>
                  <th>Time to Mastery</th>
                  <th>Review Efficiency</th>
                  <th>d (Ret vs SM-2)</th>
                  <th>d (ECE vs SM-2)</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(c => (
                  <tr key={c.condition} className={c.condition === 'Full CalibrateMe' ? 'ablation-row--highlight' : ''}>
                    <td className="ablation-condition-name">{c.condition}</td>
                    <StatCell stat={c.retention_7day} pct />
                    <StatCell stat={c.ece} pct />
                    <td>
                      {c.time_to_mastery.mean.toFixed(1)}
                      <span className="ablation-stat-cell__ci"> ±{c.time_to_mastery.sd.toFixed(1)}</span>
                    </td>
                    <td>
                      {c.review_efficiency.mean.toFixed(1)}
                      <span className="ablation-stat-cell__ci"> ±{c.review_efficiency.sd.toFixed(1)}</span>
                    </td>
                    <EffectCell effect={c.vs_sm2_retention} />
                    <EffectCell effect={c.vs_sm2_ece} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
