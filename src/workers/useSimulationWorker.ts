// =============================================================================
// React Hook for Simulation Web Worker
// Provides non-blocking execution with progress tracking and cancellation
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { SimulationConfig, DEFAULT_SIMULATION_CONFIG } from '../types';
import { AblationResults } from '../simulation/ablationRunner';
import { SensitivityReport, SensitivitySweepConfig } from '../simulation/sensitivityAnalysis';
import { DeltaSweepReport } from '../simulation/deltaSweep';
import type { WorkerRequest, WorkerResponse } from './simulationWorker';

export interface WorkerProgress {
  completed: number;
  total: number;
  currentTask: string;
}

export interface UseSimulationWorker {
  isRunning: boolean;
  progress: WorkerProgress | null;
  runAblation: (nSeeds?: number, config?: SimulationConfig) => Promise<AblationResults>;
  runSensitivity: (sweep: SensitivitySweepConfig, nSeeds?: number, config?: SimulationConfig) => Promise<SensitivityReport>;
  runDeltaSweep: (nSeeds?: number, config?: SimulationConfig) => Promise<DeltaSweepReport>;
  cancel: () => void;
}

function createWorker(): Worker {
  return new Worker(
    new URL('./simulationWorker.ts', import.meta.url),
    { type: 'module' }
  );
}

export function useSimulationWorker(): UseSimulationWorker {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<WorkerProgress | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const rejectRef = useRef<((reason: any) => void) | null>(null);

  // Ensure worker is created
  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = createWorker();
    }
    return workerRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const setupWorkerListener = useCallback((expectedTaskType: string) => {
    const worker = getWorker();

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'progress':
          setProgress({
            completed: msg.completed,
            total: msg.total,
            currentTask: msg.currentTask,
          });
          break;

        case 'result':
          if (msg.taskType === expectedTaskType) {
            setIsRunning(false);
            setProgress(null);
            resolveRef.current?.(msg.data);
            resolveRef.current = null;
            rejectRef.current = null;
          }
          break;

        case 'error':
          setIsRunning(false);
          setProgress(null);
          rejectRef.current?.(new Error(msg.message));
          resolveRef.current = null;
          rejectRef.current = null;
          break;
      }
    };

    worker.onerror = (err) => {
      setIsRunning(false);
      setProgress(null);
      rejectRef.current?.(new Error(err.message || 'Worker error'));
      resolveRef.current = null;
      rejectRef.current = null;
    };
  }, [getWorker]);

  const runAblation = useCallback((
    nSeeds: number = 30,
    config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  ): Promise<AblationResults> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      setIsRunning(true);
      setProgress({ completed: 0, total: 1, currentTask: 'Starting ablation...' });

      setupWorkerListener('ablation');
      const worker = getWorker();
      worker.postMessage({ type: 'ablation', nSeeds, config } satisfies WorkerRequest);
    });
  }, [getWorker, setupWorkerListener]);

  const runSensitivity = useCallback((
    sweep: SensitivitySweepConfig,
    nSeeds: number = 10,
    config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  ): Promise<SensitivityReport> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      setIsRunning(true);
      setProgress({ completed: 0, total: 1, currentTask: `Starting ${sweep.parameterName} sweep...` });

      setupWorkerListener('sensitivity');
      const worker = getWorker();
      worker.postMessage({ type: 'sensitivity', sweep, nSeeds, config } satisfies WorkerRequest);
    });
  }, [getWorker, setupWorkerListener]);

  const runDeltaSweep = useCallback((
    nSeeds: number = 15,
    config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
  ): Promise<DeltaSweepReport> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      setIsRunning(true);
      setProgress({ completed: 0, total: 1, currentTask: 'Starting δ sweep...' });

      setupWorkerListener('deltaSweep');
      const worker = getWorker();
      worker.postMessage({ type: 'deltaSweep', nSeeds, config } satisfies WorkerRequest);
    });
  }, [getWorker, setupWorkerListener]);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
    setProgress(null);
    rejectRef.current?.(new Error('Cancelled'));
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  return { isRunning, progress, runAblation, runSensitivity, runDeltaSweep, cancel };
}
