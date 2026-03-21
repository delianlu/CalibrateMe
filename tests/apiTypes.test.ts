/**
 * API Types & Endpoint Contract Tests
 *
 * Validates that all API types are correctly structured and that
 * the service layer function signatures match expected contracts.
 */
import { aiService } from '../src/services/aiService';

describe('API Endpoint Contracts', () => {
  describe('aiService methods exist', () => {
    it('should have generateFlashcards method', () => {
      expect(typeof aiService.generateFlashcards).toBe('function');
    });

    it('should have getCalibrationCoaching method', () => {
      expect(typeof aiService.getCalibrationCoaching).toBe('function');
    });

    it('should have generateKnowledgeGraph method', () => {
      expect(typeof aiService.generateKnowledgeGraph).toBe('function');
    });

    it('should have explainGrammar method', () => {
      expect(typeof aiService.explainGrammar).toBe('function');
    });

    it('should have explainVocabulary method', () => {
      expect(typeof aiService.explainVocabulary).toBe('function');
    });

    it('should have generateGrammarExercises method', () => {
      expect(typeof aiService.generateGrammarExercises).toBe('function');
    });

    it('should have generateProgressReport method', () => {
      expect(typeof aiService.generateProgressReport).toBe('function');
    });

    it('should have getPronunciationGuide method', () => {
      expect(typeof aiService.getPronunciationGuide).toBe('function');
    });

    it('should have generateStudyPlan method', () => {
      expect(typeof aiService.generateStudyPlan).toBe('function');
    });
  });

  describe('aiService has exactly 9 methods', () => {
    it('should expose 9 API methods', () => {
      const methods = Object.keys(aiService).filter(
        key => typeof (aiService as any)[key] === 'function'
      );
      expect(methods.length).toBe(9);
    });
  });
});
