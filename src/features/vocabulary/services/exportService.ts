// =============================================================================
// Export Service — Convert QuizItems to CSV, JSON, and Anki-compatible formats
// =============================================================================

import { QuizItem } from '../../quiz/types';
import { ExportFormat } from '../types';

/** Export items as CSV (word,translation,difficulty,tags). */
function toCSV(items: QuizItem[]): string {
  const header = 'word,translation,difficulty,tags';
  const rows = items.map(i => {
    const word = i.word.includes(',') ? `"${i.word}"` : i.word;
    const translation = i.translation.includes(',') ? `"${i.translation}"` : i.translation;
    const tags = i.tags.join(';');
    return `${word},${translation},${i.difficulty},${tags}`;
  });
  return [header, ...rows].join('\n');
}

/** Export items as JSON. */
function toJSON(items: QuizItem[]): string {
  return JSON.stringify(items, null, 2);
}

/** Export items as Anki-compatible tab-separated text (front\tback). */
function toAnki(items: QuizItem[]): string {
  return items.map(i => `${i.word}\t${i.translation}`).join('\n');
}

/** Export vocabulary items in the given format. Returns a string. */
export function exportVocabulary(items: QuizItem[], format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return toCSV(items);
    case 'json':
      return toJSON(items);
    case 'anki':
      return toAnki(items);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/** Trigger a browser download of the exported content. */
export function downloadExport(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
