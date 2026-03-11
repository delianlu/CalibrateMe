import { Check, X } from 'lucide-react';

interface AnswerButtonsProps {
  onCorrect: () => void;
  onIncorrect: () => void;
}

/**
 * Self-grading buttons: user marks whether they got the answer correct.
 */
export default function AnswerButtons({ onCorrect, onIncorrect }: AnswerButtonsProps) {
  return (
    <div className="answer-buttons" role="group" aria-label="Self-grading">
      <span className="answer-buttons__prompt" id="answer-prompt">Did you know the answer?</span>
      <div className="answer-buttons__row" aria-labelledby="answer-prompt">
        <button
          className="answer-buttons__btn answer-buttons__btn--incorrect"
          onClick={onIncorrect}
          aria-label="I got it incorrect"
        >
          <X size={20} />
          Incorrect
        </button>
        <button
          className="answer-buttons__btn answer-buttons__btn--correct"
          onClick={onCorrect}
          aria-label="I got it correct"
        >
          <Check size={20} />
          Correct
        </button>
      </div>
    </div>
  );
}
