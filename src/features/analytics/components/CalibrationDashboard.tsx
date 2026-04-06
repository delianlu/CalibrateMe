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
import CalibrationCoach from './CalibrationCoach';
import ProgressReport from './ProgressReport';
import StudyPlanGenerator from './StudyPlanGenerator';

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

  const { statData, computedAccuracy, computedEce, computedSessions, computedDualProcessRatio } = useMemo(() => {
    const correctCount = responses.filter(r => r.correctness).length;
    const acc = totalItems > 0 ? correctCount / totalItems : 0;
    const conf = totalItems > 0 ? responses.reduce((s, r) => s + r.confidence, 0) / totalItems : 0;
    const rt = totalItems > 0 ? responses.reduce((s, r) => s + r.responseTime, 0) / totalItems : 0;

    // Compute ECE
    const bins: { conf: number; correct: number }[][] = [[], [], [], [], []];
    responses.forEach(r => {
      const idx = Math.min(4, Math.floor(r.confidence / 20));
      bins[idx].push({ conf: r.confidence, correct: r.correctness ? 1 : 0 });
    });
    let ece = 0;
    const n = responses.length;
    for (const bin of bins) {
      if (bin.length === 0) continue;
      const avgConf = bin.reduce((s, b) => s + b.conf, 0) / bin.length / 100;
      const avgAcc = bin.reduce((s, b) => s + b.correct, 0) / bin.length;
      ece += (bin.length / n) * Math.abs(avgAcc - avgConf);
    }

    // Compute session count
    let sessions = 1;
    if (responses.length >= 2) {
      for (let i = 1; i < responses.length; i++) {
        const gap = responses[i].timestamp.getTime() - responses[i - 1].timestamp.getTime();
        if (gap > 10 * 60 * 1000) sessions++;
      }
    }

    // Compute dual-process ratio
    let dualProcessRatio = 0.5;
    if (responses.length >= 3) {
      const rts = responses.map(r => r.responseTime);
      const meanRT = rts.reduce((a, b) => a + b, 0) / rts.length;
      const auto = responses.filter(r => r.correctness && r.responseTime < meanRT && r.confidence > 70).length;
      dualProcessRatio = auto / responses.length;
    }

    return {
      computedAccuracy: acc,
      computedEce: ece,
      computedSessions: sessions,
      computedDualProcessRatio: dualProcessRatio,
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

          {/* AI Calibration Coach */}
          {totalItems >= 3 && (
            <div className="analytics-bento__coach">
              <CalibrationCoach
                betaHat={betaHat}
                ece={computedEce}
                accuracy={computedAccuracy}
                totalSessions={computedSessions}
                recentTrend="stable"
                dualProcessRatio={computedDualProcessRatio}
                strengths={[]}
                weaknesses={[]}
              />
            </div>
          )}

          {/* AI Progress Report */}
          {totalItems >= 5 && (
            <div className="analytics-bento__progress-report" style={{ gridColumn: '1 / -1' }}>
              <ProgressReport
                totalSessions={computedSessions}
                totalReviews={totalItems}
                accuracy={computedAccuracy}
                betaHat={betaHat}
                ece={computedEce}
                streakDays={0}
                masteredItems={Object.values(itemStates).filter(s => s.masteryLevel === 'mastered').length}
                totalItems={Object.keys(itemStates).length || totalItems}
                vocabAccuracy={computedAccuracy}
                grammarAccuracy={computedAccuracy}
                recentTrend="stable"
                strongCategories={[]}
                weakCategories={[]}
                daysActive={computedSessions}
              />
            </div>
          )}

          {/* AI Study Plan Generator */}
          {totalItems >= 3 && (
            <div className="analytics-bento__study-plan" style={{ gridColumn: '1 / -1' }}>
              <StudyPlanGenerator
                betaHat={betaHat}
                ece={computedEce}
                accuracy={computedAccuracy}
                totalSessions={computedSessions}
                weakAreas={[]}
                strongAreas={[]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
