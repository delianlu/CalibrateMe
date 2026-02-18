// =============================================================================
// Vocabulary Feature Types
// =============================================================================

import { QuizItem } from '../quiz/types';

export interface VocabularyPack {
  id: string;
  name: string;
  description: string;
  language: { from: string; to: string };
  items: QuizItem[];
}

export interface VocabularyFilter {
  search: string;
  tags: string[];
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  mastery: 'all' | 'new' | 'learning' | 'mastered';
}

export type ImportFormat = 'csv' | 'json' | 'anki';
export type ExportFormat = 'csv' | 'json' | 'anki';
