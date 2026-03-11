import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { QuizItem } from '../types';

interface FlashcardProps {
  item: QuizItem;
  flipped: boolean;
  onFlip: () => void;
}

/**
 * Flashcard with 3D flip animation.
 * Front: shows the word. Back: shows the translation.
 */
export default function Flashcard({ item, flipped, onFlip }: FlashcardProps) {
  return (
    <motion.div
      className="flashcard-container"
      onClick={!flipped ? onFlip : undefined}
      onKeyDown={!flipped ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } } : undefined}
      role="button"
      tabIndex={!flipped ? 0 : -1}
      aria-label={!flipped ? `Flashcard: ${item.word}. Press Enter to reveal answer` : `Answer: ${item.translation}`}
      whileHover={!flipped ? { scale: 1.02 } : {}}
      whileTap={!flipped ? { scale: 0.98 } : {}}
    >
      <div className={`flashcard ${flipped ? 'flashcard--flipped' : ''}`}>
        {/* Front */}
        <div className="flashcard__face flashcard__front">
          <span className="flashcard__label">What does this mean?</span>
          <span className="flashcard__word">{item.word}</span>
          {item.pronunciation && (
            <span className="flashcard__pronunciation">{item.pronunciation}</span>
          )}
          {!flipped && (
            <span className="flashcard__hint">
              <RotateCcw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Tap to reveal
            </span>
          )}
        </div>

        {/* Back */}
        <div className="flashcard__face flashcard__back">
          <span className="flashcard__label">Answer</span>
          <span className="flashcard__word">{item.translation}</span>
          {item.example && (
            <span className="flashcard__example">{item.example}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
