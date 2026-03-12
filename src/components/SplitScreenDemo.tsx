// =============================================================================
// SplitScreenDemo — Animated SM-2 vs CalibrateMe side-by-side comparison
// "The Same Learner. Two Different Schedulers."
// For 5-minute presentation video — pre-computed, animated at ~0.5s per session
// =============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { createLearnerProfile } from '../profiles/learnerProfiles';
import { runSimulation } from '../simulation/simulationEngine';
import { SchedulerType, SimulationConfig, DEFAULT_SIMULATION_CONFIG } from '../types';

interface SessionSnapshot {
  session: number;
  K_star: number;
  K_hat: number;
  ece: number;
  brier: number;
  confidence: number;
  accuracy: number;
  beta_hat: number;
}

interface SplitScreenData {
  sm2: SessionSnapshot[];
  calibrateme: SessionSnapshot[];
}

function precomputeData(seed: number = 42): SplitScreenData {
  const baseConfig: SimulationConfig = {
    ...DEFAULT_SIMULATION_CONFIG,
    num_sessions: 30,
    num_items: 100,
    items_per_session: 20,
    random_seed: seed,
    enable_scaffolding: true,
    enable_dual_process: true,
  };

  const profile1 = createLearnerProfile('Med-Over', baseConfig.num_items);
  const profile2 = createLearnerProfile('Med-Over', baseConfig.num_items);

  const sm2Results = runSimulation(profile1, { ...baseConfig, scheduler_type: SchedulerType.SM2 });
  const cmResults = runSimulation(profile2, { ...baseConfig, scheduler_type: SchedulerType.CALIBRATEME });

  const toSnapshots = (r: typeof sm2Results): SessionSnapshot[] =>
    r.session_data.map((s, i) => ({
      session: i + 1,
      K_star: r.K_star_trajectory[i],
      K_hat: r.K_hat_trajectory[i],
      ece: r.ece_trajectory[i],
      brier: r.brier_trajectory[i],
      confidence: s.mean_confidence,
      accuracy: s.correct_count / Math.max(1, s.items_reviewed),
      beta_hat: s.mean_confidence - s.correct_count / Math.max(1, s.items_reviewed),
    }));

  return {
    sm2: toSnapshots(sm2Results),
    calibrateme: toSnapshots(cmResults),
  };
}

type PlaybackSpeed = 0.5 | 1 | 2;

const SplitScreenDemo: React.FC = () => {
  const data = useMemo(() => precomputeData(42), []);
  const [currentSession, setCurrentSession] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isDark, setIsDark] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSessions = 30;
  const intervalMs = 500 / speed;

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    stopPlayback();
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentSession(prev => {
        if (prev >= totalSessions - 1) {
          stopPlayback();
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
  }, [intervalMs, stopPlayback]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Restart interval when speed changes during playback
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    }
  }, [speed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    stopPlayback();
    setCurrentSession(0);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentSession >= totalSessions - 1) {
        setCurrentSession(0);
      }
      startPlayback();
    }
  };

  const sm2Data = data.sm2.slice(0, currentSession + 1);
  const cmData = data.calibrateme.slice(0, currentSession + 1);

  const currentSM2 = data.sm2[currentSession];
  const currentCM = data.calibrateme[currentSession];

  const theme = isDark
    ? { bg: '#0f172a', card: '#1e293b', text: '#e2e8f0', muted: '#94a3b8', grid: '#334155', border: '#475569' }
    : { bg: '#f8fafc', card: '#ffffff', text: '#1e293b', muted: '#64748b', grid: '#e2e8f0', border: '#e2e8f0' };

  const sm2Color = '#ef4444';
  const cmColor = '#22c55e';

  return (
    <div
      className="split-screen-demo"
      style={{
        background: theme.bg,
        color: theme.text,
        minHeight: '100vh',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          The Same Learner. Two Different Schedulers.
        </h1>
        <p style={{ fontSize: '1rem', color: theme.muted, margin: 0 }}>
          Med-Over profile (β* = +0.20) &mdash; Session {currentSession + 1} / {totalSessions}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <button
          onClick={handlePlayPause}
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: isPlaying ? '#ef4444' : '#22c55e',
            color: 'white',
            cursor: 'pointer',
            minWidth: '80px',
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            borderRadius: '6px',
            border: `1px solid ${theme.border}`,
            background: theme.card,
            color: theme.text,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
          {([0.5, 1, 2] as PlaybackSpeed[]).map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '4px',
                border: `1px solid ${speed === s ? cmColor : theme.border}`,
                background: speed === s ? cmColor : theme.card,
                color: speed === s ? 'white' : theme.text,
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: `1px solid ${theme.border}`,
            background: theme.card,
            color: theme.text,
            cursor: 'pointer',
            marginLeft: '12px',
          }}
        >
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ maxWidth: '600px', margin: '0 auto 24px auto' }}>
        <div style={{ height: '4px', background: theme.grid, borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${((currentSession + 1) / totalSessions) * 100}%`,
              background: `linear-gradient(90deg, ${sm2Color}, ${cmColor})`,
              transition: 'width 0.3s ease',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Split Screen Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* SM-2 Panel */}
        <div style={{ background: theme.card, borderRadius: '12px', padding: '20px', border: `2px solid ${sm2Color}30` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: sm2Color }}>SM-2</h2>
            <span style={{ fontSize: '12px', color: theme.muted, background: `${sm2Color}15`, padding: '4px 8px', borderRadius: '4px' }}>
              Trusts confidence blindly
            </span>
          </div>

          {/* K* and K̂ Chart */}
          <div style={{ marginBottom: '16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={sm2Data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                <XAxis dataKey="session" tick={{ fontSize: 10, fill: theme.muted }} domain={[1, 30]} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(v: number) => v.toFixed(1)} />
                <ReferenceLine y={0.9} stroke={theme.muted} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="K_star" stroke="#1e293b" strokeWidth={2} dot={false} name="K*" />
                <Line type="monotone" dataKey="K_hat" stroke={sm2Color} strokeWidth={2} dot={false} name="K̂" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div style={{ padding: '8px', background: `${sm2Color}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>K* (True)</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentSM2.K_star.toFixed(3)}</div>
            </div>
            <div style={{ padding: '8px', background: `${sm2Color}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>K̂ (Estimated)</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentSM2.K_hat.toFixed(3)}</div>
            </div>
            <div style={{ padding: '8px', background: `${sm2Color}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>ECE</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentSM2.ece.toFixed(3)}</div>
            </div>
            <div style={{ padding: '8px', background: `${sm2Color}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>β̂ (Bias)</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: currentSM2.beta_hat > 0.1 ? sm2Color : theme.text }}>
                {currentSM2.beta_hat > 0 ? '+' : ''}{currentSM2.beta_hat.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* CalibrateMe Panel */}
        <div style={{ background: theme.card, borderRadius: '12px', padding: '20px', border: `2px solid ${cmColor}30` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: cmColor }}>CalibrateMe</h2>
            <span style={{ fontSize: '12px', color: theme.muted, background: `${cmColor}15`, padding: '4px 8px', borderRadius: '4px' }}>
              Detects miscalibration
            </span>
          </div>

          {/* K* and K̂ Chart */}
          <div style={{ marginBottom: '16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={cmData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                <XAxis dataKey="session" tick={{ fontSize: 10, fill: theme.muted }} domain={[1, 30]} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(v: number) => v.toFixed(1)} />
                <ReferenceLine y={0.9} stroke={theme.muted} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="K_star" stroke="#1e293b" strokeWidth={2} dot={false} name="K*" />
                <Line type="monotone" dataKey="K_hat" stroke={cmColor} strokeWidth={2} dot={false} name="K̂" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div style={{ padding: '8px', background: `${cmColor}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>K* (True)</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentCM.K_star.toFixed(3)}</div>
            </div>
            <div style={{ padding: '8px', background: `${cmColor}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>K̂ (Estimated)</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentCM.K_hat.toFixed(3)}</div>
            </div>
            <div style={{ padding: '8px', background: `${cmColor}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>ECE</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentCM.ece.toFixed(3)}</div>
            </div>
            <div style={{ padding: '8px', background: `${cmColor}08`, borderRadius: '6px' }}>
              <div style={{ color: theme.muted, fontSize: '11px' }}>β̂ (Bias)</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: currentCM.beta_hat > 0.1 ? '#f59e0b' : cmColor }}>
                {currentCM.beta_hat > 0 ? '+' : ''}{currentCM.beta_hat.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Moment Callout */}
      {currentSession >= 10 && (
        <div
          style={{
            maxWidth: '600px',
            margin: '24px auto 0 auto',
            padding: '16px',
            background: `${cmColor}10`,
            border: `1px solid ${cmColor}30`,
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          {currentCM.K_star > currentSM2.K_star ? (
            <span>
              CalibrateMe K* is <strong style={{ color: cmColor }}>
                {((currentCM.K_star - currentSM2.K_star) * 100).toFixed(1)}%
              </strong> higher than SM-2 &mdash; calibration-aware scheduling matters.
            </span>
          ) : (
            <span>
              Both schedulers producing similar K* &mdash; CalibrateMe&apos;s ECE is{' '}
              <strong style={{ color: cmColor }}>{((currentSM2.ece - currentCM.ece) * 100).toFixed(1)}%</strong> lower.
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: theme.muted }}>
        CalibrateMe &mdash; Calibration-Aware Spaced Repetition &mdash; CS 6795 Spring 2026
      </div>
    </div>
  );
};

export default SplitScreenDemo;
