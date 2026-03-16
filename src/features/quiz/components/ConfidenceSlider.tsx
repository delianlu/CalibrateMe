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

function getConfidenceColor(value: number): string {
  if (value < 30) return '#e53e3e';
  if (value < 60) return '#dd6b20';
  if (value < 80) return '#d69e2e';
  return '#38a169';
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
  if (value < 30) return 'rgba(239, 68, 68, 0.04)';
  if (value > 70) return 'rgba(34, 197, 94, 0.04)';
  return 'transparent';
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
        <div className="confidence-slider__zones">
          <span>Guessing</span>
          <span>Certain</span>
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
