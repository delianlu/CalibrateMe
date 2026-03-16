import { SM2Scheduler, initSM2State, mapToQuality, updateSM2 } from '../src/baselines/sm2';
import { BKTOnlyScheduler } from '../src/baselines/bktOnly';
import { DecayBasedScheduler, initDecayState } from '../src/baselines/decayBased';
import { Response, SimulationConfig, ItemType } from '../src/types';

describe('Baseline Schedulers', () => {
  describe('SM2Scheduler', () => {
    describe('initSM2State', () => {
      it('should initialize with EF 2.5 and interval 1', () => {
        const state = initSM2State();
        expect(state.easeFactor).toBe(2.5);
        expect(state.interval).toBe(1);
        expect(state.repetitions).toBe(0);
      });
    });

    describe('mapToQuality', () => {
      it('should return 0 for incorrect responses', () => {
        expect(mapToQuality(1.0, false)).toBe(0);
        expect(mapToQuality(0.5, false)).toBe(0);
      });

      it('should map confidence to 0-5 for correct responses', () => {
        expect(mapToQuality(1.0, true)).toBe(5);
        expect(mapToQuality(0.8, true)).toBe(4);
        expect(mapToQuality(0.6, true)).toBe(3);
        expect(mapToQuality(0.4, true)).toBe(2);
        expect(mapToQuality(0.2, true)).toBe(1);
        expect(mapToQuality(0.0, true)).toBe(0);
      });
    });

    describe('updateSM2', () => {
      it('should reset interval and reps on failure (quality < 3)', () => {
        const state = { easeFactor: 2.5, interval: 10, repetitions: 4 };
        const newState = updateSM2(state, 2);
        
        expect(newState.interval).toBe(1);
        expect(newState.repetitions).toBe(0);
        expect(newState.easeFactor).toBeLessThan(2.5);
      });

      it('should increase interval for successful repetitions', () => {
        const state1 = initSM2State();
        const state2 = updateSM2(state1, 4); // Rep 1
        expect(state2.interval).toBe(1);
        expect(state2.repetitions).toBe(1);

        const state3 = updateSM2(state2, 5); // Rep 2
        expect(state3.interval).toBe(6);
        expect(state3.repetitions).toBe(2);

        const state4 = updateSM2(state3, 4); // Rep 3
        expect(state4.interval).toBeGreaterThan(6);
        expect(state4.repetitions).toBe(3);
      });

      it('should not let EF drop below 1.3', () => {
        const state = { easeFactor: 1.3, interval: 10, repetitions: 4 };
        const newState = updateSM2(state, 0); // Big penalty
        expect(newState.easeFactor).toBe(1.3);
      });
    });

    describe('Class Methods', () => {
      it('should process responses and keep track of state', () => {
        const scheduler = new SM2Scheduler();
        const response: Response = {
          item_id: 'test',
          correctness: true,
          confidence: 0.8,
          response_time: 2,
          timestamp: new Date(),
        };

        const result1 = scheduler.processResponse(response);
        expect(result1.interval).toBe(1);
        
        const result2 = scheduler.processResponse(response);
        expect(result2.interval).toBe(6);

        scheduler.reset();
        const result3 = scheduler.processResponse(response);
        expect(result3.interval).toBe(1); // Back to rep 1
      });
    });
  });

  describe('BKTOnlyScheduler', () => {
    const config: SimulationConfig = {
      learners: 1,
      items: 1,
      sessions: 1,
      trials_per_session: 1,
      spaced_repetition: true,
      calibration_aware: false,
      dual_process: false,
      scaffolding: false,
      slip_probability: 0.1,
      guess_probability: 0.2,
      confidence_noise_std: 0.1,
      rt_noise_std: 0.1,
      rt_base: 5,
      rt_gamma: 1,
    };

    it('should initialize beliefs properly and calculate interval', () => {
      const scheduler = new BKTOnlyScheduler(0.1, config);
      const response: Response = {
        item_id: 'test',
        item_type: ItemType.VOCABULARY,
        correctness: true,
        confidence: 0.8,
        response_time: 2,
        timestamp: new Date(),
      };

      const result = scheduler.processResponse(response);
      expect(result.interval).toBeGreaterThan(0);

      scheduler.reset();
      const initialBelief = scheduler.getBelief('test');
      expect(initialBelief.K_hat).toBe(0.3);
    });
  });

  describe('DecayBasedScheduler', () => {
    describe('initDecayState', () => {
      it('should initialize properly', () => {
        const state = initDecayState();
        expect(state.interval).toBe(1);
        expect(state.streak).toBe(0);
        expect(state.lastReview).toBeNull();
      });
    });

    describe('Class Methods', () => {
      it('should double interval up to max loop on correct responses', () => {
        const scheduler = new DecayBasedScheduler(10);
        const correctResp: Response = {
          item_id: 'test',
          correctness: true,
          confidence: 0.8,
          response_time: 2,
          timestamp: new Date(),
        };

        const result1 = scheduler.processResponse(correctResp);
        expect(result1.interval).toBe(2); // 1 * 2

        const result2 = scheduler.processResponse(correctResp);
        expect(result2.interval).toBe(4); // 2 * 2

        const result3 = scheduler.processResponse(correctResp);
        expect(result3.interval).toBe(8); // 4 * 2

        const result4 = scheduler.processResponse(correctResp);
        expect(result4.interval).toBe(10); // 8 * 2 -> capped at maxInterval = 10
      });

      it('should reset interval on incorrect responses', () => {
        const scheduler = new DecayBasedScheduler();
        const correctResp: Response = {
          item_id: 'test',
          correctness: true,
          confidence: 0.8,
          response_time: 2,
          timestamp: new Date(),
        };
        const incorrectResp = { ...correctResp, correctness: false };

        scheduler.processResponse(correctResp); // int 2
        scheduler.processResponse(correctResp); // int 4

        const resultError = scheduler.processResponse(incorrectResp);
        expect(resultError.interval).toBe(1); // Reset to 1

        scheduler.reset();
        const resultAfterReset = scheduler.processResponse(correctResp);
        expect(resultAfterReset.interval).toBe(2); // Checking reset() state clearing
      });
    });
  });
});
