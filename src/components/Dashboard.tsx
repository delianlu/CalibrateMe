// =============================================================================
// Dashboard Component (UPDATED)
// =============================================================================

import React, { useState, Suspense } from 'react';
import { FileText, ArrowLeft, FlaskConical, Thermometer, Sliders, User, Settings } from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';
import { useAdvancedAnalyticsStore } from '../store/advancedAnalyticsStore';
import { calculateCalibrationMetrics } from '../calibration/scoringModule';
import { SchedulerType } from '../types';
import { DEFAULT_SWEEPS } from '../simulation/sensitivityAnalysis';
import LearnerProfileSelector from './LearnerProfileSelector';
import SimulationControls from './SimulationControls';
import MetricsDisplay from './MetricsDisplay';
import CalibrationChart from './CalibrationChart';
import CalibrationCurve from './CalibrationCurve';
import ComparisonView from './ComparisonView';
import HypothesisResults from './HypothesisResults';
import ResponseHistory from './ResponseHistory';
import ProgressBar from './ProgressBar';
import ExportableChart from './ExportableChart';
import CrammerCrashChart from './CrammerCrashChart';
import DomainCalibrationChart from './DomainCalibrationChart';

// Lazy-load heavy components only used in specific views
const FinalReport = React.lazy(() => import('../features/analytics/components/FinalReport'));
const AblationTable = React.lazy(() => import('../features/simulation/components/AblationTable'));
const SensitivityHeatmap = React.lazy(() => import('../features/simulation/components/SensitivityHeatmap'));
const DoseResponseChart = React.lazy(() => import('../features/simulation/components/DoseResponseChart'));
const MasteryComparison = React.lazy(() => import('../features/simulation/components/MasteryComparison'));

type DashboardView = 'main' | 'report' | 'advanced';
type ResultsTab = 'overview' | 'hypotheses' | 'charts' | 'advanced';

const Dashboard: React.FC = () => {
  const [view, setView] = useState<DashboardView>('main');
  const [selectedSweep, setSelectedSweep] = useState(0);
  const [resultsTab, setResultsTab] = useState<ResultsTab>('overview');

  const simStore = useSimulationStore();
  const advStore = useAdvancedAnalyticsStore();

  const {
    profile,
    results,
    comparisonResults,
    hypothesisResults,
    isRunning: simRunning,
    error: simError,
    progress: simProgress,
    progressMessage: simProgressMessage,
  } = simStore;

  const {
    ablationResults,
    sensitivityReports,
    deltaSweepReport,
    isRunning: advRunning,
    progress: advProgress,
    progressMessage: advProgressMessage,
    error: advError,
  } = advStore;

  const isRunning = simRunning || advRunning;
  const error = simError || advError;

  // Calculate calibration bins from session data for calibration curve
  const calibrationBins = React.useMemo(() => {
    if (!results) return [];
    const mockResponses = results.session_data.flatMap(session => {
      return Array(session.items_reviewed).fill(null).map((_, i) => ({
        item_id: `${session.session_number}-${i}`,
        correctness: i < session.correct_count,
        confidence: session.mean_confidence + (Math.random() - 0.5) * 0.2,
        response_time: session.mean_rt,
        timestamp: new Date(),
      }));
    });
    return calculateCalibrationMetrics(mockResponses).bin_data;
  }, [results]);

  const baselineResults = React.useMemo(() => {
    if (!comparisonResults) return undefined;
    return comparisonResults.get(SchedulerType.SM2);
  }, [comparisonResults]);

  // --- Report View ---
  if (view === 'report' && results && profile) {
    return (
      <div className="dashboard">
        <div className="dashboard-sidebar">
          <LearnerProfileSelector />
          <SimulationControls />
        </div>
        <div className="dashboard-content">
          <button className="btn btn-secondary btn-sm" onClick={() => setView('main')} style={{ marginBottom: '1rem' }}>
            <ArrowLeft size={14} /> Back to Results
          </button>
          <Suspense fallback={<div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Loading report...</div>}>
            <FinalReport results={results} params={profile.params} baselineResults={baselineResults} />
          </Suspense>
        </div>
      </div>
    );
  }

  // --- Advanced Analytics View ---
  if (view === 'advanced') {
    return (
      <div className="dashboard">
        <div className="dashboard-sidebar">
          <LearnerProfileSelector />
          <div className="card">
            <h3 className="card-title">Advanced Analytics</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                className="btn btn-primary btn-block"
                onClick={() => advStore.runAblation(30)}
                disabled={isRunning}
                style={{ background: '#6366F1' }}
              >
                <FlaskConical size={14} /> {advRunning ? 'Running...' : 'Run Ablation (30 seeds)'}
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-select"
                  value={selectedSweep}
                  onChange={e => setSelectedSweep(Number(e.target.value))}
                  disabled={isRunning}
                  style={{ flex: 1 }}
                >
                  {DEFAULT_SWEEPS.map((s, i) => (
                    <option key={s.parameterName} value={i}>{s.parameterName}</option>
                  ))}
                </select>
                <button
                  className="btn btn-secondary"
                  onClick={() => advStore.runSensitivity(DEFAULT_SWEEPS[selectedSweep], 10)}
                  disabled={isRunning}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Thermometer size={14} /> Sweep
                </button>
              </div>

              <button
                className="btn btn-secondary btn-block"
                onClick={() => advStore.runDeltaSweep(15)}
                disabled={isRunning}
                style={{ background: '#D97706', color: 'white' }}
              >
                <Sliders size={14} /> Run δ Dose-Response
              </button>

              <button className="btn btn-secondary btn-block" onClick={() => setView('main')} disabled={isRunning}>
                <ArrowLeft size={14} /> Back to Sim Lab
              </button>

              <button className="btn btn-secondary btn-block" onClick={advStore.reset} disabled={isRunning}>
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {error && (
            <div className="card" style={{ background: '#fed7d7', color: '#822727' }}>
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {advRunning && (
            <div className="card" style={{ padding: '2rem' }}>
              <ProgressBar progress={advProgress} message={advProgressMessage} />
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={advStore.cancel}
                  style={{ background: '#e53e3e', color: 'white' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!advRunning && !ablationResults && !deltaSweepReport && sensitivityReports.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 3rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Sliders size={32} style={{ color: '#6366F1' }} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Advanced Analytics</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.7 }}>Run multi-seed ablation studies, parameter sensitivity sweeps, and δ dose-response analyses.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>Results include 95% confidence intervals and Cohen&apos;s d effect sizes.</p>
            </div>
          )}

          <Suspense fallback={<div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
          {ablationResults && !advRunning && (
            <>
              <AblationTable results={ablationResults} />
              <div style={{ marginTop: '1.5rem' }}>
                <MasteryComparison results={ablationResults} />
              </div>
            </>
          )}

          {sensitivityReports.length > 0 && !advRunning && (
            <div style={{ marginTop: '1.5rem' }}>
              <SensitivityHeatmap reports={sensitivityReports} />
            </div>
          )}

          {deltaSweepReport && !advRunning && (
            <div style={{ marginTop: '1.5rem' }}>
              <DoseResponseChart report={deltaSweepReport} />
            </div>
          )}
          </Suspense>
        </div>
      </div>
    );
  }

  // --- Main View ---
  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <LearnerProfileSelector />
        <SimulationControls />
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="card" style={{ background: '#fed7d7', color: '#822727' }}>
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {simRunning && (
          <div className="card" style={{ padding: '2rem' }}>
            <ProgressBar progress={simProgress} message={simProgressMessage} />
          </div>
        )}

        {/* Single Simulation Results */}
        {results && !simRunning && !comparisonResults && !hypothesisResults && (
          <>
            {/* Header badges + actions */}
            <div className="sim-results__header">
              {profile && (
                <span className="sim-results__badge sim-results__badge--profile">
                  <User size={12} /> {profile.name}
                </span>
              )}
              <span className="sim-results__badge sim-results__badge--scheduler">
                <Settings size={12} /> {results.config.scheduler_type}
              </span>
              <div style={{ flex: 1 }} />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => window.open(`${window.location.pathname}?splitscreen=true`, '_blank')}
                style={{ background: '#6366f1', color: 'white' }}
              >
                Split-Screen Demo
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setView('advanced')}>
                <FlaskConical size={14} /> Advanced Analytics
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setView('report')}>
                <FileText size={14} /> View Full Report
              </button>
            </div>

            {/* Tabbed sub-navigation */}
            <div className="sim-results__tabs">
              {(['overview', 'charts', 'advanced'] as const).map(t => (
                <button
                  key={t}
                  className={`sim-results__tab ${resultsTab === t ? 'sim-results__tab--active' : ''}`}
                  onClick={() => setResultsTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {resultsTab === 'overview' && (
              <>
                <MetricsDisplay results={results} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <CalibrationChart
                    title="Knowledge Trajectory"
                    data={results.K_star_trajectory.map((k, i) => ({
                      session: i + 1,
                      'True (K*)': k,
                      'Belief (K̂)': results.K_hat_trajectory[i],
                    }))}
                    dataKeys={['True (K*)', 'Belief (K̂)']}
                    colors={['#38a169', '#4299e1']}
                  />
                  <CalibrationChart
                    title="Calibration Error Over Time"
                    data={results.ece_trajectory.map((e, i) => ({
                      session: i + 1,
                      ECE: e,
                      Brier: results.brier_trajectory[i],
                    }))}
                    dataKeys={['ECE', 'Brier']}
                    colors={['#e53e3e', '#ed8936']}
                  />
                </div>
              </>
            )}

            {resultsTab === 'charts' && (
              <>
                {calibrationBins.length > 0 && (
                  <ExportableChart id="chart-calibration-curve" title="calibration_curve">
                    <CalibrationCurve
                      bins={calibrationBins}
                      title="Calibration Curve (Confidence vs Accuracy)"
                    />
                  </ExportableChart>
                )}

                <ResponseHistory sessionData={results.session_data} />

                {/* Crammer Crash Analysis — shown when Crammer profile is selected */}
                {profile?.id === 'Crammer' && (
                  <ExportableChart id="chart-crammer-crash" title="crammer_crash_analysis">
                    <CrammerCrashChart seed={results.config.random_seed ?? 42} />
                  </ExportableChart>
                )}

                {/* Domain-Split Calibration — shown when domain split is enabled */}
                {results.config.enable_domain_split && (
                  <ExportableChart id="chart-domain-calibration" title="domain_calibration">
                    <DomainCalibrationChart results={results} />
                  </ExportableChart>
                )}
              </>
            )}

            {resultsTab === 'advanced' && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <FlaskConical size={32} style={{ color: 'var(--color-primary-500)', marginBottom: 12 }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Use the <strong>Advanced Analytics</strong> button above for ablation studies, sensitivity sweeps, and dose-response analyses.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setView('advanced')}>
                  <FlaskConical size={14} /> Open Advanced Analytics
                </button>
              </div>
            )}
          </>
        )}

        {/* Comparison Results */}
        {comparisonResults && !simRunning && !hypothesisResults && (
          <ComparisonView results={comparisonResults} />
        )}

        {/* Hypothesis Test Results */}
        {hypothesisResults && !simRunning && (
          <HypothesisResults resultsByProfile={hypothesisResults} />
        )}

        {!results && !comparisonResults && !hypothesisResults && !simRunning && !error && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 3rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <FlaskConical size={32} style={{ color: '#6366F1' }} />
            </div>
            <h3 style={{ marginBottom: '0.75rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Simulation Lab</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.7 }}>Select a learner profile and click &ldquo;Run Simulation&rdquo; to see results.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>Compare schedulers or run hypothesis tests to evaluate H1/H2/H3 across all 9 profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
