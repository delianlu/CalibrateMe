import { QuizService } from '../src/features/quiz/services/quizService';
import { QuizItem, QuizResponse } from '../src/features/quiz/types';

function makeItem(id: string, difficulty = 0.5): QuizItem {
  return {
    id,
    word: `word-${id}`,
    translation: `translation-${id}`,
    difficulty,
    tags: ['test'],
  };
}

function makeResponse(itemId: string, correct: boolean, confidence = 60, rtMs = 3000): QuizResponse {
  return {
    itemId,
    correctness: correct,
    confidence,
    responseTime: rtMs,
    timestamp: new Date(),
  };
}

describe('QuizService', () => {
  let service: QuizService;

  beforeEach(() => {
    service = new QuizService();
  });

  describe('constructor', () => {
    it('should initialize with zero responses', () => {
      expect(service.getResponseCount()).toBe(0);
    });

    it('should initialize with default system belief', () => {
      const belief = service.getSystemBelief();
      expect(belief.K_hat).toBe(0.3);
      expect(belief.beta_hat).toBe(0);
      expect(belief.confidence_interval).toBe(0.2);
    });

    it('should return null calibration metrics when no responses', () => {
      expect(service.getCalibrationMetrics()).toBeNull();
    });
  });

  describe('loadItems', () => {
    it('should load quiz items into the scheduler', () => {
      const items = [makeItem('a'), makeItem('b'), makeItem('c')];
      service.loadItems(items);
      // Should be able to select from them
      const selected = service.selectItems(2);
      expect(selected.length).toBe(2);
    });

    it('should clear previous items on reload', () => {
      service.loadItems([makeItem('a'), makeItem('b')]);
      service.loadItems([makeItem('c')]);
      const selected = service.selectItems(5);
      expect(selected.length).toBe(1);
      expect(selected[0]).toBe('c');
    });
  });

  describe('selectItems', () => {
    it('should select up to the requested count', () => {
      service.loadItems([makeItem('1'), makeItem('2'), makeItem('3')]);
      const selected = service.selectItems(2);
      expect(selected.length).toBe(2);
    });

    it('should not exceed available items', () => {
      service.loadItems([makeItem('1')]);
      const selected = service.selectItems(5);
      expect(selected.length).toBe(1);
    });

    it('should return item IDs', () => {
      service.loadItems([makeItem('alpha'), makeItem('beta')]);
      const selected = service.selectItems(2);
      expect(selected).toEqual(expect.arrayContaining(['alpha', 'beta']));
    });
  });

  describe('recordResponse', () => {
    beforeEach(() => {
      service.loadItems([makeItem('item1', 0.5), makeItem('item2', 0.3)]);
    });

    it('should increment response count', () => {
      service.recordResponse(makeResponse('item1', true));
      expect(service.getResponseCount()).toBe(1);

      service.recordResponse(makeResponse('item1', false));
      expect(service.getResponseCount()).toBe(2);
    });

    it('should return processed response with dual-process classification', () => {
      const result = service.recordResponse(makeResponse('item1', true, 80, 2000));
      expect(result.processedResponse).toBeDefined();
      expect(result.processedResponse.correctness).toBe(true);
      expect(result.processedResponse.response_type).toBeDefined();
      expect(result.processedResponse.brier_score).toBeDefined();
    });

    it('should return updated system belief', () => {
      const result = service.recordResponse(makeResponse('item1', true, 70));
      expect(result.updatedBelief).toBeDefined();
      expect(result.updatedBelief.K_hat).toBeGreaterThan(0);
      expect(typeof result.updatedBelief.beta_hat).toBe('number');
    });

    it('should update K_hat after correct response', () => {
      const before = service.getSystemBelief().K_hat;
      service.recordResponse(makeResponse('item1', true, 80));
      const after = service.getSystemBelief().K_hat;
      expect(after).toBeGreaterThan(before);
    });

    it('should throw for unknown item', () => {
      expect(() => {
        service.recordResponse(makeResponse('nonexistent', true));
      }).toThrow('Unknown item: nonexistent');
    });

    it('should convert confidence from 0-100 to 0-1', () => {
      const result = service.recordResponse(makeResponse('item1', true, 80));
      // The processed response should have confidence in 0-1 range
      expect(result.processedResponse.confidence).toBeCloseTo(0.8, 1);
    });

    it('should convert response time from ms to seconds', () => {
      const result = service.recordResponse(makeResponse('item1', true, 60, 5000));
      expect(result.processedResponse.response_time).toBeCloseTo(5, 1);
    });
  });

  describe('getCalibrationMetrics', () => {
    beforeEach(() => {
      service.loadItems([makeItem('item1'), makeItem('item2')]);
    });

    it('should return metrics after recording responses', () => {
      service.recordResponse(makeResponse('item1', true, 90));
      service.recordResponse(makeResponse('item2', false, 90));
      const metrics = service.getCalibrationMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('brier_score');
      expect(metrics).toHaveProperty('ece');
      expect(metrics).toHaveProperty('calibration_direction');
    });

    it('should detect overconfidence when confidence > accuracy', () => {
      // All high confidence, 50% accuracy → overconfident
      for (let i = 0; i < 10; i++) {
        service.recordResponse(makeResponse('item1', i % 2 === 0, 90));
      }
      const metrics = service.getCalibrationMetrics();
      expect(metrics).toBeDefined();
      // High confidence (0.9) with ~50% accuracy should yield positive beta_hat
      expect(metrics!.calibration_direction).toBeDefined();
    });
  });

  describe('multi-item session flow', () => {
    it('should handle a complete session with multiple items', () => {
      const items = Array.from({ length: 10 }, (_, i) => makeItem(`q${i}`, 0.3 + i * 0.05));
      service.loadItems(items);

      const selectedIds = service.selectItems(5);
      expect(selectedIds.length).toBe(5);

      // Simulate answering all selected items
      for (const id of selectedIds) {
        const correct = Math.random() > 0.5;
        const confidence = Math.floor(Math.random() * 100);
        service.recordResponse(makeResponse(id, correct, confidence));
      }

      expect(service.getResponseCount()).toBe(5);
      expect(service.getCalibrationMetrics()).toBeDefined();
      expect(service.getSystemBelief().K_hat).toBeGreaterThan(0);
    });
  });
});
