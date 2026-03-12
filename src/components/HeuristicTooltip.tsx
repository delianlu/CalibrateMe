import { useState, useRef, useEffect } from 'react';

interface HeuristicTooltipProps {
  label: string;
}

export default function HeuristicTooltip({ label }: HeuristicTooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <span
      ref={tooltipRef}
      className="heuristic-tooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
      role="note"
      aria-label={label}
    >
      <span className="heuristic-tooltip__icon" aria-hidden="true">ⓘ</span>
      {visible && (
        <span className="heuristic-tooltip__popup">{label}</span>
      )}
    </span>
  );
}
