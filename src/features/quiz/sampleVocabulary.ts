import { QuizItem } from './types';

/**
 * 50 sample English-French vocabulary items across 3 difficulty levels.
 * Full 200-item packs will be added in Step 02.
 */
export const SAMPLE_VOCABULARY: QuizItem[] = [
  // ── Easy (difficulty 0.2–0.35) ──────────────────────────────────
  { id: 'e01', word: 'apple', translation: 'pomme', difficulty: 0.2, tags: ['food', 'noun'] },
  { id: 'e02', word: 'book', translation: 'livre', difficulty: 0.2, tags: ['object', 'noun'] },
  { id: 'e03', word: 'water', translation: 'eau', difficulty: 0.2, tags: ['nature', 'noun'] },
  { id: 'e04', word: 'house', translation: 'maison', difficulty: 0.2, tags: ['place', 'noun'] },
  { id: 'e05', word: 'cat', translation: 'chat', difficulty: 0.2, tags: ['animal', 'noun'] },
  { id: 'e06', word: 'dog', translation: 'chien', difficulty: 0.25, tags: ['animal', 'noun'] },
  { id: 'e07', word: 'school', translation: 'école', difficulty: 0.25, tags: ['place', 'noun'] },
  { id: 'e08', word: 'friend', translation: 'ami', difficulty: 0.25, tags: ['people', 'noun'] },
  { id: 'e09', word: 'sun', translation: 'soleil', difficulty: 0.25, tags: ['nature', 'noun'] },
  { id: 'e10', word: 'happy', translation: 'heureux', difficulty: 0.3, tags: ['emotion', 'adjective'] },
  { id: 'e11', word: 'big', translation: 'grand', difficulty: 0.3, tags: ['size', 'adjective'] },
  { id: 'e12', word: 'run', translation: 'courir', difficulty: 0.3, tags: ['action', 'verb'] },
  { id: 'e13', word: 'eat', translation: 'manger', difficulty: 0.3, tags: ['action', 'verb'] },
  { id: 'e14', word: 'day', translation: 'jour', difficulty: 0.3, tags: ['time', 'noun'] },
  { id: 'e15', word: 'night', translation: 'nuit', difficulty: 0.3, tags: ['time', 'noun'] },
  { id: 'e16', word: 'good', translation: 'bon', difficulty: 0.3, tags: ['quality', 'adjective'] },
  { id: 'e17', word: 'bad', translation: 'mauvais', difficulty: 0.3, tags: ['quality', 'adjective'] },

  // ── Medium (difficulty 0.4–0.6) ─────────────────────────────────
  { id: 'm01', word: 'accomplish', translation: 'accomplir', difficulty: 0.5, tags: ['verb', 'academic'] },
  { id: 'm02', word: 'circumstance', translation: 'circonstance', difficulty: 0.5, tags: ['noun', 'formal'] },
  { id: 'm03', word: 'approach', translation: 'approche', difficulty: 0.45, tags: ['noun', 'academic'] },
  { id: 'm04', word: 'benefit', translation: 'avantage', difficulty: 0.45, tags: ['noun', 'general'] },
  { id: 'm05', word: 'community', translation: 'communauté', difficulty: 0.45, tags: ['noun', 'social'] },
  { id: 'm06', word: 'determine', translation: 'déterminer', difficulty: 0.5, tags: ['verb', 'academic'] },
  { id: 'm07', word: 'environment', translation: 'environnement', difficulty: 0.5, tags: ['noun', 'science'] },
  { id: 'm08', word: 'evidence', translation: 'preuve', difficulty: 0.5, tags: ['noun', 'academic'] },
  { id: 'm09', word: 'influence', translation: 'influence', difficulty: 0.5, tags: ['noun', 'general'] },
  { id: 'm10', word: 'opportunity', translation: 'opportunité', difficulty: 0.5, tags: ['noun', 'general'] },
  { id: 'm11', word: 'participate', translation: 'participer', difficulty: 0.55, tags: ['verb', 'formal'] },
  { id: 'm12', word: 'require', translation: 'exiger', difficulty: 0.5, tags: ['verb', 'academic'] },
  { id: 'm13', word: 'significant', translation: 'significatif', difficulty: 0.55, tags: ['adjective', 'academic'] },
  { id: 'm14', word: 'strategy', translation: 'stratégie', difficulty: 0.45, tags: ['noun', 'business'] },
  { id: 'm15', word: 'sufficient', translation: 'suffisant', difficulty: 0.55, tags: ['adjective', 'formal'] },
  { id: 'm16', word: 'tendency', translation: 'tendance', difficulty: 0.55, tags: ['noun', 'academic'] },
  { id: 'm17', word: 'ultimately', translation: 'finalement', difficulty: 0.5, tags: ['adverb', 'academic'] },

  // ── Hard (difficulty 0.65–0.8) ──────────────────────────────────
  { id: 'h01', word: 'ubiquitous', translation: 'omniprésent', difficulty: 0.75, tags: ['adjective', 'advanced'] },
  { id: 'h02', word: 'ephemeral', translation: 'éphémère', difficulty: 0.8, tags: ['adjective', 'literary'] },
  { id: 'h03', word: 'ambiguous', translation: 'ambigu', difficulty: 0.65, tags: ['adjective', 'academic'] },
  { id: 'h04', word: 'contemplate', translation: 'contempler', difficulty: 0.65, tags: ['verb', 'literary'] },
  { id: 'h05', word: 'discrepancy', translation: 'divergence', difficulty: 0.7, tags: ['noun', 'formal'] },
  { id: 'h06', word: 'exacerbate', translation: 'exacerber', difficulty: 0.75, tags: ['verb', 'formal'] },
  { id: 'h07', word: 'fluctuate', translation: 'fluctuer', difficulty: 0.65, tags: ['verb', 'academic'] },
  { id: 'h08', word: 'inevitable', translation: 'inévitable', difficulty: 0.65, tags: ['adjective', 'general'] },
  { id: 'h09', word: 'juxtapose', translation: 'juxtaposer', difficulty: 0.8, tags: ['verb', 'literary'] },
  { id: 'h10', word: 'meticulous', translation: 'méticuleux', difficulty: 0.7, tags: ['adjective', 'formal'] },
  { id: 'h11', word: 'nuance', translation: 'nuance', difficulty: 0.7, tags: ['noun', 'academic'] },
  { id: 'h12', word: 'paradigm', translation: 'paradigme', difficulty: 0.75, tags: ['noun', 'academic'] },
  { id: 'h13', word: 'reconcile', translation: 'réconcilier', difficulty: 0.7, tags: ['verb', 'formal'] },
  { id: 'h14', word: 'scrutinize', translation: 'examiner minutieusement', difficulty: 0.7, tags: ['verb', 'formal'] },
  { id: 'h15', word: 'tenacious', translation: 'tenace', difficulty: 0.75, tags: ['adjective', 'advanced'] },
  { id: 'h16', word: 'versatile', translation: 'polyvalent', difficulty: 0.65, tags: ['adjective', 'general'] },
];
