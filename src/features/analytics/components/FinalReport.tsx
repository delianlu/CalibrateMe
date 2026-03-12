// =============================================================================
// Final Report Component
// Unified analytical view synthesizing all available metrics
// =============================================================================

import { useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
  FileText, TrendingUp, TrendingDown, Minus, Brain, Target,
  Zap, Shield, AlertTriangle, CheckCircle, Download, ChevronRight,
  Award, Clock, BarChart3, Activity,
} from 'lucide-react';
import { SimulationResults, LearnerProfileParams } from '../../../types';
import { analyzeLongitudinal, LongitudinalReport } from '../longitudinalAnalysis';
import { analyzePatterns, PatternReport } from '../patternAnalysis';
import { analyzeLearnerInsights, LearnerInsightsReport } from '../learnerInsights';
import { analyzeScaffoldingImpact, ScaffoldingReport } from '../scaffoldingImpact';
import HeuristicTooltip from '../../../components/HeuristicTooltip';
import { exportToCSV, downloadFile } from '../../../utils/export';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FinalReportProps {
  results: SimulationResults;
  params: LearnerProfileParams;
  baselineResults?: SimulationResults;
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function TrendIcon({ direction }: { direction: 'improving' | 'declining' | 'stable' }) {
  if (direction === 'improving') return <TrendingUp size={16} className="trend-icon trend-icon--up" />;
  if (direction === 'declining') return <TrendingDown size={16} className="trend-icon trend-icon--down" />;
  return <Minus size={16} className="trend-icon trend-icon--flat" />;
}

function RatingBadge({ rating }: { rating: 'low' | 'average' | 'high' }) {
  const cls = `rating-badge rating-badge--${rating}`;
  return <span className={cls}>{rating}</span>;
}

// --- Section: Executive Summary ---
function ExecutiveSummary({
  results,
  longitudinal,
  insights,
}: {
  results: SimulationResults;
  longitudinal: LongitudinalReport;
  insights: LearnerInsightsReport;
}) {
  const finalSession = results.session_data[results.session_data.length - 1];
  const mastered = results.time_to_mastery < results.config.num_sessions;

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Award size={18} /> Executive Summary
      </h3>
      <div className="report-summary-card">
        <div className="report-summary-card__archetype">
          <span className="report-summary-card__archetype-label">Learner Archetype <HeuristicTooltip label="Archetype is a heuristic label based on estimated parameters (α, β*, λ). It summarizes tendencies, not a diagnosis." /></span>
          <span className="report-summary-card__archetype-value">{insights.archetype}</span>
        </div>
        <p className="report-summary-card__text">{longitudinal.summary}</p>
        <div className="report-summary-card__grid">
          <div className="report-metric-tile">
            <span className="report-metric-tile__value">
              {((finalSession?.mean_K_star ?? 0) * 100).toFixed(0)}%
            </span>
            <span className="report-metric-tile__label">Final Knowledge</span>
          </div>
          <div className="report-metric-tile">
            <span className="report-metric-tile__value">
              {((finalSession?.ece ?? 0) * 100).toFixed(1)}%
            </span>
            <span className="report-metric-tile__label">Final ECE</span>
          </div>
          <div className="report-metric-tile">
            <span className="report-metric-tile__value">
              {mastered ? `Session ${results.time_to_mastery}` : 'Not yet'}
            </span>
            <span className="report-metric-tile__label">Mastery</span>
          </div>
          <div className="report-metric-tile">
            <span className="report-metric-tile__value">
              {(results.retention_30day * 100).toFixed(0)}%
            </span>
            <span className="report-metric-tile__label">30-Day Retention</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Section: Trajectory Charts ---
function TrajectoryCharts({ results, longitudinal }: { results: SimulationResults; longitudinal: LongitudinalReport }) {
  const chartData = results.session_data.map((s, i) => ({
    session: i + 1,
    K_star: +(s.mean_K_star * 100).toFixed(1),
    K_hat: +(s.mean_K_hat * 100).toFixed(1),
    accuracy: +(s.items_reviewed > 0 ? (s.correct_count / s.items_reviewed) * 100 : 0).toFixed(1),
    ece: +(s.ece * 100).toFixed(1),
    brier: +(s.brier * 100).toFixed(1),
  }));

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Activity size={18} /> Learning Trajectories
      </h3>
      <div className="report-charts-row">
        <div className="report-chart card">
          <h4 className="report-chart__title">
            Knowledge & Accuracy
            <TrendIcon direction={longitudinal.knowledgeTrend.direction} />
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
              <XAxis dataKey="session" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="K_star" name="True K*" stroke="#6366F1" fill="#6366F133" strokeWidth={2} />
              <Area type="monotone" dataKey="K_hat" name="Estimated K̂" stroke="#8B5CF6" fill="#8B5CF633" strokeWidth={1.5} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#10B981" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="report-chart card">
          <h4 className="report-chart__title">
            Calibration (ECE & Brier)
            <TrendIcon direction={longitudinal.eceTrend.direction} />
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
              <XAxis dataKey="session" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ece" name="ECE %" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="brier" name="Brier %" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
              <ReferenceLine y={10} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Good', fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// --- Section: Learning Velocity ---
function LearningVelocitySection({ longitudinal }: { longitudinal: LongitudinalReport }) {
  const lv = longitudinal.learningVelocity;
  const phaseColors: Record<string, string> = {
    'early-learning': '#F59E0B',
    'rapid-growth': '#10B981',
    'plateau': '#6366F1',
    'mastered': '#22C55E',
  };

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Zap size={18} /> Learning Velocity
      </h3>
      <div className="report-velocity-grid">
        <div className="report-metric-card">
          <Clock size={16} />
          <span className="report-metric-card__label">Sessions to 80% Accuracy</span>
          <span className="report-metric-card__value">
            {lv.sessionsTo80Accuracy !== null ? lv.sessionsTo80Accuracy : '—'}
          </span>
        </div>
        <div className="report-metric-card">
          <Target size={16} />
          <span className="report-metric-card__label">Sessions to Good Calibration</span>
          <span className="report-metric-card__value">
            {lv.sessionsToGoodCalibration !== null ? lv.sessionsToGoodCalibration : '—'}
          </span>
        </div>
        <div className="report-metric-card">
          <TrendingUp size={16} />
          <span className="report-metric-card__label">Knowledge Gain/Session</span>
          <span className="report-metric-card__value">
            {lv.knowledgeGainRate > 0 ? '+' : ''}{(lv.knowledgeGainRate * 100).toFixed(2)}%
          </span>
        </div>
        <div className="report-metric-card">
          <Brain size={16} />
          <span className="report-metric-card__label">Current Phase <HeuristicTooltip label="Phase classification uses heuristic K* thresholds (mastered ≥ 0.90, novice < 0.40). These cut-offs are researcher-chosen." /></span>
          <span
            className="report-metric-card__value"
            style={{ color: phaseColors[lv.currentPhase] ?? 'inherit' }}
          >
            {lv.currentPhase.replace('-', ' ')}
          </span>
        </div>
      </div>
    </section>
  );
}

// --- Section: Pattern Analysis ---
function PatternSection({ patterns }: { patterns: PatternReport }) {
  const dp = patterns.dualProcess;

  const barData = patterns.confidenceBins
    .filter(b => b.count > 0)
    .map(b => ({
      bin: b.label,
      accuracy: +(b.accuracy * 100).toFixed(1),
      type1: +(b.type1Ratio * 100).toFixed(1),
      count: b.count,
    }));

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <BarChart3 size={18} /> Response Patterns
      </h3>
      <p className="report-section__insight">{patterns.insight}</p>

      <div className="report-charts-row">
        <div className="report-chart card">
          <h4 className="report-chart__title">Accuracy by Confidence Bin</h4>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
                <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: 32 }}>No bin data</p>
          )}
        </div>
        <div className="report-chart card">
          <h4 className="report-chart__title">Dual-Process Breakdown</h4>
          <div className="report-dual-process">
            <div className="report-dual-bar">
              <div
                className="report-dual-bar__type1"
                style={{ width: `${dp.type1Ratio * 100}%` }}
              />
            </div>
            <div className="report-dual-labels">
              <span><Zap size={12} /> Automatic: {(dp.type1Ratio * 100).toFixed(0)}%</span>
              <span><Brain size={12} /> Deliberate: {((1 - dp.type1Ratio) * 100).toFixed(0)}%</span>
            </div>
            <p className="report-dual-trend">
              Type 1 trend: <strong>{dp.type1Trend}</strong>
              {dp.automatizationSession && ` (first majority at session ${dp.automatizationSession})`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Section: Learner Parameters ---
function ParameterSection({ insights }: { insights: LearnerInsightsReport }) {
  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Brain size={18} /> Learner Parameters
      </h3>
      <div className="report-params-grid">
        {insights.parameters.map(p => (
          <div key={p.parameter} className="report-param-card card">
            <div className="report-param-card__header">
              <code className="report-param-card__name">{p.parameter}</code>
              <RatingBadge rating={p.rating} />
            </div>
            <span className="report-param-card__value">{p.value.toFixed(3)}</span>
            <span className="report-param-card__label">{p.label}</span>
            <p className="report-param-card__desc">{p.interpretation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Section: Strengths & Weaknesses ---
function StrengthsWeaknessesSection({ insights }: { insights: LearnerInsightsReport }) {
  if (insights.strengths.length === 0 && insights.weaknesses.length === 0) return null;

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Shield size={18} /> Strengths & Weaknesses
      </h3>
      <div className="report-sw-grid">
        {insights.strengths.length > 0 && (
          <div className="report-sw-col">
            <h4 className="report-sw-col__title report-sw-col__title--strength">
              <CheckCircle size={14} /> Strengths
            </h4>
            {insights.strengths.map((s, i) => (
              <div key={i} className="report-sw-item report-sw-item--strength">
                <strong>{s.area}</strong>
                <p>{s.evidence}</p>
              </div>
            ))}
          </div>
        )}
        {insights.weaknesses.length > 0 && (
          <div className="report-sw-col">
            <h4 className="report-sw-col__title report-sw-col__title--weakness">
              <AlertTriangle size={14} /> Areas for Improvement
            </h4>
            {insights.weaknesses.map((w, i) => (
              <div key={i} className="report-sw-item report-sw-item--weakness">
                <strong>{w.area}</strong>
                <p>{w.evidence}</p>
                {w.recommendation && (
                  <p className="report-sw-item__rec">
                    <ChevronRight size={12} /> {w.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// --- Section: Scaffolding Impact ---
function ScaffoldingSection({ scaffolding }: { scaffolding: ScaffoldingReport }) {
  const eff = scaffolding.effectiveness;
  if (eff.totalScaffolds === 0) return null;

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Shield size={18} /> Scaffolding Impact
      </h3>
      <p className="report-section__insight">{scaffolding.summary}</p>
      <div className="report-scaffolding-grid">
        <div className="report-metric-card">
          <span className="report-metric-card__label">Total Scaffolds</span>
          <span className="report-metric-card__value">{eff.totalScaffolds}</span>
        </div>
        <div className="report-metric-card">
          <span className="report-metric-card__label">Rate / Session</span>
          <span className="report-metric-card__value">{eff.scaffoldRate.toFixed(1)}</span>
        </div>
        <div className="report-metric-card">
          <span className="report-metric-card__label">Trend</span>
          <span className="report-metric-card__value">{eff.scaffoldTrend}</span>
        </div>
        {eff.postScaffoldImprovement !== null && (
          <div className="report-metric-card">
            <span className="report-metric-card__label">Post-Scaffold Δ Accuracy</span>
            <span className="report-metric-card__value" style={{
              color: eff.postScaffoldImprovement > 0 ? 'var(--color-success)' : 'var(--color-error)',
            }}>
              {eff.postScaffoldImprovement > 0 ? '+' : ''}{(eff.postScaffoldImprovement * 100).toFixed(1)}pp
            </span>
          </div>
        )}
        {eff.biasReduction !== null && (
          <div className="report-metric-card">
            <span className="report-metric-card__label">Bias Reduction</span>
            <span className="report-metric-card__value" style={{
              color: eff.biasReduction > 0 ? 'var(--color-success)' : 'var(--color-error)',
            }}>
              {eff.biasReduction > 0 ? '−' : '+'}{(Math.abs(eff.biasReduction) * 100).toFixed(1)}pp
            </span>
          </div>
        )}
      </div>
      {scaffolding.phases.length > 0 && (
        <table className="report-phases-table">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Sessions</th>
              <th>Scaffolds/Session</th>
              <th>Mean ECE</th>
              <th>Mean Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {scaffolding.phases.map(p => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>{p.sessions}</td>
                <td>{p.scaffoldsPerSession.toFixed(1)}</td>
                <td>{(p.meanECE * 100).toFixed(1)}%</td>
                <td>{(p.meanAccuracy * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// --- Section: Comparative ---
function ComparisonSection({ insights }: { insights: LearnerInsightsReport }) {
  if (insights.comparisons.length === 0) return null;

  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <BarChart3 size={18} /> Scheduler Comparison
      </h3>
      <table className="report-comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>CalibrateMe</th>
            <th>Baseline</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {insights.comparisons.map(c => (
            <tr key={c.metric}>
              <td>{c.metric}</td>
              <td>{(c.calibrateMeValue * (c.metric.includes('Retention') ? 100 : 1)).toFixed(1)}{c.metric.includes('Retention') ? '%' : ''}</td>
              <td>{(c.baselineValue * (c.metric.includes('Retention') ? 100 : 1)).toFixed(1)}{c.metric.includes('Retention') ? '%' : ''}</td>
              <td style={{ color: c.improvement > 0 ? 'var(--color-success)' : c.improvement < 0 ? 'var(--color-error)' : 'inherit' }}>
                {c.improvementPct > 0 ? '+' : ''}{c.improvementPct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// --- Section: Recommendations ---
function RecommendationsSection({ insights }: { insights: LearnerInsightsReport }) {
  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Target size={18} /> Recommendations
      </h3>
      <ul className="report-recommendations">
        {insights.recommendations.map((r, i) => (
          <li key={i}>
            <ChevronRight size={14} />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Section: Session Quality ---
function SessionQualitySection({ longitudinal }: { longitudinal: LongitudinalReport }) {
  const sq = longitudinal.sessionQuality;
  return (
    <section className="report-section">
      <h3 className="report-section__title">
        <Activity size={18} /> Session Quality
      </h3>
      <div className="report-quality-grid">
        <div className="report-metric-card">
          <span className="report-metric-card__label">Accuracy Consistency</span>
          <span className="report-metric-card__value">
            {sq.accuracyConsistency < 0.15 ? 'High' : sq.accuracyConsistency < 0.30 ? 'Moderate' : 'Low'}
          </span>
          <span className="report-metric-card__sub">CV = {sq.accuracyConsistency.toFixed(2)}</span>
        </div>
        <div className="report-metric-card">
          <span className="report-metric-card__label">Regression Sessions</span>
          <span className="report-metric-card__value">{sq.regressionSessions.length}</span>
          {sq.regressionSessions.length > 0 && (
            <span className="report-metric-card__sub">
              Sessions {sq.regressionSessions.join(', ')}
            </span>
          )}
        </div>
        <div className="report-metric-card">
          <span className="report-metric-card__label">Breakout Sessions</span>
          <span className="report-metric-card__value">{sq.breakoutSessions.length}</span>
          {sq.breakoutSessions.length > 0 && (
            <span className="report-metric-card__sub">
              Sessions {sq.breakoutSessions.join(', ')}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function FinalReport({ results, params, baselineResults }: FinalReportProps) {
  // Run all analyses
  const longitudinal = useMemo(() => analyzeLongitudinal(results), [results]);
  const patterns = useMemo(() => analyzePatterns(results.session_data), [results]);
  const insights = useMemo(
    () => analyzeLearnerInsights(results, params, baselineResults),
    [results, params, baselineResults]
  );
  const scaffolding = useMemo(
    () => analyzeScaffoldingImpact(results.session_data),
    [results]
  );

  // Export handler
  const handleExport = useCallback(() => {
    const reportData = {
      generated: new Date().toISOString(),
      profile: results.profile_id,
      scheduler: results.scheduler_type,
      config: results.config,
      longitudinal,
      patterns,
      insights,
      scaffolding,
      results: {
        retention_1day: results.retention_1day,
        retention_7day: results.retention_7day,
        retention_30day: results.retention_30day,
        time_to_mastery: results.time_to_mastery,
        review_efficiency: results.review_efficiency,
      },
    };
    downloadFile(
      JSON.stringify(reportData, null, 2),
      `calibrateme-report-${results.profile_id}.json`,
      'application/json'
    );
  }, [results, longitudinal, patterns, insights, scaffolding]);

  const handleExportCSV = useCallback(() => {
    downloadFile(
      exportToCSV(results),
      `calibrateme-sessions-${results.profile_id}.csv`,
      'text/csv'
    );
  }, [results]);

  return (
    <div className="final-report">
      <div className="final-report__header">
        <div className="final-report__header-left">
          <FileText size={24} />
          <div>
            <h2 className="final-report__title">Final Analysis Report</h2>
            <p className="final-report__subtitle">
              {results.profile_id} · {results.scheduler_type} · {results.config.num_sessions} sessions
            </p>
          </div>
        </div>
        <div className="final-report__header-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            <Download size={14} /> Full Report
          </button>
        </div>
      </div>

      <ExecutiveSummary results={results} longitudinal={longitudinal} insights={insights} />
      <TrajectoryCharts results={results} longitudinal={longitudinal} />
      <LearningVelocitySection longitudinal={longitudinal} />
      <PatternSection patterns={patterns} />
      <ParameterSection insights={insights} />
      <StrengthsWeaknessesSection insights={insights} />
      <ScaffoldingSection scaffolding={scaffolding} />
      <ComparisonSection insights={insights} />
      <SessionQualitySection longitudinal={longitudinal} />
      <RecommendationsSection insights={insights} />
    </div>
  );
}
