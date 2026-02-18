import { useState } from 'react';

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

/**
 * 0-100 confidence slider with color gradient, tick marks,
 * and a submit button.
 */
export default function ConfidenceSlider({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: ConfidenceSliderProps) {
  const [, setIsDragging] = useState(false);
  const color = getConfidenceColor(value);

  return (
    <div className="confidence-slider">
      <div className="confidence-slider__header">
        <span className="confidence-slider__title">How confident are you?</span>
        <span
          className="confidence-slider__value"
          style={{ color }}
        >
          {value}%
        </span>
      </div>

      <span className="confidence-slider__label" style={{ color }}>
        {getConfidenceLabel(value)}
      </span>

      <div className="confidence-slider__track-wrapper">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className="confidence-slider__input"
          style={{
            background: `linear-gradient(to right, ${color} ${value}%, #e2e8f0 ${value}%)`,
          }}
        />
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
