import { useMemo } from 'react';
import { motion } from 'framer-motion';
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

  const { statData } = useMemo(() => {
    const correctCount = responses.filter(r => r.correctness).length;
    const acc = totalItems > 0 ? correctCount / totalItems : 0;
    const conf = totalItems > 0 ? responses.reduce((s, r) => s + r.confidence, 0) / totalItems : 0;
    const rt = totalItems > 0 ? responses.reduce((s, r) => s + r.responseTime, 0) / totalItems : 0;

    return {
      accuracy: acc,
      avgConf: conf,
      avgRT: rt,
      statData: [
        { value: totalItems, label: 'Responses', accent: 'blue' },
        { value: `${(acc * 100).toFixed(0)}%`, label: 'Accuracy', accent: 'green' },
        { value: `${conf.toFixed(0)}%`, label: 'Avg Confidence', accent: 'purple' },
        { value: `${(rt / 1000).toFixed(1)}s`, label: 'Avg RT', accent: 'amber' },
      ],
    };
  }, [responses, totalItems]);

  const hasItemData = Object.keys(itemStates).length > 0;

  return (
    <div className="cal-dashboard">
      <h2 className="cal-dashboard__title">
        <Activity size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} />
        Calibration Analytics
      </h2>

      {totalItems === 0 && !hasItemData ? (
        <motion.div
          className="cal-dashboard__empty card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, marginLeft: 'auto', marginRight: 'auto'
          }}>
            <Target size={32} style={{ color: 'var(--color-primary-500)' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            No Analytics Yet
          </h3>
          <p>Complete a quiz session to see your calibration analytics.</p>
          <p style={{ fontSize: '0.8rem', marginTop: 8, color: 'var(--text-faint)' }}>
            Your calibration curve, ECE score, and learning insights will appear here.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Quick stats row */}
          {totalItems > 0 && (
            <div className="cal-dashboard__stats">
              {statData.map((stat, i) => {
                const Icon = statIcons[i];
                return (
                  <motion.div
                    key={stat.label}
                    className={`cal-dashboard__stat cal-dashboard__stat--${stat.accent}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="cal-dashboard__stat-icon">
                      <Icon size={16} />
                    </div>
                    <span className="cal-dashboard__stat-value">{stat.value}</span>
                    <span className="cal-dashboard__stat-label">{stat.label}</span>
                  </motion.div>
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
