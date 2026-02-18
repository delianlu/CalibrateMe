import {
  likelihoodCorrectness,
  likelihoodConfidence,
  likelihoodRT,
  updateBelief,
  updateBetaHat,
} from '../src/bkt/beliefUpdateEngine';
import { Response, SystemBelief, DEFAULT_SIMULATION_CONFIG } from '../src/types';

describe('Belief Update Engine', () => {
  describe('likelihoodCorrectness', () => {
    it('should return higher likelihood for correct when K is high', () => {
      const lCorrect = likelihoodCorrectness(true, 0.9, 0.1, 0.2);
      const lIncorrect = likelihoodCorrectness(false, 0.9, 0.1, 0.2);
      expect(lCorrect).toBeGreaterThan(lIncorrect);
    });

    it('should return higher likelihood for incorrect when K is low', () => {
      const lCorrect = likelihoodCorrectness(true, 0.1, 0.1, 0.2);
      const lIncorrect = likelihoodCorrectness(false, 0.1, 0.1, 0.2);
      expect(lIncorrect).toBeGreaterThan(lCorrect);
    });
  });

  describe('likelihoodConfidence', () => {
    it('should be highest when confidence matches expected', () => {
      const K_hat = 0.5;
      const beta_hat = 0.1;
      const expected_c = K_hat + beta_hat; // 0.6

      const L_match = likelihoodConfidence(expected_c, K_hat, beta_hat, 0.1);
      const L_off = likelihoodConfidence(0.3, K_hat, beta_hat, 0.1);

      expect(L_match).toBeGreaterThan(L_off);
    });
  });

  describe('likelihoodRT', () => {
    it('should be highest when RT matches expected', () => {
      const K_hat = 0.5;
      const tau_base = 3;
      const gamma = 2;
      const expected_tau = tau_base * (1 + gamma * (1 - K_hat)); // 6.0

      const L_match = likelihoodRT(expected_tau, K_hat, tau_base, gamma, 0.5);
      const L_off = likelihoodRT(2, K_hat, tau_base, gamma, 0.5);

      expect(L_match).toBeGreaterThan(L_off);
    });
  });

  describe('updateBelief', () => {
    const initialBelief: SystemBelief = {
      K_hat: 0.5,
      beta_hat: 0,
      confidence_interval: 0.2,
      last_updated: new Date(),
    };

    it('should increase K_hat after correct response with high confidence', () => {
      const response: Response = {
        item_id: 'test',
        correctness: true,
        confidence: 0.8,
        response_time: 2,
        timestamp: new Date(),
      };

      const updated = updateBelief(response, initialBelief, DEFAULT_SIMULATION_CONFIG);
      expect(updated.K_hat).toBeGreaterThan(initialBelief.K_hat);
    });

    it('should decrease K_hat after incorrect response with low confidence', () => {
      const response: Response = {
        item_id: 'test',
        correctness: false,
        confidence: 0.2,
        response_time: 5,
        timestamp: new Date(),
      };

      const updated = updateBelief(response, initialBelief, DEFAULT_SIMULATION_CONFIG);
      expect(updated.K_hat).toBeLessThan(initialBelief.K_hat);
    });
  });

  describe('updateBetaHat', () => {
    it('should detect overconfidence from responses', () => {
      const responses: Response[] = Array(20).fill(null).map((_, i) => ({
        item_id: `${i}`,
        correctness: i < 10, // 50% accuracy
        confidence: 0.8,     // 80% confidence
        response_time: 2,
        timestamp: new Date(),
      }));

      const beta = updateBetaHat(responses, 0);
      expect(beta).toBeGreaterThan(0); // Should detect overconfidence
    });
  });
});
