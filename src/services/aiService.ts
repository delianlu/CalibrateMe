const API_BASE = '';

export const aiService = {
  async generateFlashcards(config: {
    topic: string;
    count: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }) {
    const response = await fetch(`${API_BASE}/api/generate-flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        targetLanguage: 'english',
        sourceLanguage: 'french',
      }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async getCalibrationCoaching(data: {
    betaHat: number;
    ece: number;
    accuracy: number;
    totalSessions: number;
    recentTrend: string;
    dualProcessRatio: number;
    strengths: string[];
    weaknesses: string[];
    domainSplit?: { vocabBetaHat: number; grammarBetaHat: number };
  }) {
    const response = await fetch(`${API_BASE}/api/calibration-coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async generateKnowledgeGraph(words: Array<{
    word: string;
    translation: string;
    tags: string[];
    mastery: number;
  }>) {
    const response = await fetch(`${API_BASE}/api/generate-knowledge-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async explainGrammar(data: {
    question: string;
    options: string[];
    userAnswer: string;
    correctAnswer: string;
    userConfidence: number;
  }) {
    const response = await fetch(`${API_BASE}/api/explain-grammar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async explainVocabulary(data: {
    word: string;
    translation: string;
    userConfidence: number;
    context?: string;
    tags?: string[];
  }) {
    const response = await fetch(`${API_BASE}/api/explain-vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async generateGrammarExercises(config: {
    topic: string;
    count: number;
    difficulty: 'easy' | 'medium' | 'hard';
    exerciseTypes: ('multiple-choice' | 'error_correction' | 'fill-blank-typing' | 'sentence-reorder')[];
    cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  }) {
    const response = await fetch(`${API_BASE}/api/generate-grammar-exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async generateProgressReport(data: {
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
  }) {
    const response = await fetch(`${API_BASE}/api/generate-progress-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async getPronunciationGuide(words: Array<{
    word: string;
    translation: string;
  }>) {
    const response = await fetch(`${API_BASE}/api/pronunciation-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async generateStudyPlan(data: {
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    betaHat: number;
    ece: number;
    accuracy: number;
    totalSessions: number;
    weakAreas: string[];
    strongAreas: string[];
    availableMinutesPerDay: number;
    goalDescription?: string;
  }) {
    const response = await fetch(`${API_BASE}/api/generate-study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },
};
