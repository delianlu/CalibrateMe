import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Plus, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface GeneratedCard {
  word: string;
  translation: string;
  difficulty: number;
  tags: string[];
  exampleSentence: string;
  mnemonic: string;
}

interface AIFlashcardGeneratorProps {
  onAddCards: (cards: Array<{
    id: string;
    word: string;
    translation: string;
    difficulty: number;
    tags: string[];
    example: string;
  }>) => void;
  onClose: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type Status = 'idle' | 'loading' | 'preview' | 'error';

const COUNT_OPTIONS = [5, 10, 15, 20];
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard'];

export default function AIFlashcardGenerator({ onAddCards, onClose }: AIFlashcardGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [status, setStatus] = useState<Status>('idle');
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const result = await aiService.generateFlashcards({ topic: topic.trim(), count, difficulty });
      const flashcards: GeneratedCard[] = result.flashcards || [];
      if (flashcards.length === 0) throw new Error('No flashcards returned');
      setCards(flashcards);
      setStatus('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed. Try again.');
      setStatus('error');
    }
  };

  const handleRemoveCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAll = () => {
    const now = Date.now();
    const quizItems = cards.map((card, idx) => ({
      id: `ai-${now}-${idx}`,
      word: card.word,
      translation: card.translation,
      difficulty: card.difficulty,
      tags: [...card.tags, 'ai-generated'],
      example: card.exampleSentence,
    }));
    onAddCards(quizItems);
    onClose();
  };

  return (
    <motion.div
      className="ai-generator-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="ai-generator card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ai-generator__header">
          <div className="ai-generator__title">
            <Sparkles size={20} />
            <h3>AI Flashcard Generator</h3>
          </div>
          <button className="ai-generator__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {(status === 'idle' || status === 'error') && (
          <div className="ai-generator__form">
            <div className="ai-generator__field">
              <label htmlFor="ai-topic">Topic</label>
              <input
                id="ai-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g., "Business meetings", "Food", "Academic writing"'
                className="ai-generator__input"
                autoFocus
              />
            </div>

            <div className="ai-generator__field">
              <label>Count</label>
              <div className="ai-generator__options">
                {COUNT_OPTIONS.map(n => (
                  <button
                    key={n}
                    className={`ai-generator__option-btn ${count === n ? 'ai-generator__option-btn--active' : ''}`}
                    onClick={() => setCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-generator__field">
              <label>Difficulty</label>
              <div className="ai-generator__options">
                {DIFFICULTY_OPTIONS.map(d => (
                  <button
                    key={d}
                    className={`ai-generator__option-btn ${difficulty === d ? 'ai-generator__option-btn--active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && (
              <div className="ai-generator__error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-block"
              onClick={handleGenerate}
              disabled={!topic.trim()}
            >
              <Sparkles size={16} style={{ marginRight: 6 }} />
              Generate Flashcards
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="ai-generator__loading">
            <Loader2 size={32} className="ai-generator__spinner" />
            <p>Generating with AI...</p>
            <div className="ai-generator__skeleton-grid">
              {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                <div key={i} className="ai-generator__skeleton-card">
                  <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 6, marginTop: 8 }} />
                  <div className="skeleton" style={{ width: '80%', height: 10, borderRadius: 4, marginTop: 8 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'preview' && (
          <div className="ai-generator__preview">
            <p className="ai-generator__preview-count">
              <BookOpen size={14} style={{ marginRight: 4 }} />
              {cards.length} cards generated
            </p>
            <div className="ai-generator__preview-grid">
              <AnimatePresence>
                {cards.map((card, i) => (
                  <motion.div
                    key={`${card.word}-${i}`}
                    className="ai-generator__card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <button
                      className="ai-generator__card-remove"
                      onClick={() => handleRemoveCard(i)}
                      aria-label={`Remove ${card.word}`}
                    >
                      <X size={14} />
                    </button>
                    <span className="ai-generator__card-badge">AI Generated</span>
                    <div className="ai-generator__card-word">{card.word}</div>
                    <div className="ai-generator__card-translation">{card.translation}</div>
                    <div className="ai-generator__card-example">{card.exampleSentence}</div>
                    <div className="ai-generator__card-mnemonic">{card.mnemonic}</div>
                    <div className="ai-generator__card-tags">
                      {card.tags.map(tag => (
                        <span key={tag} className="ai-generator__card-tag">{tag}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="ai-generator__preview-actions">
              <button
                className="btn btn-primary"
                onClick={handleAddAll}
                disabled={cards.length === 0}
              >
                <Plus size={16} style={{ marginRight: 6 }} />
                Add All to Vocabulary ({cards.length})
              </button>
              <button className="btn btn-secondary" onClick={() => { setStatus('idle'); setCards([]); }}>
                Discard
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
