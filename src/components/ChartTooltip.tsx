interface PayloadEntry {
  color?: string;
  name?: string;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string | number;
  formatter?: (value: number | string) => string;
}

export default function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined && (
        <div className="chart-tooltip__label">{label}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: entry.color }} />
          <span className="chart-tooltip__name">{entry.name}</span>
          <span className="chart-tooltip__value">
            {formatter && entry.value !== undefined ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
