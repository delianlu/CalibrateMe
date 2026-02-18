// =============================================================================
// Dashboard Component (UPDATED)
// =============================================================================

import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { calculateCalibrationMetrics } from '../calibration/scoringModule';
import LearnerProfileSelector from './LearnerProfileSelector';
import SimulationControls from './SimulationControls';
import MetricsDisplay from './MetricsDisplay';
import CalibrationChart from './CalibrationChart';
import CalibrationCurve from './CalibrationCurve';
import ComparisonView from './ComparisonView';
import ResponseHistory from './ResponseHistory';
import ProgressBar from './ProgressBar';

const Dashboard: React.FC = () => {
  const {
    results,
    comparisonResults,
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
        {results && !isRunning && !comparisonResults && (
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
        {comparisonResults && !isRunning && (
          <ComparisonView results={comparisonResults} />
        )}

        {!results && !comparisonResults && !isRunning && !error && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            <h3 style={{ marginBottom: '1rem' }}>Welcome to CalibrateMe</h3>
            <p>Select a learner profile and click "Run Simulation" to see results.</p>
            <p>Or click "Compare Schedulers" to compare CalibrateMe against baselines.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
