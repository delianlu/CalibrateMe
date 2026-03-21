import { SM2Scheduler, initSM2State, mapToQuality, updateSM2 } from '../src/baselines/sm2';
import { BKTOnlyScheduler } from '../src/baselines/bktOnly';
import { DecayBasedScheduler, initDecayState } from '../src/baselines/decayBased';
import { DEFAULT_SIMULATION_CONFIG, Response } from '../src/types';

function makeResponse(itemId: string, correct: boolean, confidence = 0.7): Response {
  return {
    item_id: itemId,
    correctness: correct,
    confidence,
    response_time: 3,
    timestamp: new Date(),
  };
}

describe('Baseline Schedulers', () => {
  // ── SM-2 ──────────────────────────────────────────────────────────────

  describe('SM-2 Baseline', () => {
    describe('mapToQuality', () => {
      it('should return 0 for incorrect responses', () => {
        expect(mapToQuality(0.9, false)).toBe(0);
        expect(mapToQuality(0.5, false)).toBe(0);
        expect(mapToQuality(0.1, false)).toBe(0);
      });

      it('should return 5 × confidence for correct responses', () => {
        expect(mapToQuality(1.0, true)).toBe(5);
        expect(mapToQuality(0.8, true)).toBe(4);
        expect(mapToQuality(0.6, true)).toBe(3);
        expect(mapToQuality(0.0, true)).toBe(0);
      });
    });

    describe('initSM2State', () => {
      it('should initialize with default values', () => {
        const state = initSM2State();
        expect(state.easeFactor).toBe(2.5);
        expect(state.interval).toBe(1);
        expect(state.repetitions).toBe(0);
      });
    });

    describe('updateSM2', () => {
      it('should reset on quality < 3', () => {
        const state = { easeFactor: 2.5, interval: 10, repetitions: 5 };
        const updated = updateSM2(state, 2);
        expect(updated.repetitions).toBe(0);
        expect(updated.interval).toBe(1);
      });

      it('should progress on quality >= 3', () => {
        const state = initSM2State();
        const updated = updateSM2(state, 4);
        expect(updated.repetitions).toBe(1);
        expect(updated.interval).toBe(1); // First rep = 1 day
      });

      it('should set interval to 6 on second successful rep', () => {
        let state = initSM2State();
        state = updateSM2(state, 4); // rep 1
        state = updateSM2(state, 4); // rep 2
        expect(state.interval).toBe(6);
      });

      it('should scale interval by ease factor on third+ rep', () => {
        let state = initSM2State();
        state = updateSM2(state, 5); // rep 1
        state = updateSM2(state, 5); // rep 2 → interval = 6
        state = updateSM2(state, 5); // rep 3 → interval = round(6 * EF)
        expect(state.interval).toBeGreaterThan(6);
      });

      it('should never let ease factor drop below 1.3', () => {
        let state = { easeFactor: 1.35, interval: 1, repetitions: 0 };
        state = updateSM2(state, 0); // Worst quality
        expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
      });
    });

    describe('SM2Scheduler', () => {
      let scheduler: SM2Scheduler;

      beforeEach(() => {
        scheduler = new SM2Scheduler();
      });

      it('should process a response and return next review', () => {
        const result = scheduler.processResponse(makeResponse('item1', true));
        expect(result.interval).toBeGreaterThanOrEqual(1);
        expect(result.nextReview.getTime()).toBeGreaterThan(Date.now());
      });

      it('should reset interval on incorrect response', () => {
        // First get some reps in
        scheduler.processResponse(makeResponse('item1', true));
        scheduler.processResponse(makeResponse('item1', true));
        const result = scheduler.processResponse(makeResponse('item1', false));
        expect(result.interval).toBe(1);
      });

      it('should track state per item', () => {
        scheduler.processResponse(makeResponse('item1', true));
        scheduler.processResponse(makeResponse('item1', true));
        scheduler.processResponse(makeResponse('item2', true));

        const s1 = scheduler.getState('item1');
        const s2 = scheduler.getState('item2');
        expect(s1.repetitions).toBe(2);
        expect(s2.repetitions).toBe(1);
      });

      it('should clear all state on reset', () => {
        scheduler.processResponse(makeResponse('item1', true));
        scheduler.reset();
        const state = scheduler.getState('item1');
        expect(state.repetitions).toBe(0);
      });
    });
  });

  // ── BKT-Only ──────────────────────────────────────────────────────────

  describe('BKT-Only Baseline', () => {
    let scheduler: BKTOnlyScheduler;

    beforeEach(() => {
      scheduler = new BKTOnlyScheduler(0.1, DEFAULT_SIMULATION_CONFIG);
    });

    it('should initialize belief for new items', () => {
      const belief = scheduler.getBelief('new-item');
      expect(belief.K_hat).toBe(0.3);
      expect(belief.beta_hat).toBe(0);
    });

    it('should process response and schedule next review', () => {
      const result = scheduler.processResponse(makeResponse('item1', true));
      expect(result.interval).toBeGreaterThanOrEqual(1);
      expect(result.nextReview.getTime()).toBeGreaterThan(Date.now());
    });

    it('should increase K_hat after correct response', () => {
      const before = scheduler.getBelief('item1').K_hat;
      scheduler.processResponse(makeResponse('item1', true, 0.8));
      const after = scheduler.getBelief('item1').K_hat;
      expect(after).toBeGreaterThan(before);
    });

    it('should return longer intervals for higher K_hat', () => {
      // Build up K_hat
      for (let i = 0; i < 5; i++) {
        scheduler.processResponse(makeResponse('strong', true, 0.9));
      }
      const strongResult = scheduler.processResponse(makeResponse('strong', true, 0.9));

      const weakResult = scheduler.processResponse(makeResponse('weak', true, 0.3));
      expect(strongResult.interval).toBeGreaterThanOrEqual(weakResult.interval);
    });

    it('should clear state on reset', () => {
      scheduler.processResponse(makeResponse('item1', true));
      scheduler.reset();
      const belief = scheduler.getBelief('item1');
      expect(belief.K_hat).toBe(0.3); // Reset to default
    });
  });

  // ── Decay-Based ──────────────────────────────────────────────────────

  describe('Decay-Based Baseline', () => {
    let scheduler: DecayBasedScheduler;

    beforeEach(() => {
      scheduler = new DecayBasedScheduler(30);
    });

    it('should initialize with interval 1', () => {
      const state = initDecayState();
      expect(state.interval).toBe(1);
      expect(state.streak).toBe(0);
      expect(state.lastReview).toBeNull();
    });

    it('should double interval on correct response', () => {
      const r1 = scheduler.processResponse(makeResponse('item1', true));
      expect(r1.interval).toBe(2);

      const r2 = scheduler.processResponse(makeResponse('item1', true));
      expect(r2.interval).toBe(4);

      const r3 = scheduler.processResponse(makeResponse('item1', true));
      expect(r3.interval).toBe(8);
    });

    it('should reset interval on incorrect response', () => {
      scheduler.processResponse(makeResponse('item1', true));
      scheduler.processResponse(makeResponse('item1', true));
      const r3 = scheduler.processResponse(makeResponse('item1', false));
      expect(r3.interval).toBe(1);
    });

    it('should cap interval at maxInterval', () => {
      const smallMaxScheduler = new DecayBasedScheduler(4);
      smallMaxScheduler.processResponse(makeResponse('item1', true)); // 2
      smallMaxScheduler.processResponse(makeResponse('item1', true)); // 4
      const r3 = smallMaxScheduler.processResponse(makeResponse('item1', true)); // capped at 4
      expect(r3.interval).toBe(4);
    });

    it('should track streak per item', () => {
      scheduler.processResponse(makeResponse('item1', true));
      scheduler.processResponse(makeResponse('item1', true));
      scheduler.processResponse(makeResponse('item2', true));

      const s1 = scheduler.getState('item1');
      const s2 = scheduler.getState('item2');
      expect(s1.streak).toBe(2);
      expect(s2.streak).toBe(1);
    });

    it('should clear all state on reset', () => {
      scheduler.processResponse(makeResponse('item1', true));
      scheduler.reset();
      const state = scheduler.getState('item1');
      expect(state.streak).toBe(0);
    });

    it('should return future next review date', () => {
      const result = scheduler.processResponse(makeResponse('item1', true));
      expect(result.nextReview.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
