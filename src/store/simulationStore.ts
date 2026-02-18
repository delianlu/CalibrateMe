// =============================================================================
// Zustand Store for Simulation State (FIXED)
// =============================================================================

import { create } from 'zustand';
import {
  LearnerProfile,
  SimulationConfig,
  SimulationResults,
  SchedulerType,
  DEFAULT_SIMULATION_CONFIG,
} from '../types';
import { createLearnerProfile } from '../profiles/learnerProfiles';
import { runSimulationAsync } from '../simulation/simulationEngine';

interface SimulationStore {
  // State
  selectedProfile: string;
  config: SimulationConfig;
  profile: LearnerProfile | null;
  results: SimulationResults | null;
  comparisonResults: Map<SchedulerType, SimulationResults> | null;
  isRunning: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;

  // Actions
  setSelectedProfile: (profileName: string) => void;
  setSchedulerType: (type: SchedulerType) => void;
  setConfig: (config: Partial<SimulationConfig>) => void;
  runSimulation: () => Promise<void>;
  runComparison: () => Promise<void>;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  selectedProfile: 'Med-Over',
  config: DEFAULT_SIMULATION_CONFIG,
  profile: null,
  results: null,
  comparisonResults: null,
  isRunning: false,
  progress: 0,
  progressMessage: '',
  error: null,

  // Actions
  setSelectedProfile: (profileName: string) => {
    set({ selectedProfile: profileName, results: null, comparisonResults: null });
  },

  setSchedulerType: (type: SchedulerType) => {
    set(state => ({
      config: { ...state.config, scheduler_type: type },
      results: null,
    }));
  },

  setConfig: (newConfig: Partial<SimulationConfig>) => {
    set(state => ({
      config: { ...state.config, ...newConfig },
      results: null,
    }));
  },

  runSimulation: async () => {
    const { selectedProfile, config } = get();

    set({ isRunning: true, error: null, progress: 0, progressMessage: 'Initializing...' });

    try {
      // Create profile
      const profile = createLearnerProfile(selectedProfile, config.num_items);

      // Run simulation with progress callback
      const results = await runSimulationAsync(profile, config, (progress, message) => {
        set({ progress, progressMessage: message });
      });

      set({ profile, results, isRunning: false, progress: 100, progressMessage: 'Complete' });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Simulation failed',
        isRunning: false,
        progress: 0,
        progressMessage: '',
      });
    }
  },

  runComparison: async () => {
    const { selectedProfile, config } = get();

    set({ isRunning: true, error: null, progress: 0, progressMessage: 'Running comparison...' });

    try {
      const profile = createLearnerProfile(selectedProfile, config.num_items);
      const schedulerTypes = [
        SchedulerType.CALIBRATEME,
        SchedulerType.SM2,
        SchedulerType.BKT_ONLY,
        SchedulerType.DECAY_BASED,
      ];

      const comparisonResults = new Map<SchedulerType, SimulationResults>();

      for (let i = 0; i < schedulerTypes.length; i++) {
        const schedulerType = schedulerTypes[i];
        set({
          progress: (i / schedulerTypes.length) * 100,
          progressMessage: `Running ${schedulerType}...`
        });

        const simConfig = { ...config, scheduler_type: schedulerType };
        const result = await runSimulationAsync(profile, simConfig);
        comparisonResults.set(schedulerType, result);
      }

      set({
        profile,
        comparisonResults,
        isRunning: false,
        progress: 100,
        progressMessage: 'Comparison complete'
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Comparison failed',
        isRunning: false,
      });
    }
  },

  reset: () => {
    set({
      profile: null,
      results: null,
      comparisonResults: null,
      error: null,
      progress: 0,
      progressMessage: '',
    });
  },
}));
