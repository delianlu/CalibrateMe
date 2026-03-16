import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Target, Crosshair } from 'lucide-react';
import { MiniGameState, MiniGamePhase, TriviAnswer } from '../types';
import { pickRandomQuestions } from '../questions';
import MiniGameResults from './MiniGameResults';
import { celebrations } from '../../../utils/celebrations';

interface MiniGameContainerProps {
  onClose: () => void; // Return to main app
}

const QUESTIONS_PER_ROUND = 10;
const FEEDBACK_DURATION_MS = 1500;

function createInitialState(): MiniGameState {
  return {
    phase: 'intro',
    questions: [],
    answers: [],
    currentIndex: 0,
    selectedOption: null,
    confidence: 50,
    startTime: 0,
  };
}

function getConfidenceColor(value: number): string {
  if (value < 30) return '#e53e3e';
  if (value < 60) return '#dd6b20';
  if (value < 80) return '#d69e2e';
  return '#38a169';
}

/**
 * Main orchestrator for the calibration training mini-game.
 *
 * Flow:
 *   intro -> question -> rate-confidence -> feedback -> (repeat or results)
 */
export default function MiniGameContainer({ onClose }: MiniGameContainerProps) {
  const [state, setState] = useState<MiniGameState>(createInitialState);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // ── Start Game ─────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    const questions = pickRandomQuestions(QUESTIONS_PER_ROUND);
    setState({
      phase: 'question',
      questions,
      answers: [],
      currentIndex: 0,
      selectedOption: null,
      confidence: 50,
      startTime: Date.now(),
    });
  }, []);

  // ── Select Option ──────────────────────────────────────────────────
  const handleSelectOption = useCallback((index: number) => {
    setState(prev => {
      if (prev.phase !== 'question') return prev;
      return {
        ...prev,
        selectedOption: index,
        phase: 'rate-confidence' as MiniGamePhase,
      };
    });
  }, []);

  // ── Submit Confidence ──────────────────────────────────────────────
  const handleSubmitConfidence = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'rate-confidence' || prev.selectedOption === null) return prev;

      const currentQuestion = prev.questions[prev.currentIndex];
      const isCorrect = prev.selectedOption === currentQuestion.correctIndex;
      const responseTime = Date.now() - prev.startTime;

      const answer: TriviAnswer = {
        questionId: currentQuestion.id,
        selectedIndex: prev.selectedOption,
        confidence: prev.confidence,
        correct: isCorrect,
        responseTime,
      };

      return {
        ...prev,
        phase: 'feedback' as MiniGamePhase,
        answers: [...prev.answers, answer],
      };
    });

    // Auto-advance after feedback duration
    feedbackTimerRef.current = setTimeout(() => {
      setState(prev => {
        const nextIndex = prev.currentIndex + 1;
        if (nextIndex >= prev.questions.length) {
          return { ...prev, phase: 'results' as MiniGamePhase };
        }
        return {
          ...prev,
          phase: 'question' as MiniGamePhase,
          currentIndex: nextIndex,
          selectedOption: null,
          confidence: 50,
          startTime: Date.now(),
        };
      });
    }, FEEDBACK_DURATION_MS);
  }, []);

  // ── Confidence Slider Change ───────────────────────────────────────
  const handleConfidenceChange = useCallback((value: number) => {
    setState(prev => ({ ...prev, confidence: value }));
  }, []);

  // ── Play Again ─────────────────────────────────────────────────────
  const handlePlayAgain = useCallback(() => {
    const questions = pickRandomQuestions(QUESTIONS_PER_ROUND);
    setState({
      phase: 'question',
      questions,
      answers: [],
      currentIndex: 0,
      selectedOption: null,
      confidence: 50,
      startTime: Date.now(),
    });
  }, []);

  const { phase, questions, answers, currentIndex, selectedOption, confidence } = state;

  // ── Intro Phase ────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="minigame">
        <motion.div
          className="minigame__intro card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Crosshair size={28} style={{ color: 'var(--color-primary-500, #6366F1)' }} />
          </div>
          <h2>Calibration Training</h2>
          <p>
            <strong>Calibration</strong> is the match between your confidence and your actual accuracy.
            A well-calibrated person who says &ldquo;80% confident&rdquo; should be correct about 80% of the time.
          </p>
          <p>
            You will answer <strong>10 trivia questions</strong> and rate how confident you are
            after each one. At the end, we will show you how well-calibrated you were.
          </p>
          <div className="minigame__intro-actions">
            <motion.button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleStart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Target size={18} style={{ marginRight: 6 }} />
              Start Game
            </motion.button>
            <button className="btn btn-secondary btn-block" onClick={onClose}>
              Back to App
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Results Phase ──────────────────────────────────────────────────
  // Fire celebration when entering results phase
  const hasTriggeredCelebration = useRef(false);
  useEffect(() => {
    if (phase === 'results' && !hasTriggeredCelebration.current) {
      hasTriggeredCelebration.current = true;
      const correctCount = answers.filter(a => a.correct).length;
      if (correctCount === answers.length && answers.length > 0) {
        celebrations.perfectCalibrationGame();
      } else {
        const accuracy = answers.length > 0 ? correctCount / answers.length : 0;
        celebrations.sessionComplete(accuracy);
      }
    }
    if (phase !== 'results') {
      hasTriggeredCelebration.current = false;
    }
  }, [phase, answers]);

  if (phase === 'results') {
    return (
      <div className="minigame">
        <MiniGameResults
          answers={answers}
          questions={questions}
          onPlayAgain={handlePlayAgain}
          onClose={onClose}
        />
      </div>
    );
  }

  // ── Active Gameplay (question / rate-confidence / feedback) ────────
  const currentQuestion = questions[currentIndex];
  const latestAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

  return (
    <div className="minigame">
      {/* Progress indicator */}
      <div className="minigame__progress">
        <div className="quiz-progress">
          <div className="quiz-progress__bar">
            <div
              className="quiz-progress__fill"
              style={{ width: `${((currentIndex + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <span className="quiz-progress__text">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Question text */}
      <div className="minigame__question card">
        <span className="minigame__category badge badge-info">{currentQuestion.category}</span>
        <h3>{currentQuestion.question}</h3>
      </div>

      {/* Options */}
      {phase === 'question' && (
        <div className="minigame__options">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              className={`minigame__option ${selectedOption === idx ? 'minigame__option--selected' : ''}`}
              onClick={() => handleSelectOption(idx)}
            >
              <span className="minigame__option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Confidence slider */}
      {phase === 'rate-confidence' && (
        <div className="minigame__confidence">
          <div className="minigame__confidence-header">
            <span className="minigame__confidence-title">How confident are you?</span>
            <span
              className="minigame__confidence-value"
              style={{ color: getConfidenceColor(confidence) }}
            >
              {confidence}%
            </span>
          </div>

          <div className="minigame__confidence-slider-wrapper">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={confidence}
              onChange={e => handleConfidenceChange(Number(e.target.value))}
              className="confidence-slider__input"
              aria-label="Confidence level"
              aria-valuenow={confidence}
              aria-valuetext={`${confidence}% confidence`}
              style={{
                background: `linear-gradient(to right, ${getConfidenceColor(confidence)} ${confidence}%, #e2e8f0 ${confidence}%)`,
              }}
            />
            <div className="minigame__confidence-labels">
              <span>Guessing 25%</span>
              <span>Unsure 50%</span>
              <span>Fairly Sure 75%</span>
              <span>Certain 100%</span>
            </div>
          </div>

          <div className="minigame__confidence-selected">
            Your answer: <strong>{currentQuestion.options[selectedOption!]}</strong>
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleSubmitConfidence}
          >
            Submit Confidence
          </button>
        </div>
      )}

      {/* Feedback flash */}
      {phase === 'feedback' && latestAnswer && (
        <div className={`minigame__feedback ${latestAnswer.correct ? 'minigame__feedback--correct' : 'minigame__feedback--incorrect'}`} role="status" aria-live="assertive">
          <div className="minigame__feedback-result">
            {latestAnswer.correct ? 'Correct!' : 'Incorrect'}
          </div>
          {!latestAnswer.correct && (
            <div className="minigame__feedback-answer">
              The correct answer was: <strong>{currentQuestion.options[currentQuestion.correctIndex]}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
