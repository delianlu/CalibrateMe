interface QuizProgressProps {
  current: number;
  total: number;
}

/**
 * Progress bar with item count for the current quiz session.
 */
export default function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="quiz-progress">
      <div className="quiz-progress__bar">
        <div
          className="quiz-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="quiz-progress__text">
        {current} / {total}
      </span>
    </div>
  );
}
