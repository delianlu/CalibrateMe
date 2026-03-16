import StreakFlame from '../../../components/StreakFlame';

interface StreakDisplayProps {
  current: number;
  longest: number;
}

export default function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="streak-display">
      <div className="streak-display__current">
        <StreakFlame streak={current} showLabel={false} />
        <span className="streak-display__number">{current}</span>
        <span className="streak-display__label">Day Streak</span>
      </div>
      <div className="streak-display__best">
        Best: {longest} days
      </div>
    </div>
  );
}
