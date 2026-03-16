import { motion } from 'framer-motion';
import { QuizResponse } from '../types';

interface QuizProgressPathProps {
  current: number;
  total: number;
  responses: QuizResponse[];
}

/**
 * Visual progress path showing dots for each quiz item,
 * color-coded by result (Duolingo-inspired).
 */
export default function QuizProgressPath({ current, total, responses }: QuizProgressPathProps) {
  return (
    <div className="quiz-progress-path" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total} aria-label={`Question ${current} of ${total}`}>
      <div className="quiz-progress-path__dots">
        {Array.from({ length: total }, (_, i) => {
          const response = responses[i];
          const isCurrent = i === current;
          const isCompleted = i < current;

          let dotClass = 'quiz-progress-path__dot';
          if (isCurrent) {
            dotClass += ' quiz-progress-path__dot--current';
          } else if (isCompleted && response) {
            dotClass += response.correctness
              ? ' quiz-progress-path__dot--correct'
              : ' quiz-progress-path__dot--incorrect';
          }

          return (
            <motion.div
              key={i}
              className={dotClass}
              initial={false}
              animate={
                isCurrent
                  ? { scale: [1, 1.3, 1] }
                  : isCompleted
                  ? { scale: 1 }
                  : {}
              }
              transition={
                isCurrent
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            >
              {isCompleted && response && (
                <span className="quiz-progress-path__dot-icon">
                  {response.correctness ? '✓' : '✗'}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      <span className="quiz-progress-path__text">
        {current + 1} / {total}
      </span>
    </div>
  );
}
