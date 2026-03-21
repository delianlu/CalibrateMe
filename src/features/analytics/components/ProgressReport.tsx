import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Loader2,
  Trophy,
  TrendingUp,
  Target,
  AlertCircle,
  Star,
  ArrowRight,
} from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface ProgressReportProps {
  totalSessions: number;
  totalReviews: number;
  accuracy: number;
  betaHat: number;
  ece: number;
  streakDays: number;
  masteredItems: number;
  totalItems: number;
  vocabAccuracy: number;
  grammarAccuracy: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  strongCategories: string[];
  weakCategories: string[];
  daysActive: number;
}

interface ReportData {
  overallAssessment: string;
  strengths: string[];
  areasForImprovement: string[];
  milestones: string[];
  nextGoals: string[];
  detailedAnalysis: string;
  motivationalNote: string;
}

export default function ProgressReport(props: ProgressReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const calibrationType = props.betaHat > 0.1
    ? 'overconfident'
    : props.betaHat < -0.1
    ? 'underconfident'
    : 'well-calibrated';

  const handleGenerate = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await aiService.generateProgressReport({
        ...props,
        calibrationType,
      });
      setReport(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!report) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <FileText size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
        <h3 style={{ margin: '0 0 8px' }}>AI Progress Report</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>
          Generate a comprehensive AI-powered analysis of your learning progress and calibration patterns.
        </p>
        {props.totalSessions < 2 ? (
          <p style={{ fontSize: 13, color: 'var(--color-warning)' }}>
            Complete at least 2 sessions to generate a report.
          </p>
        ) : (
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <><Loader2 size={16} className="grammar-ai-explain__spinner" /> Generating Report...</>
            ) : (
              <><FileText size={16} /> Generate Report</>
            )}
          </button>
        )}
        {error && <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>Failed to generate report. Please try again.</p>}
      </div>
    );
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <FileText size={20} />
        <h3 style={{ margin: 0 }}>Your Progress Report</h3>
      </div>

      {/* Overall Assessment */}
      <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'var(--color-surface-2)' }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{report.overallAssessment}</p>
      </div>

      {/* Strengths */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Trophy size={16} style={{ color: 'var(--color-success)' }} />
          <strong style={{ fontSize: 13 }}>Strengths</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {report.strengths.map((s, i) => <li key={i} style={{ fontSize: 13, marginBottom: 2 }}>{s}</li>)}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
          <strong style={{ fontSize: 13 }}>Areas for Improvement</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {report.areasForImprovement.map((a, i) => <li key={i} style={{ fontSize: 13, marginBottom: 2 }}>{a}</li>)}
        </ul>
      </div>

      {/* Milestones */}
      {report.milestones.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Star size={16} style={{ color: 'var(--color-accent)' }} />
            <strong style={{ fontSize: 13 }}>Milestones Reached</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {report.milestones.map((m, i) => <li key={i} style={{ fontSize: 13, marginBottom: 2 }}>{m}</li>)}
          </ul>
        </div>
      )}

      {/* Next Goals */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Target size={16} style={{ color: 'var(--color-primary)' }} />
          <strong style={{ fontSize: 13 }}>Next Goals</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {report.nextGoals.map((g, i) => (
            <li key={i} style={{ fontSize: 13, marginBottom: 2 }}>
              <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {g}
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Analysis */}
      <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: 'var(--color-surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <TrendingUp size={16} />
          <strong style={{ fontSize: 13 }}>Detailed Analysis</strong>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{report.detailedAnalysis}</p>
      </div>

      {/* Motivational Note */}
      <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-success-bg, rgba(34, 197, 94, 0.1))', borderLeft: '3px solid var(--color-success)' }}>
        <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic' }}>{report.motivationalNote}</p>
      </div>

      <button
        className="btn btn-secondary"
        onClick={() => setReport(null)}
        style={{ marginTop: 12 }}
      >
        Generate New Report
      </button>
    </motion.div>
  );
}
