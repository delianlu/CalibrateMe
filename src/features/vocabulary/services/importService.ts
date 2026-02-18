// =============================================================================
// Import Service — Parse CSV, JSON, and Anki-format data into QuizItems
// =============================================================================

import { QuizItem } from '../../quiz/types';
import { ImportFormat } from '../types';

function generateId(): string {
  return 'imp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Parse a CSV string (word,translation,difficulty,tags). */
function parseCSV(text: string): QuizItem[] {
  const lines = text.trim().split('\n');
  const items: QuizItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row
    if (i === 0 && line.toLowerCase().startsWith('word')) continue;

    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) continue;

    const word = parts[0].replace(/^"|"$/g, '');
    const translation = parts[1].replace(/^"|"$/g, '');
    const difficulty = parts[2] ? parseFloat(parts[2]) : 0.5;
    const tags = parts[3] ? parts[3].split(';').map(t => t.trim()).filter(Boolean) : [];

    if (word && translation) {
      items.push({
        id: generateId(),
        word,
        translation,
        difficulty: isNaN(difficulty) ? 0.5 : Math.max(0, Math.min(1, difficulty)),
        tags,
      });
    }
  }

  return items;
}

/** Parse a JSON string (array of QuizItem-like objects). */
function parseJSON(text: string): QuizItem[] {
  const raw = JSON.parse(text);
  const arr = Array.isArray(raw) ? raw : raw.items ?? [];

  return arr.map((obj: Record<string, unknown>) => ({
    id: (obj.id as string) || generateId(),
    word: String(obj.word || ''),
    translation: String(obj.translation || ''),
    pronunciation: obj.pronunciation ? String(obj.pronunciation) : undefined,
    example: obj.example ? String(obj.example) : undefined,
    difficulty: typeof obj.difficulty === 'number' ? obj.difficulty : 0.5,
    tags: Array.isArray(obj.tags) ? obj.tags.map(String) : [],
  })).filter((i: QuizItem) => i.word && i.translation);
}

/**
 * Parse Anki-style tab-separated text (front\tback per line).
 * Anki export format is typically: front TAB back
 */
function parseAnki(text: string): QuizItem[] {
  const lines = text.trim().split('\n');
  const items: QuizItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split('\t');
    if (parts.length < 2) continue;

    const word = parts[0].trim();
    const translation = parts[1].trim();

    if (word && translation) {
      items.push({
        id: generateId(),
        word,
        translation,
        difficulty: 0.5,
        tags: [],
      });
    }
  }

  return items;
}

/**
 * Import vocabulary from a string in the given format.
 * Returns parsed QuizItem array.
 */
export function importVocabulary(text: string, format: ImportFormat): QuizItem[] {
  switch (format) {
    case 'csv':
      return parseCSV(text);
    case 'json':
      return parseJSON(text);
    case 'anki':
      return parseAnki(text);
    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

/** Detect format from file extension or content heuristic. */
export function detectFormat(filename: string, content: string): ImportFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'json') return 'json';
  if (ext === 'csv') return 'csv';
  if (ext === 'txt' || ext === 'tsv') return 'anki';

  // Content heuristic
  try {
    JSON.parse(content);
    return 'json';
  } catch {
    if (content.includes('\t')) return 'anki';
    return 'csv';
  }
}
