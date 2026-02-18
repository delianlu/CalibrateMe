import { useState, useEffect, useRef } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import Flashcard from './Flashcard';
import ConfidenceSlider from './ConfidenceSlider';
import AnswerButtons from './AnswerButtons';
import QuizProgress from './QuizProgress';
import SessionSummary from './SessionSummary';
import { QuizItem, QuizResponse } from '../types';

interface QuizContainerProps {
  vocabulary?: QuizItem[];
  onSessionComplete?: (responses: QuizResponse[], kHat: number, betaHat: number) => void;
}

/**
 * Top-level quiz orchestrator.
 *
 * Flow per item:
 *   1. show-word      → Flashcard front (tap to continue)
 *   2. rate-confidence → ConfidenceSlider
 *   3. reveal-answer   → Flashcard back + AnswerButtons
 *   4. feedback        → brief flash then auto-advance
 */
export default function QuizContainer({ vocabulary, onSessionComplete }: QuizContainerProps) {
  const {
    session,
    currentItem,
    progress,
    sessionStats,
    isCompleted,
    startSession,
    flipCard,
    submitConfidence,
    submitAnswer,
    nextItem,
    togglePause,
    endSession,
  } = useQuizSession();

  const [confidence, setConfidence] = useState(50);
  const [feedbackResult, setFeedbackResult] = useState<boolean | null>(null);
  const completedRef = useRef(false);

  // Fire onSessionComplete once when session ends
  useEffect(() => {
    if (isCompleted && session && !completedRef.current) {
      completedRef.current = true;
      const kHat = sessionStats?.calibrationMetrics?.ece ?? 0.3;
      const betaHat = 0; // Placeholder — real value comes from QuizService
      onSessionComplete?.(session.responses, kHat, betaHat);
    }
    if (!isCompleted) {
      completedRef.current = false;
    }
  }, [isCompleted, session, sessionStats, onSessionComplete]);

  // ── Not started ──────────────────────────────────────────────────
  if (!session) {
    const items = vocabulary ?? [];
    return (
      <div className="quiz-start card">
        <h2 className="quiz-start__title">Practice Mode</h2>
        <p className="quiz-start__desc">
          Answer vocabulary questions and rate your confidence.
          CalibrateMe will track your calibration accuracy and adapt the schedule.
        </p>
        <div className="quiz-start__info">
          <span>{Math.min(20, items.length)} items per session</span>
          <span>Self-grading mode</span>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            setConfidence(50);
            setFeedbackResult(null);
            startSession(items);
          }}
          disabled={items.length === 0}
        >
          {items.length === 0 ? 'No vocabulary loaded' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  // ── Session complete ─────────────────────────────────────────────
  if (isCompleted) {
    return (
      <SessionSummary
        responses={session.responses}
        calibrationECE={sessionStats?.calibrationMetrics?.ece ?? null}
        onClose={endSession}
      />
    );
  }

  // ── Paused ───────────────────────────────────────────────────────
  if (session.paused) {
    return (
      <div className="quiz-paused card">
        <h2>Session Paused</h2>
        <p>Take a break. Your progress is saved.</p>
        <div className="quiz-paused__actions">
          <button className="btn btn-primary" onClick={togglePause}>
            Resume
          </button>
          <button className="btn btn-secondary" onClick={endSession}>
            End Session
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  const phase = session.phase;

  // ── Active quiz ──────────────────────────────────────────────────
  return (
    <div className="quiz-active">
      {/* Top bar: progress + pause */}
      <div className="quiz-active__top">
        <QuizProgress current={progress.current} total={progress.total} />
        <button className="btn btn-secondary quiz-active__pause" onClick={togglePause}>
          Pause
        </button>
      </div>

      {/* Card */}
      <Flashcard
        item={currentItem}
        flipped={phase === 'reveal-answer' || phase === 'feedback'}
        onFlip={phase === 'show-word' ? flipCard : () => {}}
      />

      {/* Phase-specific controls */}
      <div className="quiz-active__controls">
        {phase === 'show-word' && (
          <p className="quiz-active__instruction">
            Think about the meaning, then tap the card
          </p>
        )}

        {phase === 'rate-confidence' && (
          <ConfidenceSlider
            value={confidence}
            onChange={setConfidence}
            onSubmit={(val) => {
              submitConfidence(val);
            }}
          />
        )}

        {phase === 'reveal-answer' && (
          <AnswerButtons
            onCorrect={() => {
              setFeedbackResult(true);
              submitAnswer(true);
              // Auto-advance after brief feedback
              setTimeout(() => {
                setFeedbackResult(null);
                setConfidence(50);
                nextItem();
              }, 600);
            }}
            onIncorrect={() => {
              setFeedbackResult(false);
              submitAnswer(false);
              setTimeout(() => {
                setFeedbackResult(null);
                setConfidence(50);
                nextItem();
              }, 600);
            }}
          />
        )}

        {phase === 'feedback' && (
          <div className={`quiz-feedback ${feedbackResult ? 'quiz-feedback--correct' : 'quiz-feedback--incorrect'}`}>
            {feedbackResult ? 'Correct!' : 'Incorrect'}
          </div>
        )}
      </div>
    </div>
  );
}
