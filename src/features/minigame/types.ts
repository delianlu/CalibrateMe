export interface TriviQuestion {
  id: string;
  question: string;
  options: string[];     // 4 multiple-choice options
  correctIndex: number;  // index of correct answer
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TriviAnswer {
  questionId: string;
  selectedIndex: number;
  confidence: number;    // 0-100
  correct: boolean;
  responseTime: number;  // ms
}

export type MiniGamePhase =
  | 'intro'            // Explanation screen
  | 'question'         // Show question + options
  | 'rate-confidence'  // Confidence slider
  | 'feedback'         // Show if correct
  | 'results';         // Final calibration analysis

export interface MiniGameState {
  phase: MiniGamePhase;
  questions: TriviQuestion[];
  answers: TriviAnswer[];
  currentIndex: number;
  selectedOption: number | null;
  confidence: number;
  startTime: number;
}
