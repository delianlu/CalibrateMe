import { UnlockedAchievement } from '../types';
import { achievements } from '../achievements';

interface AchievementListProps {
  unlocked: UnlockedAchievement[];
}

export default function AchievementList({ unlocked }: AchievementListProps) {
  const unlockedIds = new Set(unlocked.map(a => a.achievementId));

  return (
    <div className="achievement-list">
      <h4 className="achievement-list__title">
        Achievements ({unlocked.length}/{achievements.length})
      </h4>
      <div className="achievement-list__grid">
        {achievements.map(ach => {
          const isUnlocked = unlockedIds.has(ach.id);
          return (
            <div
              key={ach.id}
              className={`achievement-badge ${isUnlocked ? 'achievement-badge--unlocked' : 'achievement-badge--locked'}`}
              title={isUnlocked ? `${ach.title}: ${ach.description}` : '???'}
            >
              <span className="achievement-badge__icon">{isUnlocked ? ach.icon : '?'}</span>
              <span className="achievement-badge__label">
                {isUnlocked ? ach.title : '???'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
