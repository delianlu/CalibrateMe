import { vi } from 'vitest';
import { useAdvancedAnalyticsStore } from './advancedAnalyticsStore.mock';
import * as ablationRunner from '../src/simulation/ablationRunner';
import * as sensitivityAnalysis from '../src/simulation/sensitivityAnalysis';
import * as deltaSweep from '../src/simulation/deltaSweep';
import { DEFAULT_SIMULATION_CONFIG } from '../src/types';

vi.mock('../src/simulation/ablationRunner', () => ({
  runAblationStudy: vi.fn(),
  DEFAULT_CONDITIONS: [],
}));

vi.mock('../src/simulation/sensitivityAnalysis', () => ({
  runSensitivitySweep: vi.fn(),
}));

vi.mock('../src/simulation/deltaSweep', () => ({
  runDeltaSweep: vi.fn(),
  DEFAULT_DELTAS: [],
}));

// Mock learnerProfiles to avoid real profile generation in fallback
vi.mock('../src/profiles/learnerProfiles', () => ({
  getCoreProfileNames: vi.fn(() => ['Med-Over']),
}));

describe('Advanced Analytics Store', () => {
  beforeEach(() => {
    useAdvancedAnalyticsStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('runAblation', () => {
    it('runs ablation successfully via fallback', async () => {
      const mockResult = { overall_impact: {} } as any;
      vi.mocked(ablationRunner.runAblationStudy).mockImplementation((nSeeds, conf, conds, profiles, onProgress) => {
        onProgress!(50, 'halfway');
        return mockResult;
      });

      const promise = useAdvancedAnalyticsStore.getState().runAblation();
      expect(useAdvancedAnalyticsStore.getState().isRunning).toBe(true);
      await promise;

      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.ablationResults).toBe(mockResult);
      expect(state.progress).toBe(100);
      expect(state.progressMessage).toBe('Ablation complete');
    });

    it('handles ablation error', async () => {
      vi.mocked(ablationRunner.runAblationStudy).mockImplementation(() => {
        throw new Error('Ablation Error');
      });

      await useAdvancedAnalyticsStore.getState().runAblation();

      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe('Ablation Error');
    });
  });

  describe('runSensitivity', () => {
    it('runs sensitivity successfully via fallback', async () => {
      const mockReport = { parameterName: 'lambda' } as any;
      vi.mocked(sensitivityAnalysis.runSensitivitySweep).mockImplementation((sweep, nSeeds, conf, profs, onProgress) => {
        onProgress!(50, 'running');
        return mockReport;
      });

      const sweep = { parameterName: 'lambda', values: [0.1] };
      await useAdvancedAnalyticsStore.getState().runSensitivity(sweep);

      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.sensitivityReports).toContain(mockReport);
    });

    it('handles sensitivity error', async () => {
      vi.mocked(sensitivityAnalysis.runSensitivitySweep).mockImplementation(() => {
        throw new Error('Sens Error');
      });

      const sweep = { parameterName: 'lambda', values: [0.1] };
      await useAdvancedAnalyticsStore.getState().runSensitivity(sweep);

      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe('Sens Error');
    });
  });

  describe('runDeltaSweep', () => {
    it('runs delta sweep successfully via fallback', async () => {
      const mockReport = { deltas: [] } as any;
      vi.mocked(deltaSweep.runDeltaSweep).mockImplementation((deltas, nSeeds, conf, profs, onProgress) => {
        onProgress!(50, 'running');
        return mockReport;
      });

      await useAdvancedAnalyticsStore.getState().runDeltaSweep();

      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.deltaSweepReport).toBe(mockReport);
    });

    it('handles delta sweep error', async () => {
      vi.mocked(deltaSweep.runDeltaSweep).mockImplementation(() => {
        throw new Error('Delta Error');
      });

      await useAdvancedAnalyticsStore.getState().runDeltaSweep();

      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe('Delta Error');
    });
  });

  describe('cancel and reset', () => {
    it('cancel terminates cleanly and stops running state', () => {
      useAdvancedAnalyticsStore.setState({ isRunning: true, progress: 50, progressMessage: 'running', error: 'err' });
      useAdvancedAnalyticsStore.getState().cancel();
      const state = useAdvancedAnalyticsStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.progressMessage).toBe('');
      expect(state.error).toBeNull();
    });

    it('reset clears all results', () => {
      useAdvancedAnalyticsStore.setState({
        ablationResults: {} as any,
        sensitivityReports: [{} as any],
        deltaSweepReport: {} as any,
      });
      useAdvancedAnalyticsStore.getState().reset();
      const state = useAdvancedAnalyticsStore.getState();
      expect(state.ablationResults).toBeNull();
      expect(state.sensitivityReports.length).toBe(0);
      expect(state.deltaSweepReport).toBeNull();
    });
  });
});
