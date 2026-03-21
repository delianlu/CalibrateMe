import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Lightbulb, Heart, Compass, Loader2, AlertCircle, Save } from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface CoachingData {
  summary: string;
  diagnosis: string;
  strategies: string[];
  encouragement: string;
  focusArea: string;
}

interface CalibrationCoachProps {
  betaHat: number;
  ece: number;
  accuracy: number;
  totalSessions: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  dualProcessRatio: number;
  strengths: string[];
  weaknesses: string[];
  domainSplit?: { vocabBetaHat: number; grammarBetaHat: number };
}

const COACHING_STORAGE_KEY = 'calibrateme_coaching';

function loadSavedCoaching(): CoachingData | null {
  try {
    const raw = localStorage.getItem(COACHING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function CalibrationCoach({
  betaHat,
  ece,
  accuracy,
  totalSessions,
  recentTrend,
  dualProcessRatio,
  strengths,
  weaknesses,
  domainSplit,
}: CalibrationCoachProps) {
  const [coaching, setCoaching] = useState<CoachingData | null>(loadSavedCoaching);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleGetCoaching = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const result = await aiService.getCalibrationCoaching({
        betaHat,
        ece,
        accuracy,
        totalSessions,
        recentTrend,
        dualProcessRatio,
        strengths,
        weaknesses,
        domainSplit,
      });
      setCoaching(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate coaching. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (coaching) {
      localStorage.setItem(COACHING_STORAGE_KEY, JSON.stringify(coaching));
      setSaved(true);
    }
  };

  const handleDismiss = () => {
    setCoaching(null);
    setSaved(false);
  };

  return (
    <div className="calibration-coach">
      {!coaching && !loading && (
        <motion.div
          className="calibration-coach__trigger glass-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="calibration-coach__trigger-header">
            <Target size={20} />
            <h3>AI Calibration Coach</h3>
          </div>
          <p className="calibration-coach__trigger-desc">
            Get personalized metacognitive coaching based on your calibration data.
          </p>
          {error && (
            <div className="calibration-coach__error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleGetCoaching}>
            <Brain size={16} style={{ marginRight: 6 }} />
            Get Personalized Coaching
          </button>
        </motion.div>
      )}

      {loading && (
        <motion.div
          className="calibration-coach__loading glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 size={28} className="calibration-coach__spinner" />
          <p>Analyzing your learning patterns...</p>
        </motion.div>
      )}

      <AnimatePresence>
        {coaching && !loading && (
          <motion.div
            className="calibration-coach__result glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="calibration-coach__result-header">
              <Target size={20} />
              <h3>AI Calibration Coach</h3>
            </div>

            <p className="calibration-coach__summary">{coaching.summary}</p>

            <div className="calibration-coach__section">
              <div className="calibration-coach__section-title">
                <Brain size={16} />
                <span>Diagnosis</span>
              </div>
              <p>{coaching.diagnosis}</p>
            </div>

            <div className="calibration-coach__section">
              <div className="calibration-coach__section-title">
                <Target size={16} />
                <span>Strategies</span>
              </div>
              <ol className="calibration-coach__strategies">
                {coaching.strategies.map((strategy, i) => (
                  <li key={i}>{strategy}</li>
                ))}
              </ol>
            </div>

            <div className="calibration-coach__section calibration-coach__section--encouragement">
              <div className="calibration-coach__section-title">
                <Heart size={16} />
                <span>Encouragement</span>
              </div>
              <p>{coaching.encouragement}</p>
            </div>

            <div className="calibration-coach__section calibration-coach__section--focus">
              <div className="calibration-coach__section-title">
                <Compass size={16} />
                <span>Focus for Next Session</span>
              </div>
              <p>{coaching.focusArea}</p>
            </div>

            <div className="calibration-coach__actions">
              <button className="btn btn-secondary btn-sm" onClick={handleDismiss}>
                Dismiss
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saved}
              >
                <Save size={14} style={{ marginRight: 4 }} />
                {saved ? 'Saved!' : 'Save to Profile'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleGetCoaching}>
                <Lightbulb size={14} style={{ marginRight: 4 }} />
                Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
