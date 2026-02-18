import { QuizItem } from './types';

/**
 * 50 sample English-Turkish vocabulary items across 3 difficulty levels.
 * Full 200-item packs will be added in Step 02.
 */
export const SAMPLE_VOCABULARY: QuizItem[] = [
  // ── Easy (difficulty 0.2–0.35) ──────────────────────────────────
  { id: 'e01', word: 'apple', translation: 'elma', difficulty: 0.2, tags: ['food', 'noun'] },
  { id: 'e02', word: 'book', translation: 'kitap', difficulty: 0.2, tags: ['object', 'noun'] },
  { id: 'e03', word: 'water', translation: 'su', difficulty: 0.2, tags: ['nature', 'noun'] },
  { id: 'e04', word: 'house', translation: 'ev', difficulty: 0.2, tags: ['place', 'noun'] },
  { id: 'e05', word: 'cat', translation: 'kedi', difficulty: 0.2, tags: ['animal', 'noun'] },
  { id: 'e06', word: 'dog', translation: 'köpek', difficulty: 0.25, tags: ['animal', 'noun'] },
  { id: 'e07', word: 'school', translation: 'okul', difficulty: 0.25, tags: ['place', 'noun'] },
  { id: 'e08', word: 'friend', translation: 'arkadaş', difficulty: 0.25, tags: ['people', 'noun'] },
  { id: 'e09', word: 'sun', translation: 'güneş', difficulty: 0.25, tags: ['nature', 'noun'] },
  { id: 'e10', word: 'happy', translation: 'mutlu', difficulty: 0.3, tags: ['emotion', 'adjective'] },
  { id: 'e11', word: 'big', translation: 'büyük', difficulty: 0.3, tags: ['size', 'adjective'] },
  { id: 'e12', word: 'run', translation: 'koşmak', difficulty: 0.3, tags: ['action', 'verb'] },
  { id: 'e13', word: 'eat', translation: 'yemek', difficulty: 0.3, tags: ['action', 'verb'] },
  { id: 'e14', word: 'day', translation: 'gün', difficulty: 0.3, tags: ['time', 'noun'] },
  { id: 'e15', word: 'night', translation: 'gece', difficulty: 0.3, tags: ['time', 'noun'] },
  { id: 'e16', word: 'good', translation: 'iyi', difficulty: 0.3, tags: ['quality', 'adjective'] },
  { id: 'e17', word: 'bad', translation: 'kötü', difficulty: 0.3, tags: ['quality', 'adjective'] },

  // ── Medium (difficulty 0.4–0.6) ─────────────────────────────────
  { id: 'm01', word: 'accomplish', translation: 'başarmak', difficulty: 0.5, tags: ['verb', 'academic'] },
  { id: 'm02', word: 'circumstance', translation: 'durum, koşul', difficulty: 0.5, tags: ['noun', 'formal'] },
  { id: 'm03', word: 'approach', translation: 'yaklaşım', difficulty: 0.45, tags: ['noun', 'academic'] },
  { id: 'm04', word: 'benefit', translation: 'fayda', difficulty: 0.45, tags: ['noun', 'general'] },
  { id: 'm05', word: 'community', translation: 'topluluk', difficulty: 0.45, tags: ['noun', 'social'] },
  { id: 'm06', word: 'determine', translation: 'belirlemek', difficulty: 0.5, tags: ['verb', 'academic'] },
  { id: 'm07', word: 'environment', translation: 'çevre', difficulty: 0.5, tags: ['noun', 'science'] },
  { id: 'm08', word: 'evidence', translation: 'kanıt', difficulty: 0.5, tags: ['noun', 'academic'] },
  { id: 'm09', word: 'influence', translation: 'etki', difficulty: 0.5, tags: ['noun', 'general'] },
  { id: 'm10', word: 'opportunity', translation: 'fırsat', difficulty: 0.5, tags: ['noun', 'general'] },
  { id: 'm11', word: 'participate', translation: 'katılmak', difficulty: 0.55, tags: ['verb', 'formal'] },
  { id: 'm12', word: 'require', translation: 'gerektirmek', difficulty: 0.5, tags: ['verb', 'academic'] },
  { id: 'm13', word: 'significant', translation: 'önemli', difficulty: 0.55, tags: ['adjective', 'academic'] },
  { id: 'm14', word: 'strategy', translation: 'strateji', difficulty: 0.45, tags: ['noun', 'business'] },
  { id: 'm15', word: 'sufficient', translation: 'yeterli', difficulty: 0.55, tags: ['adjective', 'formal'] },
  { id: 'm16', word: 'tendency', translation: 'eğilim', difficulty: 0.55, tags: ['noun', 'academic'] },
  { id: 'm17', word: 'ultimately', translation: 'sonuçta', difficulty: 0.5, tags: ['adverb', 'academic'] },

  // ── Hard (difficulty 0.65–0.8) ──────────────────────────────────
  { id: 'h01', word: 'ubiquitous', translation: 'her yerde bulunan', difficulty: 0.75, tags: ['adjective', 'advanced'] },
  { id: 'h02', word: 'ephemeral', translation: 'geçici, kısa ömürlü', difficulty: 0.8, tags: ['adjective', 'literary'] },
  { id: 'h03', word: 'ambiguous', translation: 'belirsiz, müphem', difficulty: 0.65, tags: ['adjective', 'academic'] },
  { id: 'h04', word: 'contemplate', translation: 'düşünmek, tefekkür', difficulty: 0.65, tags: ['verb', 'literary'] },
  { id: 'h05', word: 'discrepancy', translation: 'tutarsızlık', difficulty: 0.7, tags: ['noun', 'formal'] },
  { id: 'h06', word: 'exacerbate', translation: 'kötüleştirmek', difficulty: 0.75, tags: ['verb', 'formal'] },
  { id: 'h07', word: 'fluctuate', translation: 'dalgalanmak', difficulty: 0.65, tags: ['verb', 'academic'] },
  { id: 'h08', word: 'inevitable', translation: 'kaçınılmaz', difficulty: 0.65, tags: ['adjective', 'general'] },
  { id: 'h09', word: 'juxtapose', translation: 'yan yana koymak', difficulty: 0.8, tags: ['verb', 'literary'] },
  { id: 'h10', word: 'meticulous', translation: 'titiz, dikkatli', difficulty: 0.7, tags: ['adjective', 'formal'] },
  { id: 'h11', word: 'nuance', translation: 'nüans, ince fark', difficulty: 0.7, tags: ['noun', 'academic'] },
  { id: 'h12', word: 'paradigm', translation: 'paradigma, model', difficulty: 0.75, tags: ['noun', 'academic'] },
  { id: 'h13', word: 'reconcile', translation: 'uzlaştırmak', difficulty: 0.7, tags: ['verb', 'formal'] },
  { id: 'h14', word: 'scrutinize', translation: 'incelemek, dikkatle bakmak', difficulty: 0.7, tags: ['verb', 'formal'] },
  { id: 'h15', word: 'tenacious', translation: 'azimli, inatçı', difficulty: 0.75, tags: ['adjective', 'advanced'] },
  { id: 'h16', word: 'versatile', translation: 'çok yönlü', difficulty: 0.65, tags: ['adjective', 'general'] },
];
