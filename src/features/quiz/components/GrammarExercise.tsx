import { useState } from 'react';
import { QuizItem } from '../types';

interface GrammarExerciseProps {
  item: QuizItem;
  phase: 'show-word' | 'rate-confidence' | 'reveal-answer' | 'feedback';
  onAnswer: (selectedOption: string) => void;
}

/**
 * Renders a grammar exercise (multiple-choice or error_correction) from OffGrid activities.
 * Replaces the flashcard for grammar-type QuizItems.
 */
export default function GrammarExercise({ item, phase, onAnswer }: GrammarExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isAnswered = phase === 'reveal-answer' || phase === 'feedback';
  const isCorrect = selectedOption === item.answer;

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    onAnswer(option);
  };

  const isErrorCorrection = item.itemType === 'error_correction';

  return (
    <div className="grammar-exercise card">
      {/* Scenario context */}
      {item.scenario && (
        <div className="grammar-exercise__scenario">
          <span className="grammar-exercise__scenario-icon">{item.scenario.icon}</span>
          <span className="grammar-exercise__scenario-name">{item.scenario.name}</span>
          <p className="grammar-exercise__scenario-context">{item.scenario.context}</p>
        </div>
      )}

      {/* Category badge */}
      <div className="grammar-exercise__meta">
        {item.category && (
          <span className="grammar-exercise__category">{item.category}</span>
        )}
        {isErrorCorrection && (
          <span className="grammar-exercise__type-badge">Find the Error</span>
        )}
      </div>

      {/* Question */}
      <div className="grammar-exercise__question">
        <p>{item.question}</p>
      </div>

      {/* Options */}
      <div className="grammar-exercise__options" role="radiogroup" aria-label="Answer options">
        {item.options?.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === item.answer;
          let className = 'grammar-exercise__option';

          if (isAnswered) {
            if (isCorrectOption) {
              className += ' grammar-exercise__option--correct';
            } else if (isSelected && !isCorrectOption) {
              className += ' grammar-exercise__option--incorrect';
            }
          } else if (isSelected) {
            className += ' grammar-exercise__option--selected';
          }

          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Option: ${option}`}
            >
              <span className="grammar-exercise__option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="grammar-exercise__option-text">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback section (shown after answer) */}
      {isAnswered && (
        <div className={`grammar-exercise__feedback ${isCorrect ? 'grammar-exercise__feedback--correct' : 'grammar-exercise__feedback--incorrect'}`}>
          <div className="grammar-exercise__result">
            {isCorrect ? 'Correct!' : `Incorrect — the answer is: ${item.answer}`}
          </div>

          {/* Correction for error_correction type */}
          {item.correction && (
            <div className="grammar-exercise__correction">
              <strong>Correction:</strong> {item.correction}
            </div>
          )}

          {/* Feedback explanation */}
          {item.feedback && (
            <p className="grammar-exercise__explanation">{item.feedback}</p>
          )}

          {/* French comparison */}
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
                <strong>Why it's tricky:</strong> {item.frenchComparison.whyDifficult}
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

          {/* False cognate info */}
          {item.falseCognate && (
            <div className="grammar-exercise__false-cognate">
              <div className="grammar-exercise__cognate-title">False Cognate Alert</div>
              <div className="grammar-exercise__cognate-pair">
                <div>
                  <strong>English "{item.falseCognate.englishWord}":</strong>{' '}
                  {item.falseCognate.englishMeaning}
                </div>
                <div>
                  <strong>French "{item.falseCognate.frenchWord}":</strong>{' '}
                  {item.falseCognate.frenchMeaning}
                </div>
              </div>
              <p className="grammar-exercise__cognate-mistake">
                <strong>Common mistake:</strong> {item.falseCognate.commonMistake}
              </p>
              <p className="grammar-exercise__cognate-trick">
                <strong>Memory trick:</strong> {item.falseCognate.memoryTrick}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
