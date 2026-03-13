import { Star } from 'lucide-react';
import { xpForLevel } from '../types';
import ProgressRing from '../../../components/ProgressRing';

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
        <ProgressRing progress={Math.min(100, progress)} size={52} strokeWidth={5}>
          <span className="xp-bar__ring-level">{level}</span>
        </ProgressRing>
        <div className="xp-bar__header-text">
          <span className="xp-bar__level">
            <Star size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Level {level}
          </span>
          <span className="xp-bar__xp">{xp} / {nextLevelXP} XP</span>
        </div>
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
