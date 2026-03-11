// =============================================================================
// Zustand Store for Advanced Analytics (Ablation, Sensitivity, δ-Sweep)
// =============================================================================

import { create } from 'zustand';
import { DEFAULT_SIMULATION_CONFIG, SimulationConfig } from '../types';
import { AblationResults, runAblationStudy, DEFAULT_CONDITIONS } from '../simulation/ablationRunner';
import {
  SensitivityReport,
  SensitivitySweepConfig,
  runSensitivitySweep,
} from '../simulation/sensitivityAnalysis';
import {
  DeltaSweepReport,
  runDeltaSweep,
  DEFAULT_DELTAS,
} from '../simulation/deltaSweep';
import { getCoreProfileNames } from '../profiles/learnerProfiles';

interface AdvancedAnalyticsStore {
  // State
  ablationResults: AblationResults | null;
  sensitivityReports: SensitivityReport[];
  deltaSweepReport: DeltaSweepReport | null;
  isRunning: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;

  // Actions
  runAblation: (nSeeds?: number, config?: SimulationConfig) => Promise<void>;
  runSensitivity: (sweep: SensitivitySweepConfig, nSeeds?: number, config?: SimulationConfig) => Promise<void>;
  runDeltaSweep: (nSeeds?: number, config?: SimulationConfig) => Promise<void>;
  reset: () => void;
}

export const useAdvancedAnalyticsStore = create<AdvancedAnalyticsStore>((set) => ({
  ablationResults: null,
  sensitivityReports: [],
  deltaSweepReport: null,
  isRunning: false,
  progress: 0,
  progressMessage: '',
  error: null,

  runAblation: async (nSeeds = 30, config = DEFAULT_SIMULATION_CONFIG) => {
    set({
      isRunning: true, error: null, progress: 0,
      progressMessage: 'Starting ablation study...',
    });

    try {
      // Use setTimeout to yield to UI
      const results = await new Promise<AblationResults>((resolve) => {
        setTimeout(() => {
          const r = runAblationStudy(nSeeds, config, DEFAULT_CONDITIONS, getCoreProfileNames(), (pct, msg) => {
            set({ progress: pct, progressMessage: msg });
          });
          resolve(r);
        }, 0);
      });

      set({
        ablationResults: results,
        isRunning: false, progress: 100, progressMessage: 'Ablation complete',
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ablation failed',
        isRunning: false,
      });
    }
  },

  runSensitivity: async (sweep, nSeeds = 10, config = DEFAULT_SIMULATION_CONFIG) => {
    set({
      isRunning: true, error: null, progress: 0,
      progressMessage: `Sensitivity: ${sweep.parameterName}...`,
    });

    try {
      const report = await new Promise<SensitivityReport>((resolve) => {
        setTimeout(() => {
          // Use representative subset for speed
          const profiles = ['Med-Over', 'Med-Under', 'Med-Well'];
          const r = runSensitivitySweep(sweep, nSeeds, config, profiles, (pct, msg) => {
            set({ progress: pct, progressMessage: msg });
          });
          resolve(r);
        }, 0);
      });

      set(state => ({
        sensitivityReports: [...state.sensitivityReports.filter(r => r.parameterName !== sweep.parameterName), report],
        isRunning: false, progress: 100, progressMessage: 'Sensitivity complete',
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Sensitivity analysis failed',
        isRunning: false,
      });
    }
  },

  runDeltaSweep: async (nSeeds = 15, config = DEFAULT_SIMULATION_CONFIG) => {
    set({
      isRunning: true, error: null, progress: 0,
      progressMessage: 'Starting δ dose-response sweep...',
    });

    try {
      const report = await new Promise<DeltaSweepReport>((resolve) => {
        setTimeout(() => {
          // Use representative profiles for speed
          const profiles = ['Med-Over', 'Med-Under', 'Med-Well', 'High-Over', 'Low-Over'];
          const r = runDeltaSweep(DEFAULT_DELTAS, nSeeds, config, profiles, (pct, msg) => {
            set({ progress: pct, progressMessage: msg });
          });
          resolve(r);
        }, 0);
      });

      set({
        deltaSweepReport: report,
        isRunning: false, progress: 100, progressMessage: 'δ sweep complete',
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'δ sweep failed',
        isRunning: false,
      });
    }
  },

  reset: () => {
    set({
      ablationResults: null,
      sensitivityReports: [],
      deltaSweepReport: null,
      error: null,
      progress: 0,
      progressMessage: '',
    });
  },
}));
