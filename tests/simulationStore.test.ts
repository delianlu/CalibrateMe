import { vi } from 'vitest';
import { useSimulationStore } from '../src/store/simulationStore';
import { SchedulerType, DEFAULT_SIMULATION_CONFIG } from '../src/types';
import * as simulationEngine from '../src/simulation/simulationEngine';
import * as learnerProfiles from '../src/profiles/learnerProfiles';

// Mock dependencies
vi.mock('../src/simulation/simulationEngine', () => ({
  runSimulationAsync: vi.fn(),
}));

vi.mock('../src/profiles/learnerProfiles', () => ({
  createLearnerProfile: vi.fn(),
  getAllProfileNames: vi.fn(() => ['Med-Over', 'High-Well']),
}));

describe('Simulation Store', () => {
  beforeEach(() => {
    useSimulationStore.getState().reset();
    useSimulationStore.setState({
      selectedProfile: 'Med-Over',
      config: DEFAULT_SIMULATION_CONFIG,
    });
    vi.clearAllMocks();
  });

  describe('setters and sync actions', () => {
    it('setSelectedProfile updates state and clears results', () => {
      useSimulationStore.setState({ results: {} as any, comparisonResults: new Map() });

      useSimulationStore.getState().setSelectedProfile('High-Well');
      const state = useSimulationStore.getState();

      expect(state.selectedProfile).toBe('High-Well');
      expect(state.results).toBeNull();
      expect(state.comparisonResults).toBeNull();
    });

    it('setSchedulerType updates config and clears results', () => {
      useSimulationStore.setState({ results: {} as any });

      useSimulationStore.getState().setSchedulerType(SchedulerType.SM2);
      const state = useSimulationStore.getState();

      expect(state.config.scheduler_type).toBe(SchedulerType.SM2);
      expect(state.results).toBeNull();
    });

    it('setConfig merges config and clears results', () => {
      useSimulationStore.setState({ results: {} as any });

      useSimulationStore.getState().setConfig({ num_sessions: 99 });
      const state = useSimulationStore.getState();

      expect(state.config.num_sessions).toBe(99);
      expect(state.config.items_per_session).toBe(DEFAULT_SIMULATION_CONFIG.items_per_session); // Other fields preserved
      expect(state.results).toBeNull();
    });

    it('reset clears all simulation results', () => {
      useSimulationStore.setState({
        profile: {} as any,
        results: {} as any,
        comparisonResults: new Map(),
        hypothesisResults: new Map(),
        error: 'some error',
        progress: 50,
        progressMessage: 'running',
      });

      useSimulationStore.getState().reset();
      const state = useSimulationStore.getState();

      expect(state.profile).toBeNull();
      expect(state.results).toBeNull();
      expect(state.comparisonResults).toBeNull();
      expect(state.hypothesisResults).toBeNull();
      expect(state.error).toBeNull();
      expect(state.progress).toBe(0);
      expect(state.progressMessage).toBe('');
    });
  });

  describe('runSimulation', () => {
    it('runs simulation successfully', async () => {
      const mockProfile = { id: 'Med-Over' };
      const mockResult = { profile_id: 'Med-Over' };

      vi.mocked(learnerProfiles.createLearnerProfile).mockReturnValue(mockProfile as any);
      vi.mocked(simulationEngine.runSimulationAsync).mockImplementation(async (prof, conf, onProgress) => {
        onProgress!(50, 'halfway');
        return mockResult as any;
      });

      const promise = useSimulationStore.getState().runSimulation();

      // Check intermediate state
      expect(useSimulationStore.getState().isRunning).toBe(true);

      await promise;

      const state = useSimulationStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.progress).toBe(100);
      expect(state.progressMessage).toBe('Complete');
      expect(state.profile).toBe(mockProfile);
      expect(state.results).toBe(mockResult);
      expect(state.error).toBeNull();

      expect(learnerProfiles.createLearnerProfile).toHaveBeenCalledWith('Med-Over', DEFAULT_SIMULATION_CONFIG.num_items);
    });

    it('handles simulation errors', async () => {
      vi.mocked(learnerProfiles.createLearnerProfile).mockReturnValue({} as any);
      vi.mocked(simulationEngine.runSimulationAsync).mockRejectedValue(new Error('Sim failed'));

      await useSimulationStore.getState().runSimulation();

      const state = useSimulationStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe('Sim failed');
      expect(state.results).toBeNull();
    });
  });

  describe('runComparison', () => {
    it('runs comparison across all schedulers', async () => {
      const mockProfile = { id: 'Med-Over' };
      vi.mocked(learnerProfiles.createLearnerProfile).mockReturnValue(mockProfile as any);
      vi.mocked(simulationEngine.runSimulationAsync).mockResolvedValue({} as any);

      await useSimulationStore.getState().runComparison();

      const state = useSimulationStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.comparisonResults).toBeInstanceOf(Map);
      expect(state.comparisonResults?.size).toBe(4); // 4 schedulers
      expect(state.comparisonResults?.has(SchedulerType.CALIBRATEME)).toBe(true);
      expect(state.comparisonResults?.has(SchedulerType.SM2)).toBe(true);

      expect(simulationEngine.runSimulationAsync).toHaveBeenCalledTimes(4);
    });

    it('handles comparison errors', async () => {
      vi.mocked(learnerProfiles.createLearnerProfile).mockReturnValue({} as any);
      vi.mocked(simulationEngine.runSimulationAsync).mockRejectedValue(new Error('Comp failed'));

      await useSimulationStore.getState().runComparison();

      const state = useSimulationStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe('Comp failed');
    });
  });

  describe('runHypothesisTests', () => {
    it('runs hypothesis tests across profiles and schedulers', async () => {
      vi.mocked(learnerProfiles.createLearnerProfile).mockReturnValue({} as any);
      vi.mocked(simulationEngine.runSimulationAsync).mockResolvedValue({} as any);

      await useSimulationStore.getState().runHypothesisTests();

      const state = useSimulationStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.progress).toBe(100);
      expect(state.hypothesisResults).toBeInstanceOf(Map);

      // 2 mocked profiles * 4 schedulers = 8 calls
      expect(simulationEngine.runSimulationAsync).toHaveBeenCalledTimes(8);

      expect(state.hypothesisResults?.has('Med-Over')).toBe(true);
      expect(state.hypothesisResults?.has('High-Well')).toBe(true);

      const medOverResult = state.hypothesisResults?.get('Med-Over');
      expect(medOverResult?.size).toBe(4); // 4 schedulers
    });

    it('handles hypothesis errors', async () => {
      vi.mocked(learnerProfiles.createLearnerProfile).mockReturnValue({} as any);
      vi.mocked(simulationEngine.runSimulationAsync).mockRejectedValue(new Error('Hyp failed'));

      await useSimulationStore.getState().runHypothesisTests();

      const state = useSimulationStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe('Hyp failed');
    });
  });
});
