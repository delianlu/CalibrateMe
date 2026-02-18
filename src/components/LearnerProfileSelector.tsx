import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { getAllProfileNames, PROFILE_PARAMS } from '../profiles/learnerProfiles';

const LearnerProfileSelector: React.FC = () => {
  const { selectedProfile, setSelectedProfile } = useSimulationStore();
  const profiles = getAllProfileNames();
  const params = PROFILE_PARAMS[selectedProfile];

  return (
    <div className="card">
      <h3 className="card-title">Learner Profile</h3>

      <div className="form-group">
        <label className="form-label">Select Profile</label>
        <select
          className="form-select"
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
        >
          {profiles.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {params && (
        <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
          <p><strong>Ability:</strong> {params.ability}</p>
          <p><strong>Calibration:</strong> {params.calibration}</p>
          <p><strong>Learning Rate (α):</strong> {params.alpha}</p>
          <p><strong>Forgetting Rate (λ):</strong> {params.lambda}</p>
          <p><strong>Calibration Bias (β*):</strong> {params.beta_star > 0 ? '+' : ''}{params.beta_star}</p>
        </div>
      )}
    </div>
  );
};

export default LearnerProfileSelector;
