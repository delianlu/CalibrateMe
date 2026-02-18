import { QuizResponse } from '../../quiz/types';
import { ItemState } from '../../user/types';
import LiveCalibrationCurve from './LiveCalibrationCurve';
import ECEMeter from './ECEMeter';
import ConfidenceHistogram from './ConfidenceHistogram';
import RetentionForecast from './RetentionForecast';
import ForgettingCurves from './ForgettingCurves';

interface CalibrationDashboardProps {
  responses: QuizResponse[];
  itemStates?: Record<string, ItemState>;
}

export default function CalibrationDashboard({
  responses,
  itemStates = {},
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

  return (
    <div className="cal-dashboard">
      <h2 className="cal-dashboard__title">Calibration Analytics</h2>

      {totalItems === 0 && !hasItemData ? (
        <div className="cal-dashboard__empty card">
          <p>Complete a quiz session to see your calibration analytics.</p>
        </div>
      ) : (
        <>
          {/* Quick stats row */}
          {totalItems > 0 && (
            <div className="cal-dashboard__stats">
              <div className="cal-dashboard__stat">
                <span className="cal-dashboard__stat-value">{totalItems}</span>
                <span className="cal-dashboard__stat-label">Responses</span>
              </div>
              <div className="cal-dashboard__stat">
                <span className="cal-dashboard__stat-value">
                  {(accuracy * 100).toFixed(0)}%
                </span>
                <span className="cal-dashboard__stat-label">Accuracy</span>
              </div>
              <div className="cal-dashboard__stat">
                <span className="cal-dashboard__stat-value">
                  {avgConf.toFixed(0)}%
                </span>
                <span className="cal-dashboard__stat-label">Avg Confidence</span>
              </div>
              <div className="cal-dashboard__stat">
                <span className="cal-dashboard__stat-value">
                  {(avgRT / 1000).toFixed(1)}s
                </span>
                <span className="cal-dashboard__stat-label">Avg RT</span>
              </div>
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
