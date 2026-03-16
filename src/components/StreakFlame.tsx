import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
  showLabel?: boolean;
  className?: string;
}

function getFlameConfig(streak: number) {
  if (streak >= 30) {
    return { size: 28, color: '#ef4444', glowSize: 12, glowColor: 'rgba(239, 68, 68, 0.5)', tier: 'epic' };
  }
  if (streak >= 15) {
    return { size: 24, color: '#f97316', glowSize: 8, glowColor: 'rgba(249, 115, 22, 0.4)', tier: 'large' };
  }
  if (streak >= 4) {
    return { size: 22, color: '#f59e0b', glowSize: 5, glowColor: 'rgba(245, 158, 11, 0.3)', tier: 'medium' };
  }
  return { size: 18, color: '#d97706', glowSize: 3, glowColor: 'rgba(217, 119, 6, 0.2)', tier: 'small' };
}

/**
 * Animated flame icon that grows with streak count.
 * Sways gently and has a glow effect proportional to streak length.
 */
export default function StreakFlame({ streak, showLabel = true, className }: StreakFlameProps) {
  if (streak <= 0) {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Flame size={18} style={{ color: 'var(--text-faint)', opacity: 0.4 }} />
        {showLabel && <span style={{ color: 'var(--text-faint)' }}>0</span>}
      </span>
    );
  }

  const config = getFlameConfig(streak);

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <motion.span
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          display: 'inline-flex',
          filter: `drop-shadow(0 0 ${config.glowSize}px ${config.glowColor})`,
        }}
      >
        <Flame size={config.size} style={{ color: config.color }} />
      </motion.span>
      {showLabel && (
        <span style={{ fontWeight: 700, color: config.color, fontSize: '0.95rem' }}>
          {streak}
        </span>
      )}
    </span>
  );
}
