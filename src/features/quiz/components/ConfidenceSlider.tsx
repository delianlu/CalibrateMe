import { useState, useRef, useCallback, useMemo } from 'react';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  onSubmit: (value: number) => void;
  disabled?: boolean;
}

const MARKS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

const CONFIDENCE_ZONES = [
  { min: 0, max: 25, label: 'Guessing', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
  { min: 26, max: 75, label: 'Unsure', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  { min: 76, max: 100, label: 'Confident', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.08)' },
];

function getConfidenceZone(value: number) {
  return CONFIDENCE_ZONES.find(z => value >= z.min && value <= z.max) ?? CONFIDENCE_ZONES[1];
}

function getConfidenceColor(value: number): string {
  return getConfidenceZone(value).color;
}

function getConfidenceLabel(value: number): string {
  if (value < 20) return 'Very unsure';
  if (value < 40) return 'Unsure';
  if (value < 60) return 'Somewhat sure';
  if (value < 80) return 'Fairly sure';
  return 'Very sure';
}

function getConfidenceEmoji(value: number): string {
  if (value < 20) return '🤷';
  if (value < 50) return '🤔';
  if (value < 80) return '😊';
  return '💪';
}

function getZoneTint(value: number): string {
  return getConfidenceZone(value).bg;
}

/**
 * 0-100 confidence slider with color gradient, tick marks,
 * haptic-like visual feedback, and a submit button.
 */
export default function ConfidenceSlider({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: ConfidenceSliderProps) {
  const [, setIsDragging] = useState(false);
  const [tickSnap, setTickSnap] = useState(false);
  const lastTickRef = useRef(-1);
  const color = getConfidenceColor(value);
  const emoji = useMemo(() => getConfidenceEmoji(value), [value]);
  const zoneTint = useMemo(() => getZoneTint(value), [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);

    // Tick snap at every 10% mark
    const currentTick = Math.floor(newValue / 10);
    if (currentTick !== lastTickRef.current && newValue % 10 === 0) {
      setTickSnap(true);
      setTimeout(() => setTickSnap(false), 150);
    }
    lastTickRef.current = currentTick;
  }, [onChange]);

  return (
    <div
      className="confidence-slider"
      style={{ background: zoneTint, transition: 'background 0.3s ease' }}
    >
      <div className="confidence-slider__header">
        <span className="confidence-slider__title">How confident are you?</span>
        <span
          className="confidence-slider__value"
          style={{ color }}
        >
          <span className="confidence-slider__emoji">{emoji}</span>
          {value}%
        </span>
      </div>

      <span className="confidence-slider__label" style={{ color }}>
        {getConfidenceLabel(value)}
      </span>

      <div className="confidence-slider__track-wrapper">
        <div className="confidence-slider__tick-marks" aria-hidden="true">
          {[25, 50, 75].map(pos => (
            <div key={pos} className="confidence-slider__tick" style={{ left: `${pos}%` }} />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className={`confidence-slider__input${tickSnap ? ' confidence-slider__input--snap' : ''}`}
          aria-label="Confidence level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value}% - ${getConfidenceLabel(value)}`}
        />
        <div className="confidence-slider__zone-bar" aria-hidden="true">
          {CONFIDENCE_ZONES.map(zone => (
            <div
              key={zone.label}
              className={`confidence-slider__zone${value >= zone.min && value <= zone.max ? ' confidence-slider__zone--active' : ''}`}
              style={{
                flex: zone.max - zone.min + 1,
                background: value >= zone.min && value <= zone.max ? zone.bg : 'transparent',
                borderBottom: `3px solid ${zone.color}`,
              }}
            >
              <span style={{ color: zone.color, fontWeight: value >= zone.min && value <= zone.max ? 700 : 400 }}>
                {zone.label}
              </span>
            </div>
          ))}
        </div>
        <div className="confidence-slider__marks">
          {MARKS.map(mark => (
            <div
              key={mark.value}
              className="confidence-slider__mark"
              style={{ left: `${mark.value}%` }}
            >
              <span className="confidence-slider__mark-label">{mark.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-block confidence-slider__submit"
        onClick={() => onSubmit(value)}
        disabled={disabled}
      >
        Submit Confidence
      </button>
    </div>
  );
}
