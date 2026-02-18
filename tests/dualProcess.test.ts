import { DualProcessClassifier, getDifficultyBin } from '../src/dualProcess/classifier';
import { ResponseType } from '../src/types';

describe('Dual Process Classifier', () => {
  describe('getDifficultyBin', () => {
    it('should classify easy items', () => {
      expect(getDifficultyBin(0.1)).toBe('easy');
    });

    it('should classify medium items', () => {
      expect(getDifficultyBin(0.5)).toBe('medium');
    });

    it('should classify hard items', () => {
      expect(getDifficultyBin(0.8)).toBe('hard');
    });
  });

  describe('DualProcessClassifier', () => {
    let classifier: DualProcessClassifier;

    beforeEach(() => {
      classifier = new DualProcessClassifier();
    });

    it('should classify as Type 2 by default with few responses', () => {
      const result = classifier.processResponse(
        {
          item_id: 'test',
          correctness: true,
          confidence: 0.9,
          response_time: 2,
          timestamp: new Date(),
        },
        'medium'
      );
      // With < 5 responses, normalizeRT returns 0
      expect(result.response_type).toBe(ResponseType.TYPE2_DELIBERATE);
    });

    it('should classify errors as Type 2', () => {
      // Add enough responses for normalization
      for (let i = 0; i < 10; i++) {
        classifier.processResponse(
          {
            item_id: `item-${i}`,
            correctness: true,
            confidence: 0.5,
            response_time: 3,
            timestamp: new Date(),
          },
          'medium'
        );
      }

      const result = classifier.processResponse(
        {
          item_id: 'test',
          correctness: false,
          confidence: 0.3,
          response_time: 5,
          timestamp: new Date(),
        },
        'medium'
      );
      expect(result.response_type).toBe(ResponseType.TYPE2_DELIBERATE);
    });

    it('should compute Brier score correctly', () => {
      const result = classifier.processResponse(
        {
          item_id: 'test',
          correctness: true,
          confidence: 0.8,
          response_time: 2,
          timestamp: new Date(),
        },
        'medium'
      );
      expect(result.brier_score).toBeCloseTo(0.04, 2); // (0.8 - 1)^2 = 0.04
    });
  });
});
