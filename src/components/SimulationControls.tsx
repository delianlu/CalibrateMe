// =============================================================================
// Simulation Controls (UPDATED)
// =============================================================================

import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { SchedulerType } from '../types';

const SimulationControls: React.FC = () => {
  const {
    config,
    setConfig,
    setSchedulerType,
    runSimulation,
    runComparison,
    reset,
    isRunning
  } = useSimulationStore();

  return (
    <div className="card">
      <h3 className="card-title">Simulation Settings</h3>

      <div className="form-group">
        <label className="form-label">Scheduler</label>
        <select
          className="form-select"
          value={config.scheduler_type}
          onChange={(e) => setSchedulerType(e.target.value as SchedulerType)}
          disabled={isRunning}
        >
          <option value={SchedulerType.CALIBRATEME}>CalibrateMe (Full)</option>
          <option value={SchedulerType.SM2}>SM-2 Baseline</option>
          <option value={SchedulerType.BKT_ONLY}>BKT-Only</option>
          <option value={SchedulerType.DECAY_BASED}>Decay-Based</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Number of Sessions</label>
        <input
          type="number"
          className="form-input"
          value={config.num_sessions}
          onChange={(e) => setConfig({ num_sessions: parseInt(e.target.value) || 30 })}
          min={1}
          max={100}
          disabled={isRunning}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Items per Session</label>
        <input
          type="number"
          className="form-input"
          value={config.items_per_session}
          onChange={(e) => setConfig({ items_per_session: parseInt(e.target.value) || 20 })}
          min={1}
          max={50}
          disabled={isRunning}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Total Items</label>
        <input
          type="number"
          className="form-input"
          value={config.num_items}
          onChange={(e) => setConfig({ num_items: parseInt(e.target.value) || 100 })}
          min={10}
          max={500}
          disabled={isRunning}
        />
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.enable_scaffolding}
            onChange={(e) => setConfig({ enable_scaffolding: e.target.checked })}
            disabled={isRunning}
          />
          <span className="form-label" style={{ margin: 0 }}>Enable Scaffolding</span>
        </label>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.enable_dual_process}
            onChange={(e) => setConfig({ enable_dual_process: e.target.checked })}
            disabled={isRunning}
          />
          <span className="form-label" style={{ margin: 0 }}>Enable Dual-Process</span>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          className="btn btn-primary btn-block"
          onClick={runSimulation}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : 'Run Simulation'}
        </button>

        <button
          className="btn btn-secondary btn-block"
          onClick={runComparison}
          disabled={isRunning}
          style={{ background: '#9f7aea', color: 'white' }}
        >
          Compare All Schedulers
        </button>

        <button
          className="btn btn-secondary btn-block"
          onClick={reset}
          disabled={isRunning}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
