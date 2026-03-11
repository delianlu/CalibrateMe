import { Activity, Target, Brain, Clock } from 'lucide-react';
import { QuizResponse } from '../../quiz/types';
import { ItemState } from '../../user/types';
import LiveCalibrationCurve from './LiveCalibrationCurve';
import ECEMeter from './ECEMeter';
import ConfidenceHistogram from './ConfidenceHistogram';
import RetentionForecast from './RetentionForecast';
import ForgettingCurves from './ForgettingCurves';
import SessionHistory from './SessionHistory';
import LearnerClassification from './LearnerClassification';

interface CalibrationDashboardProps {
  responses: QuizResponse[];
  itemStates?: Record<string, ItemState>;
  betaHat?: number;
}

const statIcons = [Activity, Target, Brain, Clock];

export default function CalibrationDashboard({
  responses,
  itemStates = {},
  betaHat = 0,
}: CalibrationDashboardProps) {
  const totalItems = responses.length;
  const correctCount = responses.filter(r => r.correctness).length;
  const accuracy = totalItems > 0 ? correctCount / totalItems : 0;
  const avgConf =
    totalItems > 0
      ? responses.reduce((s, r) => s + r.confidence, 0) / totalItems
      : 0;
  const avgRT =
    totalItems > 0
      ? responses.reduce((s, r) => s + r.responseTime, 0) / totalItems
      : 0;

  const hasItemData = Object.keys(itemStates).length > 0;

  const statData = [
    { value: totalItems, label: 'Responses', accent: 'blue' },
    { value: `${(accuracy * 100).toFixed(0)}%`, label: 'Accuracy', accent: 'green' },
    { value: `${avgConf.toFixed(0)}%`, label: 'Avg Confidence', accent: 'purple' },
    { value: `${(avgRT / 1000).toFixed(1)}s`, label: 'Avg RT', accent: 'amber' },
  ];

  return (
    <div className="cal-dashboard">
      <h2 className="cal-dashboard__title">
        <Activity size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} />
        Calibration Analytics
      </h2>

      {totalItems === 0 && !hasItemData ? (
        <div className="cal-dashboard__empty card">
          <Target size={48} style={{ color: 'var(--text-faint)', marginBottom: 12 }} />
          <p>Complete a quiz session to see your calibration analytics.</p>
        </div>
      ) : (
        <>
          {/* Quick stats row */}
          {totalItems > 0 && (
            <div className="cal-dashboard__stats">
              {statData.map((stat, i) => {
                const Icon = statIcons[i];
                return (
                  <div key={stat.label} className={`cal-dashboard__stat cal-dashboard__stat--${stat.accent}`}>
                    <div className="cal-dashboard__stat-icon">
                      <Icon size={16} />
                    </div>
                    <span className="cal-dashboard__stat-value">{stat.value}</span>
                    <span className="cal-dashboard__stat-label">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calibration charts */}
          {totalItems > 0 && (
            <div className="cal-dashboard__charts">
              <div className="cal-dashboard__chart card">
                <LiveCalibrationCurve responses={responses} />
              </div>
              <div className="cal-dashboard__chart card">
                <ECEMeter responses={responses} />
                <ConfidenceHistogram responses={responses} />
              </div>
            </div>
          )}

          {/* ECE trend over sessions */}
          {totalItems > 0 && (
            <div className="cal-dashboard__chart card" style={{ marginBottom: 16 }}>
              <SessionHistory responses={responses} />
            </div>
          )}

          {/* Learner classification */}
          {totalItems >= 5 && (
            <LearnerClassification responses={responses} betaHat={betaHat} />
          )}

          {/* Forecast section */}
          {hasItemData && (
            <div className="cal-dashboard__forecasts">
              <div className="cal-dashboard__chart card">
                <RetentionForecast itemStates={itemStates} />
              </div>
              <div className="cal-dashboard__chart card">
                <ForgettingCurves itemStates={itemStates} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
