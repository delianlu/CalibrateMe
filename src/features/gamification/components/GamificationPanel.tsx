import { GamificationState } from '../types';
import XPBar from './XPBar';
import StreakDisplay from './StreakDisplay';
import AchievementList from './AchievementList';

interface GamificationPanelProps {
  state: GamificationState;
}

export default function GamificationPanel({ state }: GamificationPanelProps) {
  return (
    <div className="gamification-panel card">
      <h3 className="gamification-panel__title">Progress & Achievements</h3>

      <div className="gamification-panel__top">
        <XPBar xp={state.xp} level={state.level} />
        <StreakDisplay current={state.dailyStreak} longest={state.longestStreak} />
      </div>

      <AchievementList unlocked={state.achievements} />
    </div>
  );
}
