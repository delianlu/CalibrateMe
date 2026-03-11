// =============================================================================
// Dashboard Component (UPDATED)
// =============================================================================

import React, { useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';
import { calculateCalibrationMetrics } from '../calibration/scoringModule';
import { SchedulerType } from '../types';
import LearnerProfileSelector from './LearnerProfileSelector';
import SimulationControls from './SimulationControls';
import MetricsDisplay from './MetricsDisplay';
import CalibrationChart from './CalibrationChart';
import CalibrationCurve from './CalibrationCurve';
import ComparisonView from './ComparisonView';
import HypothesisResults from './HypothesisResults';
import ResponseHistory from './ResponseHistory';
import ProgressBar from './ProgressBar';
import FinalReport from '../features/analytics/components/FinalReport';

const Dashboard: React.FC = () => {
  const [showReport, setShowReport] = useState(false);
  const {
    profile,
    results,
    comparisonResults,
    hypothesisResults,
    isRunning,
    error,
    progress,
    progressMessage,
  } = useSimulationStore();

  // Calculate calibration bins from session data for calibration curve
  const calibrationBins = React.useMemo(() => {
    if (!results) return [];

    // Aggregate all responses across sessions for binning
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

  // Get baseline (SM-2) results for comparison in the report
  const baselineResults = React.useMemo(() => {
    if (!comparisonResults) return undefined;
    return comparisonResults.get(SchedulerType.SM2);
  }, [comparisonResults]);

  // Show full report view
  if (showReport && results && profile) {
    return (
      <div className="dashboard">
        <div className="dashboard-sidebar">
          <LearnerProfileSelector />
          <SimulationControls />
        </div>
        <div className="dashboard-content">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowReport(false)}
            style={{ marginBottom: '1rem' }}
          >
            <ArrowLeft size={14} /> Back to Results
          </button>
          <FinalReport
            results={results}
            params={profile.params}
            baselineResults={baselineResults}
          />
        </div>
      </div>
    );
  }

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

        {isRunning && (
          <div className="card" style={{ padding: '2rem' }}>
            <ProgressBar progress={progress} message={progressMessage} />
          </div>
        )}

        {/* Single Simulation Results */}
        {results && !isRunning && !comparisonResults && !hypothesisResults && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowReport(true)}
              >
                <FileText size={14} /> View Full Report
              </button>
            </div>

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

            {calibrationBins.length > 0 && (
              <CalibrationCurve
                bins={calibrationBins}
                title="Calibration Curve (Confidence vs Accuracy)"
              />
            )}

            <ResponseHistory sessionData={results.session_data} />
          </>
        )}

        {/* Comparison Results */}
        {comparisonResults && !isRunning && !hypothesisResults && (
          <ComparisonView results={comparisonResults} />
        )}

        {/* Hypothesis Test Results */}
        {hypothesisResults && !isRunning && (
          <HypothesisResults resultsByProfile={hypothesisResults} />
        )}

        {!results && !comparisonResults && !hypothesisResults && !isRunning && !error && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            <h3 style={{ marginBottom: '1rem' }}>Welcome to CalibrateMe</h3>
            <p>Select a learner profile and click "Run Simulation" to see results.</p>
            <p>Or click "Compare Schedulers" to compare CalibrateMe against baselines.</p>
            <p>Or click "Run Hypothesis Tests" to evaluate H1/H2/H3 across all 9 profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
