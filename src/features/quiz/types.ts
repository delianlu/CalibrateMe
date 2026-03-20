// =============================================================================
// Quiz Feature Types
// =============================================================================

export type QuizItemType = 'vocabulary' | 'multiple-choice' | 'error_correction';

export interface FrenchComparison {
  frenchStructure: string;
  englishStructure: string;
  whyDifficult: string;
  visualHighlighting?: {
    incorrect: string;
    correct: string;
  };
}

export interface ScenarioContext {
  name: string;
  icon: string;
  context: string;
  characters: string[];
}

export interface FalseCognateInfo {
  englishWord: string;
  frenchWord: string;
  frenchMeaning: string;
  englishMeaning: string;
  commonMistake: string;
  memoryTrick: string;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface QuizItem {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  example?: string;
  difficulty: number; // 0-1
  tags: string[];
  cefrLevel?: CEFRLevel;

  // Grammar exercise fields (OffGrid activities)
  itemType?: QuizItemType;
  question?: string;
  answer?: string;
  options?: string[];
  feedback?: string;
  correction?: string | null;
  category?: string;
  moduleId?: string;
  frenchComparison?: FrenchComparison;
  scenario?: ScenarioContext;
  falseCognate?: FalseCognateInfo;
}

export interface QuizResponse {
  itemId: string;
  correctness: boolean;
  confidence: number;       // 0-100
  responseTime: number;     // ms
  timestamp: Date;
}

export interface QuizConfig {
  itemsPerSession: number;
  inputMode: 'self-grade';
}

export type QuizPhase =
  | 'idle'
  | 'show-word'
  | 'rate-confidence'
  | 'reveal-answer'
  | 'feedback'
  | 'completed';

export interface QuizSessionState {
  id: string;
  startTime: Date;
  items: QuizItem[];
  responses: QuizResponse[];
  currentIndex: number;
  phase: QuizPhase;
  currentConfidence: number;
  paused: boolean;
}
