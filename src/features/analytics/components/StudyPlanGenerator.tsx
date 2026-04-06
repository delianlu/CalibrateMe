import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Loader2,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface StudyPlanGeneratorProps {
  betaHat: number;
  ece: number;
  accuracy: number;
  totalSessions: number;
  weakAreas: string[];
  strongAreas: string[];
}

interface StudyPlanDay {
  day: number;
  focus: string;
  activities: string[];
  durationMinutes: number;
  tips: string;
}

interface StudyPlanData {
  planName: string;
  overview: string;
  weeklySchedule: StudyPlanDay[];
  priorityAreas: string[];
  calibrationStrategy: string;
  expectedOutcomes: string;
}

export default function StudyPlanGenerator(props: StudyPlanGeneratorProps) {
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [minutesPerDay, setMinutesPerDay] = useState(20);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [goal, setGoal] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await aiService.generateStudyPlan({
        currentLevel: level,
        betaHat: props.betaHat,
        ece: props.ece,
        accuracy: props.accuracy,
        totalSessions: props.totalSessions,
        weakAreas: props.weakAreas,
        strongAreas: props.strongAreas,
        availableMinutesPerDay: minutesPerDay,
        goalDescription: goal || undefined,
      });
      setPlan(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const dayColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  if (!plan) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CalendarDays size={20} />
          <h3 style={{ margin: 0 }}>AI Study Plan</h3>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>
          Get a personalized 7-day study plan based on your calibration patterns and learning data.
        </p>

        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="input" style={{ width: '100%' }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>Minutes/day</label>
              <select value={minutesPerDay} onChange={(e) => setMinutesPerDay(Number(e.target.value))} className="input" style={{ width: '100%' }}>
                {[10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>Goal (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Prepare for English exam, improve business vocabulary..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="grammar-ai-explain__spinner" /> Creating Plan...</>
          ) : (
            <><CalendarDays size={16} /> Generate Study Plan</>
          )}
        </button>
        {error && <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>Failed to generate plan.</p>}
      </div>
    );
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <CalendarDays size={20} />
        <h3 style={{ margin: 0 }}>{plan.planName}</h3>
      </div>
      <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>{plan.overview}</p>

      {/* Priority Areas */}
      {plan.priorityAreas?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {plan.priorityAreas.map(area => (
            <span key={area} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--color-primary-bg, rgba(99, 102, 241, 0.1))', color: 'var(--color-primary)' }}>
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Weekly Schedule */}
      <div style={{ marginBottom: 16 }}>
        {plan.weeklySchedule?.map((day, i) => (
          <motion.div
            key={day.day}
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              background: 'var(--color-surface-2)',
              borderLeft: `3px solid ${dayColors[i % dayColors.length]}`,
            }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>Day {day.day}: {day.focus}</strong>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: 0.6 }}>
                <Clock size={12} /> {day.durationMinutes} min
              </span>
            </div>
            <ul style={{ margin: '0 0 6px', paddingLeft: 18 }}>
              {day.activities?.map((activity, j) => (
                <li key={j} style={{ fontSize: 12, marginBottom: 2 }}>
                  <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {activity}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 11, margin: 0, opacity: 0.7, fontStyle: 'italic' }}>
              <Lightbulb size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {day.tips}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Calibration Strategy */}
      <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface-2)', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Target size={14} />
          <strong style={{ fontSize: 13 }}>Calibration Strategy</strong>
        </div>
        <p style={{ fontSize: 13, margin: 0 }}>{plan.calibrationStrategy}</p>
      </div>

      {/* Expected Outcomes */}
      <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-success-bg, rgba(34, 197, 94, 0.1))', borderLeft: '3px solid var(--color-success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <BookOpen size={14} />
          <strong style={{ fontSize: 13 }}>Expected Outcomes</strong>
        </div>
        <p style={{ fontSize: 13, margin: 0 }}>{plan.expectedOutcomes}</p>
      </div>

      <button className="btn btn-secondary" onClick={() => setPlan(null)} style={{ marginTop: 12 }}>
        Generate New Plan
      </button>
    </motion.div>
  );
}
