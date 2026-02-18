import { xpForLevel } from '../types';

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progress = nextLevelXP > currentLevelXP
    ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100;

  return (
    <div className="xp-bar">
      <div className="xp-bar__header">
        <span className="xp-bar__level">Level {level}</span>
        <span className="xp-bar__xp">{xp} / {nextLevelXP} XP</span>
      </div>
      <div className="xp-bar__track">
        <div
          className="xp-bar__fill"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
