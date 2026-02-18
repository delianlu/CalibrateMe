import { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileCardProps {
  profile: UserProfile;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
}

export default function ProfileCard({ profile, onExport, onImport, onReset }: ProfileCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const { stats, learnerState } = profile;
  const fileInputId = 'profile-import-file';

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImport(reader.result as string);
        setShowImport(false);
      } catch {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="profile-card card">
      <h2 className="profile-card__title">Your Profile</h2>

      {/* Stats grid */}
      <div className="profile-card__stats">
        <div className="profile-card__stat">
          <span className="profile-card__stat-value">{stats.totalReviews}</span>
          <span className="profile-card__stat-label">Total Reviews</span>
        </div>
        <div className="profile-card__stat">
          <span className="profile-card__stat-value">{stats.totalSessions}</span>
          <span className="profile-card__stat-label">Sessions</span>
        </div>
        <div className="profile-card__stat">
          <span className="profile-card__stat-value">
            {stats.totalReviews > 0 ? `${Math.round(stats.averageAccuracy * 100)}%` : '--'}
          </span>
          <span className="profile-card__stat-label">Accuracy</span>
        </div>
        <div className="profile-card__stat">
          <span className="profile-card__stat-value">{stats.currentStreak}</span>
          <span className="profile-card__stat-label">Day Streak</span>
        </div>
      </div>

      {/* Learner state */}
      <div className="profile-card__learner">
        <div className="profile-card__learner-row">
          <span>Knowledge (K-hat):</span>
          <strong>{(learnerState.globalKHat * 100).toFixed(0)}%</strong>
        </div>
        <div className="profile-card__learner-row">
          <span>Calibration:</span>
          <strong className={`profile-card__cal--${learnerState.calibrationType}`}>
            {learnerState.calibrationType.replace('-', ' ')}
          </strong>
        </div>
        <div className="profile-card__learner-row">
          <span>Ability:</span>
          <strong>{learnerState.abilityEstimate}</strong>
        </div>
        <div className="profile-card__learner-row">
          <span>Items tracked:</span>
          <strong>{Object.keys(profile.itemStates).length}</strong>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-card__actions">
        <button className="btn btn-secondary" onClick={onExport}>
          Export Backup
        </button>
        <button className="btn btn-secondary" onClick={() => setShowImport(s => !s)}>
          Import Backup
        </button>
        <button className="btn btn-secondary profile-card__reset" onClick={() => setShowConfirm(true)}>
          Clear Data
        </button>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="profile-card__import">
          <label htmlFor={fileInputId} className="profile-card__import-label">
            Upload a backup file:
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="profile-card__import-input"
          />
          <p className="profile-card__import-or">Or paste JSON:</p>
          <textarea
            className="profile-card__import-textarea"
            rows={4}
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <button
            className="btn btn-primary"
            disabled={!importText.trim()}
            onClick={() => {
              try {
                onImport(importText);
                setShowImport(false);
                setImportText('');
              } catch {
                alert('Invalid JSON');
              }
            }}
          >
            Import
          </button>
        </div>
      )}

      {/* Confirm delete */}
      {showConfirm && (
        <div className="profile-card__confirm">
          <p>Are you sure? This will erase all your progress and response history.</p>
          <div className="profile-card__confirm-actions">
            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary profile-card__reset"
              onClick={() => {
                onReset();
                setShowConfirm(false);
              }}
            >
              Yes, Clear Everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
