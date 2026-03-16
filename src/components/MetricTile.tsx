import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface MetricTileProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  accent?: 'blue' | 'green' | 'purple' | 'amber';
  animate?: boolean;
  index?: number;
}

export default function MetricTile({ icon: Icon, value, label, accent = 'blue', animate = true, index = 0 }: MetricTileProps) {
  return (
    <motion.div
      className={`metric-tile metric-tile--${accent}`}
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="metric-tile__icon">
        <Icon size={16} />
      </div>
      <span className="metric-tile__value">{value}</span>
      <span className="metric-tile__label">{label}</span>
    </motion.div>
  );
}
