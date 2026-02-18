import { QuizItem } from '../../quiz/types';

interface VocabularyCardProps {
  item: QuizItem;
  onDelete?: (id: string) => void;
}

function getDifficultyLabel(d: number): string {
  if (d < 0.4) return 'Easy';
  if (d < 0.65) return 'Medium';
  return 'Hard';
}

function getDifficultyClass(d: number): string {
  if (d < 0.4) return 'vocab-card__diff--easy';
  if (d < 0.65) return 'vocab-card__diff--medium';
  return 'vocab-card__diff--hard';
}

export default function VocabularyCard({ item, onDelete }: VocabularyCardProps) {
  return (
    <div className="vocab-card">
      <div className="vocab-card__main">
        <span className="vocab-card__word">{item.word}</span>
        <span className="vocab-card__translation">{item.translation}</span>
      </div>
      <div className="vocab-card__meta">
        <span className={`vocab-card__diff ${getDifficultyClass(item.difficulty)}`}>
          {getDifficultyLabel(item.difficulty)}
        </span>
        {item.tags.map(tag => (
          <span key={tag} className="vocab-card__tag">{tag}</span>
        ))}
      </div>
      {onDelete && (
        <button
          className="vocab-card__delete"
          onClick={() => onDelete(item.id)}
          title="Delete item"
        >
          &times;
        </button>
      )}
    </div>
  );
}
