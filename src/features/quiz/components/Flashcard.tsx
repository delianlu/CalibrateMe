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
    <div className="flashcard-container" onClick={!flipped ? onFlip : undefined}>
      <div className={`flashcard ${flipped ? 'flashcard--flipped' : ''}`}>
        {/* Front */}
        <div className="flashcard__face flashcard__front">
          <span className="flashcard__label">What does this mean?</span>
          <span className="flashcard__word">{item.word}</span>
          {item.pronunciation && (
            <span className="flashcard__pronunciation">{item.pronunciation}</span>
          )}
          {!flipped && (
            <span className="flashcard__hint">Tap to continue</span>
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
    </div>
  );
}
