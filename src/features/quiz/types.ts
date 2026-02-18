// =============================================================================
// Quiz Feature Types
// =============================================================================

export interface QuizItem {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  example?: string;
  difficulty: number; // 0-1
  tags: string[];
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
