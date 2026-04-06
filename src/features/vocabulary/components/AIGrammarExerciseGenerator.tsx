import { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Loader2, Sparkles } from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface GeneratedExercise {
  question: string;
  answer: string;
  options?: string[];
  exerciseType: string;
  difficulty: number;
  explanation: string;
  frenchComparison: string;
  tags: string[];
}

interface AIGrammarExerciseGeneratorProps {
  onExercisesGenerated?: (exercises: GeneratedExercise[]) => void;
}

const GRAMMAR_TOPICS = [
  'Articles (a/an/the)',
  'Present Simple vs Present Continuous',
  'Past Simple vs Present Perfect',
  'Prepositions of place and time',
  'Subject-Verb Agreement',
  'Conditionals (if-then)',
  'Passive Voice',
  'Reported Speech',
  'Modal Verbs',
  'Word Order',
  'Relative Clauses',
  'Comparatives and Superlatives',
];

const EXERCISE_TYPES = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'error_correction', label: 'Error Correction' },
  { value: 'fill-blank-typing', label: 'Fill in the Blank' },
  { value: 'sentence-reorder', label: 'Sentence Reorder' },
] as const;

export default function AIGrammarExerciseGenerator({ onExercisesGenerated }: AIGrammarExerciseGeneratorProps) {
  const [topic, setTopic] = useState(GRAMMAR_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple-choice']);
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<GeneratedExercise[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      setError('Please select at least one exercise type.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await aiService.generateGrammarExercises({
        topic: customTopic || topic,
        count,
        difficulty,
        exerciseTypes: selectedTypes as any[],
        cefrLevel: cefrLevel as any,
      });
      setExercises(result.exercises || []);
      onExercisesGenerated?.(result.exercises || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate exercises');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Sparkles size={20} />
        <h3 style={{ margin: 0 }}>AI Grammar Exercise Generator</h3>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {/* Topic Selection */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>
            Grammar Topic
          </label>
          <select
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setCustomTopic(''); }}
            className="input"
            style={{ width: '100%' }}
          >
            {GRAMMAR_TOPICS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="custom">Custom topic...</option>
          </select>
          {topic === 'custom' && (
            <input
              type="text"
              className="input"
              placeholder="Enter a custom grammar topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
            />
          )}
        </div>

        {/* Exercise Types */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>
            Exercise Types
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXERCISE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                className={`btn btn-sm ${selectedTypes.includes(value) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleType(value)}
                style={{ fontSize: 12 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>Count</label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input" style={{ width: '100%' }}>
              {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} exercises</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="input" style={{ width: '100%' }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>CEFR</label>
            <select value={cefrLevel} onChange={(e) => setCefrLevel(e.target.value)} className="input" style={{ width: '100%' }}>
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <p style={{ color: 'var(--color-error)', fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 size={16} className="grammar-ai-explain__spinner" /> Generating...</>
          ) : (
            <><PenTool size={16} /> Generate Exercises</>
          )}
        </button>
      </div>

      {/* Generated Exercises Preview */}
      {exercises.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px' }}>Generated Exercises ({exercises.length})</h4>
          {exercises.map((ex, i) => (
            <motion.div
              key={i}
              className="card"
              style={{ marginBottom: 8, padding: 12 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', opacity: 0.6 }}>
                  {ex.exerciseType}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {ex.tags?.map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--color-surface-2)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ margin: '0 0 4px', fontWeight: 500 }}>{ex.question}</p>
              {ex.options?.length ? (
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  {ex.options.map((opt, j) => (
                    <div key={j} style={{ color: opt === ex.answer ? 'var(--color-success)' : 'inherit' }}>
                      {String.fromCharCode(65 + j)}) {opt} {opt === ex.answer ? ' \u2713' : ''}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--color-success)', margin: '0 0 4px' }}>Answer: {ex.answer}</p>
              )}
              <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 0', fontStyle: 'italic' }}>{ex.explanation}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
