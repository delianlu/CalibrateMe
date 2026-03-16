import { QuizItem } from '../../quiz/types';

interface VocabularyCardProps {
  item: QuizItem;
  onDelete?: (id: string) => void;
}

type MasteryLevel = 'new' | 'learning' | 'mastered' | 'stale';

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

function getMasteryLevel(item: QuizItem): MasteryLevel {
  // Fall back to 'new' if no response data exists
  const hasData = (item as unknown as Record<string, unknown>).lastReviewed || (item as unknown as Record<string, unknown>).kHat !== undefined;
  if (!hasData) return 'new';

  const kHat = ((item as unknown as Record<string, unknown>).kHat as number) ?? 0;
  const lastReviewed = (item as unknown as Record<string, unknown>).lastReviewed as string | undefined;

  if (lastReviewed) {
    const daysSince = (Date.now() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
    if (kHat >= 0.7 && daysSince > 7) return 'stale';
    if (kHat >= 0.7) return 'mastered';
  }

  if (kHat >= 0.7) return 'mastered';
  if (kHat > 0) return 'learning';
  return 'new';
}

function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'new': return '#EF4444';
    case 'learning': return '#F59E0B';
    case 'mastered': return '#22C55E';
    case 'stale': return '#6B7280';
  }
}

function getReviewedText(item: QuizItem): string {
  const lastReviewed = (item as unknown as Record<string, unknown>).lastReviewed as string | undefined;
  if (!lastReviewed) return 'Not yet reviewed';
  const daysSince = Math.floor((Date.now() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince === 0) return 'Reviewed today';
  if (daysSince === 1) return 'Reviewed yesterday';
  return `Reviewed ${daysSince} days ago`;
}

export default function VocabularyCard({ item, onDelete }: VocabularyCardProps) {
  const mastery = getMasteryLevel(item);
  const masteryColor = getMasteryColor(mastery);
  const kHat = ((item as unknown as Record<string, unknown>).kHat as number) ?? 0;
  const hasData = mastery !== 'new';

  return (
    <div className={`vocab-card vocab-card--${mastery}`}>
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
      {hasData && (
        <div className="vocab-card__progress-bar">
          <div
            className="vocab-card__progress-fill"
            style={{ width: `${Math.min(100, kHat * 100)}%`, background: masteryColor }}
          />
        </div>
      )}
      <span className="vocab-card__reviewed">{getReviewedText(item)}</span>
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
