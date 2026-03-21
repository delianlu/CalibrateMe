import { useState, useCallback, useRef, useEffect } from 'react';
import { QuizItem } from '../types';

interface FillBlankTypingProps {
  item: QuizItem;
  phase: 'show-word' | 'rate-confidence' | 'reveal-answer' | 'feedback';
  onAnswer: (selectedOption: string) => void;
}

/**
 * Renders a fill-in-the-blank exercise where the learner types their answer.
 */
export default function FillBlankTyping({ item, phase, onAnswer }: FillBlankTypingProps) {
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAnswered = phase === 'reveal-answer' || phase === 'feedback';

  const normalizeAnswer = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:'"]/g, '');

  const isCorrect =
    normalizeAnswer(typedAnswer) === normalizeAnswer(item.answer ?? '') ||
    item.acceptableAnswers?.some(a => normalizeAnswer(typedAnswer) === normalizeAnswer(a)) ||
    false;

  useEffect(() => {
    if (phase === 'show-word' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (typedAnswer.trim().length === 0 || submitted) return;
    setSubmitted(true);
    onAnswer(typedAnswer.trim());
  }, [typedAnswer, submitted, onAnswer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="grammar-exercise card">
      {/* Category badge */}
      <div className="grammar-exercise__meta">
        {item.category && (
          <span className="grammar-exercise__category">{item.category}</span>
        )}
        <span className="grammar-exercise__type-badge">Type Your Answer</span>
      </div>

      {/* Question */}
      <div className="grammar-exercise__question">
        <p>{item.question}</p>
      </div>

      {/* Input area */}
      <div className="fill-blank__input-area">
        <input
          ref={inputRef}
          type="text"
          className={`fill-blank__input${
            isAnswered
              ? isCorrect
                ? ' fill-blank__input--correct'
                : ' fill-blank__input--incorrect'
              : ''
          }`}
          value={typedAnswer}
          onChange={e => setTypedAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswered}
          placeholder="Type your answer..."
          autoComplete="off"
          spellCheck={false}
          aria-label="Your answer"
        />
        {!isAnswered && !submitted && typedAnswer.trim().length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            style={{ marginTop: '0.75rem' }}
          >
            Check Answer
          </button>
        )}
      </div>

      {/* Feedback section */}
      {isAnswered && (
        <div className={`grammar-exercise__feedback ${isCorrect ? 'grammar-exercise__feedback--correct' : 'grammar-exercise__feedback--incorrect'}`}>
          <div className="grammar-exercise__result">
            {isCorrect ? 'Correct!' : `Incorrect — the answer is: ${item.answer}`}
          </div>

          {item.feedback && (
            <p className="grammar-exercise__explanation">{item.feedback}</p>
          )}

          {item.frenchComparison && (
            <div className="grammar-exercise__french-comparison">
              <div className="grammar-exercise__comparison-title">French vs English</div>
              <div className="grammar-exercise__comparison-block">
                <div className="grammar-exercise__comparison-fr">
                  <strong>French:</strong>
                  <p>{item.frenchComparison.frenchStructure}</p>
                </div>
                <div className="grammar-exercise__comparison-en">
                  <strong>English:</strong>
                  <p>{item.frenchComparison.englishStructure}</p>
                </div>
              </div>
              <p className="grammar-exercise__comparison-why">
                <strong>Why it&apos;s tricky:</strong> {item.frenchComparison.whyDifficult}
              </p>
              {item.frenchComparison.visualHighlighting && (
                <div className="grammar-exercise__highlighting">
                  <span className="grammar-exercise__highlighting-wrong">
                    {item.frenchComparison.visualHighlighting.incorrect}
                  </span>
                  <span className="grammar-exercise__highlighting-arrow">&rarr;</span>
                  <span className="grammar-exercise__highlighting-right">
                    {item.frenchComparison.visualHighlighting.correct}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
