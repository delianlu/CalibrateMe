import {
  SCAFFOLD_PROMPTS,
  selectScaffold,
  shouldTriggerScaffold,
  applyScaffoldingEffect,
  getScaffoldPrompt,
  AdaptiveScaffoldingManager,
} from '../src/scaffolding/adaptiveScaffolding';
import { ScaffoldType, CalibrationType, TrueLearnerState } from '../src/types';

describe('Adaptive Scaffolding', () => {
  describe('selectScaffold', () => {
    it('should select REFLECTION for overconfident', () => {
      expect(selectScaffold(0.2, [], 0.1)).toBe(ScaffoldType.REFLECTION);
    });

    it('should select ENCOURAGEMENT for underconfident', () => {
      expect(selectScaffold(-0.2, [], 0.1)).toBe(ScaffoldType.ENCOURAGEMENT);
    });

    it('should select NONE for well calibrated', () => {
      expect(selectScaffold(0.05, [], 0.1)).toBe(ScaffoldType.NONE);
    });
  });

  describe('shouldTriggerScaffold', () => {
    it('should not trigger if well calibrated', () => {
      expect(shouldTriggerScaffold(CalibrationType.WELL_CALIBRATED, 10, 5)).toBe(false);
    });

    it('should not trigger if responses since last scaffold is less than min interval', () => {
      expect(shouldTriggerScaffold(CalibrationType.OVERCONFIDENT, 3, 5)).toBe(false);
    });

    it('should trigger if conditions are met', () => {
      expect(shouldTriggerScaffold(CalibrationType.UNDERCONFIDENT, 6, 5)).toBe(true);
    });
  });

  describe('applyScaffoldingEffect', () => {
    it('should reduce calibration magnitude by delta', () => {
      expect(applyScaffoldingEffect(0.2, 0.1)).toBeCloseTo(0.18);
      expect(applyScaffoldingEffect(-0.2, 0.1)).toBeCloseTo(-0.18);
    });
  });

  describe('getScaffoldPrompt', () => {
    it('should return empty string for NONE', () => {
      expect(getScaffoldPrompt(ScaffoldType.NONE, 0)).toBe('');
    });

    it('should return a string for REFLECTION', () => {
      expect(getScaffoldPrompt(ScaffoldType.REFLECTION, 0)).toBe(SCAFFOLD_PROMPTS[ScaffoldType.REFLECTION][0]);
    });
  });

  describe('AdaptiveScaffoldingManager', () => {
    let manager: AdaptiveScaffoldingManager;
    const mockLearner: TrueLearnerState = {
      K_star: 0.5,
      beta_star: 0.2,
      alpha: 0.1,
      alpha_err: 0.05,
      lambda: 0.1,
    };

    beforeEach(() => {
      manager = new AdaptiveScaffoldingManager(0.05, 0.1, 5);
    });

    it('should deliver scaffold when conditions are met', () => {
      // Simulate 5 responses to pass min interval
      for (let i = 0; i < 5; i++) {
        manager.processResponse({} as any, 0, mockLearner);
      }

      const result = manager.processResponse({} as any, 0.2, mockLearner); // Overconfident
      expect(result.scaffold).toBe(ScaffoldType.REFLECTION);
      expect(result.updated_beta_star).toBeCloseTo(0.2 * 0.95);
    });

    it('should deliver encouragement scaffold when underconfident', () => {
      for (let i = 0; i < 5; i++) {
        manager.processResponse({} as any, 0, mockLearner);
      }
      const result = manager.processResponse({} as any, -0.2, mockLearner); // Underconfident
      expect(result.scaffold).toBe(ScaffoldType.ENCOURAGEMENT);
    });

    it('should return NONE when calibration is well-calibrated', () => {
      // Trigger it so calibration_type is WELL_CALIBRATED
      for (let i = 0; i < 5; i++) {
        manager.processResponse({} as any, 0.5, mockLearner);
      }
      // Beta hat = 0.05 is well calibrated
      const result = manager.processResponse({} as any, 0.05, mockLearner); 
      expect(result.scaffold).toBe(ScaffoldType.NONE);
      expect(result.updated_beta_star).toBe(mockLearner.beta_star);
    });

    it('should not deliver scaffold before min interval', () => {
      const result = manager.processResponse({} as any, 0.2, mockLearner);
      expect(result.scaffold).toBe(ScaffoldType.NONE);
      expect(result.updated_beta_star).toBe(0.2);
    });

    it('should track history and allow reset', () => {
      for (let i = 0; i < 6; i++) {
        manager.processResponse({} as any, 0.2, mockLearner);
      }
      expect(manager.getHistory().length).toBe(1);

      manager.reset();
      expect(manager.getHistory().length).toBe(0);
    });
  });
});
