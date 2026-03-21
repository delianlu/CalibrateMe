// =============================================================================
// Zustand Store for Advanced Analytics (Ablation, Sensitivity, δ-Sweep)
// Uses Web Worker for non-blocking execution when available
// =============================================================================

import { create } from 'zustand';
import { DEFAULT_SIMULATION_CONFIG, SimulationConfig } from '../src/types';
import { AblationResults, runAblationStudy, DEFAULT_CONDITIONS } from '../src/simulation/ablationRunner';
import {
  SensitivityReport,
  SensitivitySweepConfig,
  runSensitivitySweep,
} from '../src/simulation/sensitivityAnalysis';
import {
  DeltaSweepReport,
  runDeltaSweep,
  DEFAULT_DELTAS,
} from '../src/simulation/deltaSweep';
import { getCoreProfileNames } from '../src/profiles/learnerProfiles';

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
  cancel: () => void;
  reset: () => void;
}

// Worker instance shared across store actions
let worker: Worker | null = null;
let workerResolve: ((value: any) => void) | null = null;
let workerReject: ((reason: any) => void) | null = null;

function getOrCreateWorker(onProgress: (pct: number, msg: string) => void): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../src/workers/simulationWorker.ts', 'http://localhost'),
      { type: 'module' }
    );
  }

  worker.onmessage = (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'progress': {
        const pct = msg.total > 0 ? (msg.completed / msg.total) * 100 : 0;
        onProgress(pct, msg.currentTask);
        break;
      }
      case 'result':
        workerResolve?.(msg.data);
        workerResolve = null;
        workerReject = null;
        break;
      case 'error':
        workerReject?.(new Error(msg.message));
        workerResolve = null;
        workerReject = null;
        break;
    }
  };

  worker.onerror = (err) => {
    workerReject?.(new Error(err.message || 'Worker error'));
    workerResolve = null;
    workerReject = null;
  };

  return worker;
}

function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    workerResolve = null;
    workerReject = null;
  }
}

// Check if we're in a browser environment with Worker support
const supportsWorker = typeof window !== 'undefined' && typeof Worker !== 'undefined';

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
      let results: AblationResults;

      if (supportsWorker) {
        const w = getOrCreateWorker((pct: number, msg: string) => {
          set({ progress: pct, progressMessage: msg });
        });

        results = await new Promise<AblationResults>((resolve, reject) => {
          workerResolve = resolve;
          workerReject = reject;
          w.postMessage({ type: 'ablation', nSeeds, config });
        });
      } else {
        // Fallback: run on main thread
        results = await new Promise<AblationResults>((resolve, reject) => {
          setTimeout(() => {
            try {
              const r = runAblationStudy(nSeeds, config, DEFAULT_CONDITIONS, getCoreProfileNames(), (pct: number, msg: string) => {
                set({ progress: pct, progressMessage: msg });
              });
              resolve(r);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }

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
      let report: SensitivityReport;

      if (supportsWorker) {
        const w = getOrCreateWorker((pct: number, msg: string) => {
          set({ progress: pct, progressMessage: msg });
        });

        report = await new Promise<SensitivityReport>((resolve, reject) => {
          workerResolve = resolve;
          workerReject = reject;
          w.postMessage({ type: 'sensitivity', sweep, nSeeds, config });
        });
      } else {
        report = await new Promise<SensitivityReport>((resolve, reject) => {
          setTimeout(() => {
            try {
              const profiles = ['Med-Over', 'Med-Under', 'Med-Well'];
              const r = runSensitivitySweep(sweep, nSeeds, config, profiles, (pct: number, msg: string) => {
                set({ progress: pct, progressMessage: msg });
              });
              resolve(r);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }

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
      let report: DeltaSweepReport;

      if (supportsWorker) {
        const w = getOrCreateWorker((pct: number, msg: string) => {
          set({ progress: pct, progressMessage: msg });
        });

        report = await new Promise<DeltaSweepReport>((resolve, reject) => {
          workerResolve = resolve;
          workerReject = reject;
          w.postMessage({ type: 'deltaSweep', nSeeds, config });
        });
      } else {
        report = await new Promise<DeltaSweepReport>((resolve, reject) => {
          setTimeout(() => {
            try {
              const profiles = ['Med-Over', 'Med-Under', 'Med-Well', 'High-Over', 'Low-Over'];
              const r = runDeltaSweep(DEFAULT_DELTAS, nSeeds, config, profiles, (pct: number, msg: string) => {
                set({ progress: pct, progressMessage: msg });
              });
              resolve(r);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }

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

  cancel: () => {
    terminateWorker();
    set({
      isRunning: false,
      progress: 0,
      progressMessage: '',
      error: null,
    });
  },

  reset: () => {
    terminateWorker();
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
