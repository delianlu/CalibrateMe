import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Loader2, Mic, AlertTriangle } from 'lucide-react';
import { aiService } from '../../../services/aiService';

interface PronunciationGuideProps {
  words: Array<{
    word: string;
    translation: string;
  }>;
}

interface PronunciationEntry {
  word: string;
  ipa: string;
  phonetic: string;
  tips: string;
  commonErrors: string;
  audioDescription: string;
}

export default function PronunciationGuide({ words }: PronunciationGuideProps) {
  const [entries, setEntries] = useState<PronunciationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await aiService.getPronunciationGuide(words.slice(0, 10));
      setEntries(result.entries || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 20 }}>
        <Volume2 size={28} style={{ opacity: 0.5, marginBottom: 8 }} />
        <h3 style={{ margin: '0 0 6px' }}>Pronunciation Guide</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 12px' }}>
          Get AI-powered pronunciation tips for {words.length} words, tailored for French speakers.
        </p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || words.length === 0}>
          {loading ? (
            <><Loader2 size={16} className="grammar-ai-explain__spinner" /> Generating...</>
          ) : (
            <><Mic size={16} /> Generate Pronunciation Guide</>
          )}
        </button>
        {error && <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>Failed to generate guide.</p>}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Volume2 size={20} />
        <h3 style={{ margin: 0 }}>Pronunciation Guide</h3>
        <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 'auto' }}>{entries.length} words</span>
      </div>

      {entries.map((entry, i) => (
        <motion.div
          key={entry.word}
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            background: 'var(--color-surface-2)',
            cursor: 'pointer',
          }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => setExpanded(expanded === entry.word ? null : entry.word)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{entry.word}</span>
              <span style={{ marginLeft: 8, fontSize: 13, opacity: 0.6 }}>{entry.ipa}</span>
            </div>
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
              {entry.phonetic}
            </span>
          </div>

          {expanded === entry.word && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginTop: 10 }}
            >
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <Mic size={12} />
                  <strong style={{ fontSize: 12 }}>How to Pronounce</strong>
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>{entry.audioDescription}</p>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <Volume2 size={12} />
                  <strong style={{ fontSize: 12 }}>Tips</strong>
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>{entry.tips}</p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <AlertTriangle size={12} />
                  <strong style={{ fontSize: 12 }}>Common French Speaker Errors</strong>
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>{entry.commonErrors}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}

      <button className="btn btn-secondary" onClick={() => setEntries([])} style={{ marginTop: 8 }}>
        Generate for Different Words
      </button>
    </div>
  );
}
