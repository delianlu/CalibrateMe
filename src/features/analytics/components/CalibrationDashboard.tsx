import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Brain, Clock } from 'lucide-react';
import CountUp from '../../../components/CountUp';
import { AnalyticsSkeleton } from '../../../components/Skeleton';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Brief skeleton while data hydrates
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

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
        { numValue: totalItems, label: 'Responses', accent: 'blue', suffix: '' },
        { numValue: acc * 100, label: 'Accuracy', accent: 'green', suffix: '%', decimals: 0 },
        { numValue: conf, label: 'Avg Confidence', accent: 'purple', suffix: '%', decimals: 0 },
        { numValue: rt / 1000, label: 'Avg RT', accent: 'amber', suffix: 's', decimals: 1 },
      ],
    };
  }, [responses, totalItems]);

  const hasItemData = Object.keys(itemStates).length > 0;

  if (isLoading) {
    return (
      <div className="cal-dashboard">
        <h2 className="cal-dashboard__title">
          <Activity size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} />
          Calibration Analytics
        </h2>
        <AnalyticsSkeleton />
      </div>
    );
  }

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
        <div className="analytics-bento">
          {/* Calibration curve - large tile */}
          {totalItems > 0 && (
            <div className="analytics-bento__calibration-curve cal-dashboard__chart card">
              <LiveCalibrationCurve responses={responses} />
            </div>
          )}

          {/* Confidence distribution - medium tile */}
          {totalItems > 0 && (
            <div className="analytics-bento__confidence-dist cal-dashboard__chart card">
              <ConfidenceHistogram responses={responses} />
            </div>
          )}

          {/* Quick stats - glass cards */}
          {totalItems > 0 && statData.map((stat, i) => {
            const Icon = statIcons[i];
            return (
              <motion.div
                key={stat.label}
                className={`analytics-bento__stat-tile glass-card cal-dashboard__stat cal-dashboard__stat--${stat.accent}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="cal-dashboard__stat-icon">
                  <Icon size={16} />
                </div>
                <CountUp
                  className="cal-dashboard__stat-value"
                  end={stat.numValue}
                  suffix={stat.suffix}
                  decimals={stat.decimals ?? 0}
                />
                <span className="cal-dashboard__stat-label">{stat.label}</span>
              </motion.div>
            );
          })}

          {/* ECE Meter - wide tile */}
          {totalItems > 0 && (
            <div className="analytics-bento__ece-meter cal-dashboard__chart card">
              <ECEMeter responses={responses} />
            </div>
          )}

          {/* ECE trend over sessions - full width */}
          {totalItems > 0 && (
            <div className="analytics-bento__ece-trend cal-dashboard__chart card">
              <SessionHistory responses={responses} />
            </div>
          )}

          {/* Learner classification */}
          {totalItems >= 5 && (
            <div className="analytics-bento__learner-class">
              <LearnerClassification responses={responses} betaHat={betaHat} />
            </div>
          )}

          {/* Forecast section */}
          {hasItemData && (
            <>
              <div className="analytics-bento__retention cal-dashboard__chart card">
                <RetentionForecast itemStates={itemStates} />
              </div>
              <div className="analytics-bento__forgetting cal-dashboard__chart card">
                <ForgettingCurves itemStates={itemStates} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
