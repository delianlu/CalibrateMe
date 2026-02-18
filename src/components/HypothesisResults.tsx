// =============================================================================
// Hypothesis Results Component
// Displays H1, H2, H3 test results
// =============================================================================

import React from 'react';
import { SimulationResults, SchedulerType } from '../types';
import { mean, cohensD } from '../utils/statistics';

interface HypothesisResultsProps {
  resultsByProfile: Map<string, Map<SchedulerType, SimulationResults[]>>;
}

interface HypothesisResult {
  hypothesis: string;
  description: string;
  supported: boolean;
  evidence: string;
  effectSize: number;
}

const HypothesisResults: React.FC<HypothesisResultsProps> = ({ resultsByProfile }) => {
  const hypotheses = analyzeHypotheses(resultsByProfile);

  return (
    <div className="card">
      <h3 className="card-title">Hypothesis Test Results</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {hypotheses.map((h, index) => (
          <div
            key={index}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: h.supported ? '#38a169' : '#e53e3e',
              background: h.supported ? '#f0fff4' : '#fff5f5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, color: h.supported ? '#22543d' : '#742a2a' }}>
                  {h.hypothesis}
                </h4>
                <p style={{ margin: '0.5rem 0', color: '#4a5568', fontSize: '0.875rem' }}>
                  {h.description}
                </p>
              </div>
              <span
                className={`badge ${h.supported ? 'badge-success' : 'badge-error'}`}
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
              >
                {h.supported ? 'Supported' : 'Not Supported'}
              </span>
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#718096' }}>
              <p><strong>Evidence:</strong> {h.evidence}</p>
              <p>
                <strong>Effect Size (Cohen's d):</strong> {h.effectSize.toFixed(2)}
                {' '}
                ({interpretEffectSize(h.effectSize)})
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 0.5rem' }}>Summary</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#4a5568' }}>
          {hypotheses.filter(h => h.supported).length} of {hypotheses.length} hypotheses supported.
        </p>
      </div>
    </div>
  );
};

function analyzeHypotheses(
  resultsByProfile: Map<string, Map<SchedulerType, SimulationResults[]>>
): HypothesisResult[] {
  const results: HypothesisResult[] = [];

  // Extract improvement metrics for each calibration type
  const overconfidentImprovement = calculateImprovementForCalibration(resultsByProfile, 'Over');
  const underconfidentImprovement = calculateImprovementForCalibration(resultsByProfile, 'Under');
  const wellCalibratedImprovement = calculateImprovementForCalibration(resultsByProfile, 'Well');

  // H1: Overconfident learners show largest improvement
  const h1Supported = overconfidentImprovement.mean > underconfidentImprovement.mean &&
                      overconfidentImprovement.mean > wellCalibratedImprovement.mean;

  results.push({
    hypothesis: 'H1: Overconfident Learners',
    description: 'Overconfident learners show the largest improvement under CalibrateMe.',
    supported: h1Supported,
    evidence: `Improvement: Over=${(overconfidentImprovement.mean * 100).toFixed(1)}%, Under=${(underconfidentImprovement.mean * 100).toFixed(1)}%, Well=${(wellCalibratedImprovement.mean * 100).toFixed(1)}%`,
    effectSize: overconfidentImprovement.effectSize,
  });

  // H2: Underconfident learners show moderate improvement
  const h2Supported = underconfidentImprovement.mean > wellCalibratedImprovement.mean &&
                      underconfidentImprovement.mean < overconfidentImprovement.mean;

  results.push({
    hypothesis: 'H2: Underconfident Learners',
    description: 'Underconfident learners show moderate improvement under CalibrateMe.',
    supported: h2Supported,
    evidence: `Moderate improvement of ${(underconfidentImprovement.mean * 100).toFixed(1)}% (between over and well-calibrated)`,
    effectSize: underconfidentImprovement.effectSize,
  });

  // H3: Well-calibrated learners show minimal difference
  const h3Supported = Math.abs(wellCalibratedImprovement.mean) < 0.05; // Less than 5% difference

  results.push({
    hypothesis: 'H3: Well-Calibrated Learners',
    description: 'Well-calibrated learners show minimal difference (validating calibration as key variable).',
    supported: h3Supported,
    evidence: `Difference of ${(wellCalibratedImprovement.mean * 100).toFixed(1)}% (threshold: <5%)`,
    effectSize: wellCalibratedImprovement.effectSize,
  });

  return results;
}

function calculateImprovementForCalibration(
  resultsByProfile: Map<string, Map<SchedulerType, SimulationResults[]>>,
  calibrationType: string
): { mean: number; effectSize: number } {
  const calibrateMe: number[] = [];
  const sm2: number[] = [];

  for (const [profileId, schedulerResults] of resultsByProfile) {
    if (profileId.includes(calibrationType)) {
      const cmResults = schedulerResults.get(SchedulerType.CALIBRATEME);
      const sm2Results = schedulerResults.get(SchedulerType.SM2);

      if (cmResults && sm2Results) {
        calibrateMe.push(...cmResults.map(r => r.retention_7day));
        sm2.push(...sm2Results.map(r => r.retention_7day));
      }
    }
  }

  if (calibrateMe.length === 0 || sm2.length === 0) {
    return { mean: 0, effectSize: 0 };
  }

  const improvement = mean(calibrateMe) - mean(sm2);
  const effectSize = cohensD(calibrateMe, sm2);

  return { mean: improvement, effectSize };
}

function interpretEffectSize(d: number): string {
  const absD = Math.abs(d);
  if (absD < 0.2) return 'negligible';
  if (absD < 0.5) return 'small';
  if (absD < 0.8) return 'medium';
  return 'large';
}

export default HypothesisResults;
