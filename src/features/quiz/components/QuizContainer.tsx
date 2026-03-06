import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import Flashcard from './Flashcard';
import GrammarExercise from './GrammarExercise';
import ConfidenceSlider from './ConfidenceSlider';
import AnswerButtons from './AnswerButtons';
import QuizProgress from './QuizProgress';
import SessionSummary from './SessionSummary';
import ScaffoldPromptCard from '../../scaffolding/components/ScaffoldPromptCard';
import {
  createScaffoldState,
  processResponse,
  dismissPrompt,
} from '../../scaffolding/scaffoldingEngine';
import { ScaffoldState } from '../../scaffolding/types';
import { QuizItem, QuizResponse } from '../types';

type PracticeMode = 'vocabulary' | 'grammar' | 'mixed';

interface QuizContainerProps {
  vocabulary?: QuizItem[];
  grammarActivities?: QuizItem[];
  onSessionComplete?: (responses: QuizResponse[], kHat: number, betaHat: number) => void;
}

/**
 * Top-level quiz orchestrator with SRL scaffolding.
 *
 * Flow per item:
 *   1. show-word      → Flashcard front (tap to continue)
 *   2. rate-confidence → ConfidenceSlider
 *   3. reveal-answer   → Flashcard back + AnswerButtons
 *   4. feedback        → brief flash, scaffold prompt, then auto-advance
 */
export default function QuizContainer({ vocabulary, grammarActivities, onSessionComplete }: QuizContainerProps) {
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
  const [scaffold, setScaffold] = useState<ScaffoldState>(createScaffoldState);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('mixed');
  const completedRef = useRef(false);

  // Fire onSessionComplete once when session ends
  useEffect(() => {
    if (isCompleted && session && !completedRef.current) {
      completedRef.current = true;
      const kHat = sessionStats?.calibrationMetrics?.ece ?? 0.3;
      const betaHat = 0;
      onSessionComplete?.(session.responses, kHat, betaHat);
    }
    if (!isCompleted) {
      completedRef.current = false;
    }
  }, [isCompleted, session, sessionStats, onSessionComplete]);

  const handleDismissScaffold = useCallback(() => {
    setScaffold(prev => dismissPrompt(prev));
  }, []);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setFeedbackResult(correct);
      submitAnswer(correct);

      // Process scaffolding
      if (session) {
        const response: QuizResponse = {
          itemId: session.items[session.currentIndex].id,
          correctness: correct,
          confidence,
          responseTime: 0,
          timestamp: new Date(),
        };
        setScaffold(prev =>
          processResponse(prev, response, session.responses.length + 1)
        );
      }

      // Auto-advance after feedback (delayed if scaffold prompt shows)
      setTimeout(() => {
        setFeedbackResult(null);
        setConfidence(50);
        nextItem();
      }, 600);
    },
    [submitAnswer, nextItem, session, confidence]
  );

  // Handler for grammar exercise answers (auto-graded)
  const handleGrammarAnswer = useCallback(
    (selectedOption: string) => {
      if (!currentItem) return;
      const correct = selectedOption === currentItem.answer;
      // Skip the confidence step for grammar — go straight to reveal + feedback
      submitConfidence(70); // default confidence for grammar
      setFeedbackResult(correct);
      submitAnswer(correct);

      if (session) {
        const response: QuizResponse = {
          itemId: session.items[session.currentIndex].id,
          correctness: correct,
          confidence: 70,
          responseTime: 0,
          timestamp: new Date(),
        };
        setScaffold(prev =>
          processResponse(prev, response, session.responses.length + 1)
        );
      }
    },
    [currentItem, submitConfidence, submitAnswer, session]
  );

  // Advance from grammar feedback to next item
  const handleGrammarNext = useCallback(() => {
    setFeedbackResult(null);
    setConfidence(50);
    nextItem();
  }, [nextItem]);

  // ── Not started ──────────────────────────────────────────────────
  if (!session) {
    const vocabItems = vocabulary ?? [];
    const grammarItems = grammarActivities ?? [];
    const getSessionItems = (): QuizItem[] => {
      if (practiceMode === 'vocabulary') return vocabItems;
      if (practiceMode === 'grammar') return grammarItems;
      // mixed: interleave both
      return [...vocabItems, ...grammarItems];
    };
    const sessionItems = getSessionItems();

    return (
      <div className="quiz-start card">
        <h2 className="quiz-start__title">Practice Mode</h2>
        <p className="quiz-start__desc">
          Practice vocabulary and grammar exercises designed for French speakers learning English.
          CalibrateMe tracks your calibration accuracy and adapts the schedule.
        </p>

        {/* Mode selector */}
        <div className="quiz-start__mode-selector" role="radiogroup" aria-label="Practice mode">
          <button
            className={`quiz-start__mode-btn ${practiceMode === 'mixed' ? 'quiz-start__mode-btn--active' : ''}`}
            onClick={() => setPracticeMode('mixed')}
            role="radio"
            aria-checked={practiceMode === 'mixed'}
          >
            Mixed ({vocabItems.length + grammarItems.length})
          </button>
          <button
            className={`quiz-start__mode-btn ${practiceMode === 'vocabulary' ? 'quiz-start__mode-btn--active' : ''}`}
            onClick={() => setPracticeMode('vocabulary')}
            role="radio"
            aria-checked={practiceMode === 'vocabulary'}
          >
            Vocabulary ({vocabItems.length})
          </button>
          <button
            className={`quiz-start__mode-btn ${practiceMode === 'grammar' ? 'quiz-start__mode-btn--active' : ''}`}
            onClick={() => setPracticeMode('grammar')}
            role="radio"
            aria-checked={practiceMode === 'grammar'}
          >
            Grammar ({grammarItems.length})
          </button>
        </div>

        <div className="quiz-start__info">
          <span>{Math.min(20, sessionItems.length)} items per session</span>
          <span>{practiceMode === 'vocabulary' ? 'Self-grading mode' : 'Auto-graded'}</span>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            setConfidence(50);
            setFeedbackResult(null);
            setScaffold(createScaffoldState());
            startSession(sessionItems);
          }}
          disabled={sessionItems.length === 0}
        >
          {sessionItems.length === 0 ? 'No items loaded' : 'Start Quiz'}
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
  const isGrammarItem = currentItem.itemType === 'multiple-choice' || currentItem.itemType === 'error_correction';

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

      {isGrammarItem ? (
        /* ── Grammar exercise flow ─────────────────────────────── */
        <>
          <GrammarExercise
            item={currentItem}
            phase={phase as 'show-word' | 'rate-confidence' | 'reveal-answer' | 'feedback'}
            onAnswer={handleGrammarAnswer}
          />
          {(phase === 'feedback' || phase === 'reveal-answer') && (
            <div className="quiz-active__controls">
              <button className="btn btn-primary btn-block" onClick={handleGrammarNext}>
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── Vocabulary flashcard flow ─────────────────────────── */
        <>
          {/* Scaffold prompt (before-answer timing) */}
          {scaffold.activePrompt &&
            scaffold.activePrompt.timing === 'before-answer' &&
            phase === 'show-word' && (
              <ScaffoldPromptCard
                prompt={scaffold.activePrompt}
                onDismiss={handleDismissScaffold}
              />
            )}

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
                onCorrect={() => handleAnswer(true)}
                onIncorrect={() => handleAnswer(false)}
              />
            )}

            {phase === 'feedback' && (
              <>
                <div
                  className={`quiz-feedback ${feedbackResult ? 'quiz-feedback--correct' : 'quiz-feedback--incorrect'}`}
                >
                  {feedbackResult ? 'Correct!' : 'Incorrect'}
                </div>

                {/* Scaffold prompt (after-answer timing) */}
                {scaffold.activePrompt &&
                  scaffold.activePrompt.timing === 'after-answer' && (
                    <ScaffoldPromptCard
                      prompt={scaffold.activePrompt}
                      onDismiss={handleDismissScaffold}
                    />
                  )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
