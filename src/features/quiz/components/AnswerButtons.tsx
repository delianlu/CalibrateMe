interface AnswerButtonsProps {
  onCorrect: () => void;
  onIncorrect: () => void;
}

/**
 * Self-grading buttons: user marks whether they got the answer correct.
 */
export default function AnswerButtons({ onCorrect, onIncorrect }: AnswerButtonsProps) {
  return (
    <div className="answer-buttons">
      <span className="answer-buttons__prompt">Did you know the answer?</span>
      <div className="answer-buttons__row">
        <button
          className="answer-buttons__btn answer-buttons__btn--incorrect"
          onClick={onIncorrect}
        >
          Incorrect
        </button>
        <button
          className="answer-buttons__btn answer-buttons__btn--correct"
          onClick={onCorrect}
        >
          Correct
        </button>
      </div>
    </div>
  );
}
