// =============================================================================
// Web Worker for Long-Running Simulation Analyses
// Runs ablation, sensitivity, and delta sweep off the main thread
// =============================================================================

import { SimulationConfig } from '../types';
import { runAblationStudy, DEFAULT_CONDITIONS, AblationResults } from '../simulation/ablationRunner';
import { runSensitivitySweep, SensitivitySweepConfig, SensitivityReport } from '../simulation/sensitivityAnalysis';
import { runDeltaSweep, DEFAULT_DELTAS, DeltaSweepReport } from '../simulation/deltaSweep';
import { getCoreProfileNames } from '../profiles/learnerProfiles';

// ---------------------------------------------------------------------------
// Message Types
// ---------------------------------------------------------------------------

export type WorkerRequest =
  | { type: 'ablation'; nSeeds: number; config: SimulationConfig; profileNames?: string[] }
  | { type: 'sensitivity'; sweep: SensitivitySweepConfig; nSeeds: number; config: SimulationConfig; profileNames?: string[] }
  | { type: 'deltaSweep'; nSeeds: number; config: SimulationConfig; profileNames?: string[] };

export type WorkerResponse =
  | { type: 'progress'; completed: number; total: number; currentTask: string }
  | { type: 'result'; taskType: 'ablation'; data: AblationResults }
  | { type: 'result'; taskType: 'sensitivity'; data: SensitivityReport }
  | { type: 'result'; taskType: 'deltaSweep'; data: DeltaSweepReport }
  | { type: 'error'; message: string };

// ---------------------------------------------------------------------------
// Progress throttling — post at most every 50ms to avoid message overhead
// ---------------------------------------------------------------------------

let lastProgressTime = 0;
const PROGRESS_THROTTLE_MS = 50;

function postProgress(completed: number, total: number, currentTask: string): void {
  const now = Date.now();
  if (now - lastProgressTime >= PROGRESS_THROTTLE_MS || completed === total) {
    lastProgressTime = now;
    self.postMessage({ type: 'progress', completed, total, currentTask } satisfies WorkerResponse);
  }
}

// ---------------------------------------------------------------------------
// Message Handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case 'ablation': {
        const profiles = msg.profileNames ?? getCoreProfileNames();
        const totalRuns = profiles.length * DEFAULT_CONDITIONS.length * msg.nSeeds;
        let completed = 0;

        const results = runAblationStudy(
          msg.nSeeds,
          msg.config,
          DEFAULT_CONDITIONS,
          profiles,
          (_pct, taskMsg) => {
            completed++;
            postProgress(completed, totalRuns, taskMsg);
          }
        );

        self.postMessage({ type: 'result', taskType: 'ablation', data: results } satisfies WorkerResponse);
        break;
      }

      case 'sensitivity': {
        const profiles = msg.profileNames ?? ['Med-Over', 'Med-Under', 'Med-Well'];
        const totalRuns = msg.sweep.values.length * profiles.length * 2 * msg.nSeeds;
        let completed = 0;

        const report = runSensitivitySweep(
          msg.sweep,
          msg.nSeeds,
          msg.config,
          profiles,
          (_pct, taskMsg) => {
            completed++;
            postProgress(completed, totalRuns, taskMsg);
          }
        );

        self.postMessage({ type: 'result', taskType: 'sensitivity', data: report } satisfies WorkerResponse);
        break;
      }

      case 'deltaSweep': {
        const profiles = msg.profileNames ?? ['Med-Over', 'Med-Under', 'Med-Well', 'High-Over', 'Low-Over'];
        const totalRuns = DEFAULT_DELTAS.length * profiles.length * msg.nSeeds;
        let completed = 0;

        const report = runDeltaSweep(
          DEFAULT_DELTAS,
          msg.nSeeds,
          msg.config,
          profiles,
          (_pct, taskMsg) => {
            completed++;
            postProgress(completed, totalRuns, taskMsg);
          }
        );

        self.postMessage({ type: 'result', taskType: 'deltaSweep', data: report } satisfies WorkerResponse);
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Worker error';
    self.postMessage({ type: 'error', message } satisfies WorkerResponse);
  }
};
