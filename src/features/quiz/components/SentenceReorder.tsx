import { useState, useCallback } from 'react';
import { QuizItem } from '../types';

interface SentenceReorderProps {
  item: QuizItem;
  phase: 'show-word' | 'rate-confidence' | 'reveal-answer' | 'feedback';
  onAnswer: (selectedOption: string) => void;
}

/**
 * Renders a sentence-reorder exercise where the learner arranges scrambled words.
 */
export default function SentenceReorder({ item, phase, onAnswer }: SentenceReorderProps) {
  const [availableWords, setAvailableWords] = useState<string[]>(() =>
    item.options ? [...item.options] : []
  );
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const isAnswered = phase === 'reveal-answer' || phase === 'feedback';

  const userSentence = selectedWords.join(' ');
  const isCorrect =
    userSentence.toLowerCase() === item.answer?.toLowerCase() ||
    item.acceptableAnswers?.some(a => a.toLowerCase() === userSentence.toLowerCase()) ||
    false;

  const handleWordClick = useCallback((word: string, index: number) => {
    if (isAnswered || submitted) return;
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
    setSelectedWords(prev => [...prev, word]);
  }, [isAnswered, submitted]);

  const handleRemoveWord = useCallback((word: string, index: number) => {
    if (isAnswered || submitted) return;
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => [...prev, word]);
  }, [isAnswered, submitted]);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length === 0 || submitted) return;
    setSubmitted(true);
    onAnswer(userSentence);
  }, [selectedWords, submitted, onAnswer, userSentence]);

  return (
    <div className="grammar-exercise card">
      {/* Category badge */}
      <div className="grammar-exercise__meta">
        {item.category && (
          <span className="grammar-exercise__category">{item.category}</span>
        )}
        <span className="grammar-exercise__type-badge">Reorder Words</span>
      </div>

      {/* Instruction */}
      <div className="grammar-exercise__question">
        <p>Arrange the words to form a correct sentence:</p>
      </div>

      {/* Selected words (sentence being built) */}
      <div className="sentence-reorder__answer-area" aria-label="Your sentence">
        {selectedWords.length === 0 ? (
          <span className="sentence-reorder__placeholder">Tap words below to build the sentence</span>
        ) : (
          selectedWords.map((word, idx) => (
            <button
              key={`sel-${idx}`}
              className={`sentence-reorder__word sentence-reorder__word--selected${
                isAnswered
                  ? isCorrect
                    ? ' sentence-reorder__word--correct'
                    : ' sentence-reorder__word--incorrect'
                  : ''
              }`}
              onClick={() => handleRemoveWord(word, idx)}
              disabled={isAnswered}
              aria-label={`Remove ${word}`}
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Available words */}
      <div className="sentence-reorder__word-bank" aria-label="Available words">
        {availableWords.map((word, idx) => (
          <button
            key={`avail-${idx}`}
            className="sentence-reorder__word sentence-reorder__word--available"
            onClick={() => handleWordClick(word, idx)}
            disabled={isAnswered}
            aria-label={`Add ${word}`}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Submit button */}
      {!isAnswered && !submitted && availableWords.length === 0 && selectedWords.length > 0 && (
        <button
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          style={{ marginTop: '1rem' }}
        >
          Check Answer
        </button>
      )}

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
