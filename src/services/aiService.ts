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
};
