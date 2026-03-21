import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, BookOpen, Lightbulb, AlertTriangle, Loader2 } from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface GrammarExplanationProps {
  question: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  userConfidence: number;
}

interface ExplanationData {
  explanation: string;
  rule: string;
  tip: string;
  commonMistake: string;
}

const SESSION_CACHE_PREFIX = 'calibrateme_grammar_explain_';
const MAX_EXPLANATIONS_PER_SESSION = 10;
const SESSION_COUNT_KEY = 'calibrateme_grammar_explain_count';

function getSessionCount(): number {
  try {
    return parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  } catch { return 0; }
}

function incrementSessionCount(): void {
  try {
    const current = getSessionCount();
    sessionStorage.setItem(SESSION_COUNT_KEY, String(current + 1));
  } catch { /* ignore */ }
}

function getCacheKey(question: string, userAnswer: string): string {
  return SESSION_CACHE_PREFIX + btoa(encodeURIComponent(question + '|' + userAnswer)).slice(0, 40);
}

function getCachedExplanation(question: string, userAnswer: string): ExplanationData | null {
  try {
    const key = getCacheKey(question, userAnswer);
    const raw = sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function cacheExplanation(question: string, userAnswer: string, data: ExplanationData): void {
  try {
    const key = getCacheKey(question, userAnswer);
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

export default function GrammarExplanation({
  question,
  options,
  userAnswer,
  correctAnswer,
  userConfidence,
}: GrammarExplanationProps) {
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Check cache first
    const cached = getCachedExplanation(question, userAnswer);
    if (cached) {
      setExplanation(cached);
      return;
    }

    // Check rate limit
    if (getSessionCount() >= MAX_EXPLANATIONS_PER_SESSION) {
      setRateLimited(true);
      return;
    }

    const fetchExplanation = async () => {
      setLoading(true);
      try {
        const result = await aiService.explainGrammar({
          question,
          options,
          userAnswer,
          correctAnswer,
          userConfidence,
        });
        setExplanation(result);
        cacheExplanation(question, userAnswer, result);
        incrementSessionCount();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [question, options, userAnswer, correctAnswer, userConfidence]);

  if (rateLimited) {
    return (
      <div className="grammar-ai-explain grammar-ai-explain--limited">
        <p>AI explanations used for this session. Review your mistakes in the session summary.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grammar-ai-explain grammar-ai-explain--loading">
        <Loader2 size={16} className="grammar-ai-explain__spinner" />
        <span>Getting AI explanation...</span>
      </div>
    );
  }

  if (error || !explanation) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="grammar-ai-explain"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grammar-ai-explain__header">
          <Bot size={16} />
          <span>AI Grammar Coach</span>
        </div>

        <div className="grammar-ai-explain__section">
          <div className="grammar-ai-explain__label">
            <BookOpen size={14} />
            <span>Rule: {explanation.rule}</span>
          </div>
        </div>

        <div className="grammar-ai-explain__section">
          <div className="grammar-ai-explain__label">
            <Lightbulb size={14} />
            <span>Explanation</span>
          </div>
          <p>{explanation.explanation}</p>
        </div>

        <div className="grammar-ai-explain__section">
          <div className="grammar-ai-explain__label">
            <AlertTriangle size={14} />
            <span>Why French Speakers Struggle</span>
          </div>
          <p>{explanation.commonMistake}</p>
        </div>

        <div className="grammar-ai-explain__section grammar-ai-explain__section--tip">
          <div className="grammar-ai-explain__label">
            <Lightbulb size={14} />
            <span>Memory Tip</span>
          </div>
          <p>{explanation.tip}</p>
        </div>

        {userConfidence > 70 && (
          <div className="grammar-ai-explain__section grammar-ai-explain__section--overconfidence">
            <p>
              You were {userConfidence}% confident but got this wrong. This is a common pattern — the item
              felt familiar, but the rule has subtle nuances. Next time, try to recall the specific rule
              before rating your confidence.
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
