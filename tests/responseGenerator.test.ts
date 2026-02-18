import { generateCorrectness, generateConfidence, generateResponseTime } from '../src/simulation/responseGenerator';
import { SeededRandom } from '../src/utils/random';

describe('Response Generator', () => {
  const random = new SeededRandom(12345);

  beforeEach(() => {
    random.setSeed(12345);
  });

  describe('generateCorrectness', () => {
    it('should generate correct responses more often with high knowledge', () => {
      let correctCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (generateCorrectness(0.9, 0.1, 0.2, random)) correctCount++;
      }
      // P(correct|K*=0.9) = 0.9 * 0.9 + 0.2 * 0.1 = 0.83
      expect(correctCount / 1000).toBeCloseTo(0.83, 1);
    });

    it('should generate incorrect responses more often with low knowledge', () => {
      let correctCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (generateCorrectness(0.1, 0.1, 0.2, random)) correctCount++;
      }
      // P(correct|K*=0.1) = 0.9 * 0.1 + 0.2 * 0.9 = 0.27
      expect(correctCount / 1000).toBeCloseTo(0.27, 1);
    });
  });

  describe('generateConfidence', () => {
    it('should generate higher confidence with overconfidence bias', () => {
      const confidences: number[] = [];
      for (let i = 0; i < 100; i++) {
        confidences.push(generateConfidence(0.5, 0.2, 0.1, random));
      }
      const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      expect(mean).toBeGreaterThan(0.6); // K* + β* = 0.7
    });

    it('should generate lower confidence with underconfidence bias', () => {
      const confidences: number[] = [];
      for (let i = 0; i < 100; i++) {
        confidences.push(generateConfidence(0.5, -0.2, 0.1, random));
      }
      const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      expect(mean).toBeLessThan(0.4); // K* + β* = 0.3
    });

    it('should clip confidence to [0, 1]', () => {
      for (let i = 0; i < 100; i++) {
        const c = generateConfidence(0.9, 0.3, 0.2, random);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('generateResponseTime', () => {
    it('should generate faster responses with high knowledge', () => {
      const highK: number[] = [];
      const lowK: number[] = [];

      for (let i = 0; i < 100; i++) {
        highK.push(generateResponseTime(0.9, 3, 2, 0.5, random));
        lowK.push(generateResponseTime(0.1, 3, 2, 0.5, random));
      }

      const highMean = highK.reduce((a, b) => a + b, 0) / highK.length;
      const lowMean = lowK.reduce((a, b) => a + b, 0) / lowK.length;

      expect(highMean).toBeLessThan(lowMean);
    });
  });
});
