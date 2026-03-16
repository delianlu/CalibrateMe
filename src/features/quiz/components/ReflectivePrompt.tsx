import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ReflectivePromptProps {
  confidence: number;
  onDismiss: (reason: string | null) => void;
}

const REASONS = [
  { id: 'slip', label: 'It was a slip — I actually knew this' },
  { id: 'misunderstood', label: 'I misunderstood the concept' },
  { id: 'familiar', label: 'It felt familiar, but I didn\'t truly know it' },
  { id: 'guessed', label: 'I was guessing confidently' },
];

export default function ReflectivePrompt({ confidence, onDismiss }: ReflectivePromptProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <motion.div
      className="reflective-prompt-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="reflective-prompt card"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="reflective-prompt__icon">
          <AlertTriangle size={24} color="var(--color-warning)" />
        </div>
        <h3 className="reflective-prompt__title">
          You rated {confidence}% confident, but got it wrong
        </h3>
        <p className="reflective-prompt__subtitle">
          Quick reflection: What happened?
        </p>
        <div className="reflective-prompt__options">
          {REASONS.map(r => (
            <button
              key={r.id}
              className={`reflective-prompt__option${selected === r.id ? ' reflective-prompt__option--selected' : ''}`}
              onClick={() => setSelected(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary btn-block reflective-prompt__continue"
          onClick={() => onDismiss(selected)}
        >
          {selected ? 'Continue' : 'Skip'}
        </button>
      </motion.div>
    </motion.div>
  );
}
