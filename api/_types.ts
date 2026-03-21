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

// ── Vocabulary Explanation ─────────────────────────────────────────────

export interface VocabularyExplainRequest {
  word: string;
  translation: string;
  userConfidence: number;
  context?: string;
  tags?: string[];
}

export interface VocabularyExplainResponse {
  explanation: string;
  etymology: string;
  usageNotes: string;
  mnemonic: string;
  commonConfusions: string;
  exampleSentences: string[];
}

// ── Grammar Exercise Generation ────────────────────────────────────────

export interface GenerateGrammarExercisesRequest {
  topic: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  exerciseTypes: ('multiple-choice' | 'error_correction' | 'fill-blank-typing' | 'sentence-reorder')[];
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}

export interface GeneratedGrammarExercise {
  question: string;
  answer: string;
  options?: string[];
  exerciseType: 'multiple-choice' | 'error_correction' | 'fill-blank-typing' | 'sentence-reorder';
  difficulty: number;
  explanation: string;
  frenchComparison: string;
  tags: string[];
}

export interface GenerateGrammarExercisesResponse {
  exercises: GeneratedGrammarExercise[];
}

// ── Progress Report ────────────────────────────────────────────────────

export interface ProgressReportRequest {
  totalSessions: number;
  totalReviews: number;
  accuracy: number;
  betaHat: number;
  ece: number;
  streakDays: number;
  masteredItems: number;
  totalItems: number;
  vocabAccuracy: number;
  grammarAccuracy: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  calibrationType: 'overconfident' | 'underconfident' | 'well-calibrated';
  strongCategories: string[];
  weakCategories: string[];
  daysActive: number;
}

export interface ProgressReportResponse {
  overallAssessment: string;
  strengths: string[];
  areasForImprovement: string[];
  milestones: string[];
  nextGoals: string[];
  detailedAnalysis: string;
  motivationalNote: string;
}

// ── Pronunciation Guide ────────────────────────────────────────────────

export interface PronunciationGuideRequest {
  words: Array<{
    word: string;
    translation: string;
  }>;
}

export interface PronunciationGuideEntry {
  word: string;
  ipa: string;
  phonetic: string;
  tips: string;
  commonErrors: string;
  audioDescription: string;
}

export interface PronunciationGuideResponse {
  entries: PronunciationGuideEntry[];
}

// ── Study Plan ─────────────────────────────────────────────────────────

export interface StudyPlanRequest {
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  betaHat: number;
  ece: number;
  accuracy: number;
  totalSessions: number;
  weakAreas: string[];
  strongAreas: string[];
  availableMinutesPerDay: number;
  goalDescription?: string;
}

export interface StudyPlanDay {
  day: number;
  focus: string;
  activities: string[];
  durationMinutes: number;
  tips: string;
}

export interface StudyPlanResponse {
  planName: string;
  overview: string;
  weeklySchedule: StudyPlanDay[];
  priorityAreas: string[];
  calibrationStrategy: string;
  expectedOutcomes: string;
}
