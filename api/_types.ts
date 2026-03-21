export interface FlashcardRequest {
  topic: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  targetLanguage: 'english';
  sourceLanguage: 'french';
}

export interface GeneratedFlashcard {
  word: string;
  translation: string;
  difficulty: number;
  tags: string[];
  exampleSentence: string;
  mnemonic: string;
}

export interface CalibrationCoachRequest {
  betaHat: number;
  ece: number;
  accuracy: number;
  totalSessions: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  dualProcessRatio: number;
  strengths: string[];
  weaknesses: string[];
  domainSplit?: {
    vocabBetaHat: number;
    grammarBetaHat: number;
  };
}

export interface CoachResponse {
  summary: string;
  diagnosis: string;
  strategies: string[];
  encouragement: string;
  focusArea: string;
}

export interface KnowledgeGraphRequest {
  words: Array<{
    word: string;
    translation: string;
    tags: string[];
    mastery: number;
  }>;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  weight: number;
  relationship: string;
}

export interface KnowledgeGraphResponse {
  edges: KnowledgeGraphEdge[];
  clusters: Array<{
    name: string;
    words: string[];
    color: string;
  }>;
}

export interface GrammarExplainRequest {
  question: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  userConfidence: number;
}

export interface GrammarExplainResponse {
  explanation: string;
  rule: string;
  tip: string;
  commonMistake: string;
}
