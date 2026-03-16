import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, BookOpen, BarChart3, User, Gamepad2, FlaskConical, Sun, Moon } from 'lucide-react';

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
}

interface Command {
  id: string;
  label: string;
  description: string;
  icon: typeof Search;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette({ onNavigate, onToggleDarkMode, isDarkMode }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => [
    { id: 'practice', label: 'Practice', description: 'Start a quiz session', icon: Brain, action: () => onNavigate('quiz'), keywords: ['quiz', 'practice', 'start', 'flashcard'] },
    { id: 'vocabulary', label: 'Vocabulary', description: 'Browse vocabulary list', icon: BookOpen, action: () => onNavigate('vocabulary'), keywords: ['vocab', 'words', 'list'] },
    { id: 'analytics', label: 'Analytics', description: 'View calibration analytics', icon: BarChart3, action: () => onNavigate('analytics'), keywords: ['analytics', 'dashboard', 'charts', 'ece'] },
    { id: 'profile', label: 'Profile', description: 'View profile & achievements', icon: User, action: () => onNavigate('profile'), keywords: ['profile', 'achievements', 'xp', 'level'] },
    { id: 'calgame', label: 'Cal Game', description: 'Play calibration training game', icon: Gamepad2, action: () => onNavigate('minigame'), keywords: ['game', 'calibration', 'trivia', 'minigame'] },
    { id: 'simlab', label: 'Sim Lab', description: 'Run simulation lab', icon: FlaskConical, action: () => onNavigate('simulation'), keywords: ['simulation', 'lab', 'experiment'] },
    { id: 'darkmode', label: isDarkMode ? 'Light Mode' : 'Dark Mode', description: 'Toggle dark/light theme', icon: isDarkMode ? Sun : Moon, action: onToggleDarkMode, keywords: ['dark', 'light', 'theme', 'mode', 'toggle'] },
  ], [onNavigate, onToggleDarkMode, isDarkMode]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some(k => k.includes(q))
    );
  }, [query, commands]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      // Number shortcuts 1-6 for tabs (only when palette is closed and no input focused)
      if (!open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        const tabMap: Record<string, string> = {
          '1': 'quiz', '2': 'vocabulary', '3': 'analytics',
          '4': 'profile', '5': 'minigame', '6': 'simulation',
        };
        if (tabMap[e.key]) {
          onNavigate(tabMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onNavigate]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const executeCommand = useCallback((cmd: Command) => {
    cmd.action();
    setOpen(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    }
  }, [filtered, selectedIndex, executeCommand]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="command-palette__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="command-palette"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="command-palette__input-wrapper">
              <Search size={18} className="command-palette__search-icon" />
              <input
                ref={inputRef}
                className="command-palette__input"
                type="text"
                placeholder="Type a command..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <kbd className="command-palette__kbd">esc</kbd>
            </div>
            <div className="command-palette__list">
              {filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    className={`command-palette__item${i === selectedIndex ? ' command-palette__item--active' : ''}`}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <Icon size={18} className="command-palette__item-icon" />
                    <div className="command-palette__item-text">
                      <span className="command-palette__item-label">{cmd.label}</span>
                      <span className="command-palette__item-desc">{cmd.description}</span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="command-palette__empty">No matching commands</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
