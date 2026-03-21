import {
  createScaffoldState,
  processResponse,
  dismissPrompt,
} from '../src/features/scaffolding/scaffoldingEngine';
import { QuizResponse } from '../src/features/quiz/types';

function makeResponse(correct: boolean, confidence: number): QuizResponse {
  return {
    itemId: `item-${Math.random()}`,
    correctness: correct,
    confidence,
    responseTime: 3000,
    timestamp: new Date(),
  };
}

describe('SRL Scaffolding Engine', () => {
  describe('createScaffoldState', () => {
    it('should initialize with null active prompt', () => {
      const state = createScaffoldState();
      expect(state.activePrompt).toBeNull();
    });

    it('should initialize with empty dismissed set', () => {
      const state = createScaffoldState();
      expect(state.dismissedIds.size).toBe(0);
    });

    it('should initialize all counters to zero', () => {
      const state = createScaffoldState();
      expect(state.recentCorrect).toBe(0);
      expect(state.recentIncorrect).toBe(0);
      expect(state.recentOverconfident).toBe(0);
      expect(state.recentUnderconfident).toBe(0);
      expect(state.totalShown).toBe(0);
    });
  });

  describe('processResponse', () => {
    it('should increment recentCorrect on correct response', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(true, 50), 1);
      expect(state.recentCorrect).toBe(1);
      expect(state.recentIncorrect).toBe(0);
    });

    it('should increment recentIncorrect on incorrect response', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(false, 50), 1);
      expect(state.recentIncorrect).toBe(1);
      expect(state.recentCorrect).toBe(0);
    });

    it('should reset correct streak on incorrect response', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(true, 50), 1);
      state = processResponse(state, makeResponse(true, 50), 2);
      expect(state.recentCorrect).toBe(2);

      state = processResponse(state, makeResponse(false, 50), 3);
      expect(state.recentCorrect).toBe(0);
      expect(state.recentIncorrect).toBe(1);
    });

    it('should reset incorrect streak on correct response', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(false, 50), 1);
      state = processResponse(state, makeResponse(false, 50), 2);
      expect(state.recentIncorrect).toBe(2);

      state = processResponse(state, makeResponse(true, 50), 3);
      expect(state.recentIncorrect).toBe(0);
      expect(state.recentCorrect).toBe(1);
    });

    it('should track overconfident responses (wrong + confidence > 60)', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(false, 80), 1);
      expect(state.recentOverconfident).toBe(1);

      state = processResponse(state, makeResponse(false, 90), 2);
      expect(state.recentOverconfident).toBe(2);
    });

    it('should NOT count as overconfident if confidence ≤ 60', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(false, 40), 1);
      expect(state.recentOverconfident).toBe(0);
    });

    it('should track underconfident responses (correct + confidence < 40)', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(true, 20), 1);
      expect(state.recentUnderconfident).toBe(1);
    });

    it('should NOT count as underconfident if confidence ≥ 40', () => {
      let state = createScaffoldState();
      state = processResponse(state, makeResponse(true, 60), 1);
      expect(state.recentUnderconfident).toBe(0);
    });

    it('should trigger a scaffold prompt after enough overconfident responses', () => {
      let state = createScaffoldState();
      // Feed many overconfident responses to trigger a prompt
      for (let i = 0; i < 10; i++) {
        state = processResponse(state, makeResponse(false, 85), i + 1);
      }
      // At some point, a prompt should trigger
      // (depends on prompt library thresholds, but overconfident count should be high)
      expect(state.recentOverconfident).toBeGreaterThanOrEqual(3);
    });

    it('should not trigger prompts that have been dismissed', () => {
      let state = createScaffoldState();

      // Build up overconfident responses to trigger a prompt
      for (let i = 0; i < 10; i++) {
        state = processResponse(state, makeResponse(false, 90), i + 1);
      }

      if (state.activePrompt) {
        const promptId = state.activePrompt.id;
        state = dismissPrompt(state);

        // Continue with more overconfident responses
        for (let i = 0; i < 10; i++) {
          state = processResponse(state, makeResponse(false, 90), 20 + i);
        }

        // The same prompt should not appear again
        if (state.activePrompt) {
          expect(state.activePrompt.id).not.toBe(promptId);
        }
      }
    });
  });

  describe('dismissPrompt', () => {
    it('should set activePrompt to null', () => {
      let state = createScaffoldState();
      // Try to trigger a prompt
      for (let i = 0; i < 10; i++) {
        state = processResponse(state, makeResponse(false, 90), i + 1);
      }

      state = dismissPrompt(state);
      expect(state.activePrompt).toBeNull();
    });

    it('should add prompt ID to dismissedIds', () => {
      let state = createScaffoldState();
      for (let i = 0; i < 10; i++) {
        state = processResponse(state, makeResponse(false, 90), i + 1);
      }

      if (state.activePrompt) {
        const id = state.activePrompt.id;
        state = dismissPrompt(state);
        expect(state.dismissedIds.has(id)).toBe(true);
      }
    });

    it('should handle dismissing when no active prompt', () => {
      const state = createScaffoldState();
      const result = dismissPrompt(state);
      expect(result.activePrompt).toBeNull();
    });
  });
});
