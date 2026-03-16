// =============================================================================
// DemoOverlay — Guided walkthrough for 5-minute video presentation
// Press 'd' to toggle, arrow keys or click to navigate steps
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

export interface DemoStep {
  title: string;
  description: string;
  tab?: string;
  duration?: string;
  notes?: string;
}

const DEMO_SCRIPT: DemoStep[] = [
  {
    title: 'Welcome to CalibrateMe',
    description:
      'A metacognitive calibration-aware adaptive learning system for CS 6795 Cognitive Science at Georgia Tech.',
    tab: 'quiz',
    duration: '0:00 – 0:30',
    notes: 'Introduce the project: "CalibrateMe helps learners become aware of what they know and don\'t know."',
  },
  {
    title: 'Practice Session — Vocabulary Flashcard',
    description:
      'The learner sees a flashcard, self-grades correctness, then rates their confidence on a 0–100 slider. ' +
      'This confidence rating is the key input to our calibration engine.',
    tab: 'quiz',
    duration: '0:30 – 1:15',
    notes: 'Do 2–3 flashcard items. Point out the confidence slider and explain why metacognitive accuracy matters.',
  },
  {
    title: 'Practice Session — Grammar Exercise',
    description:
      'OffGrid grammar exercises also collect confidence ratings. The dual-process classifier determines ' +
      'whether each response is automatic (Type 1) or deliberate (Type 2) based on response time.',
    tab: 'quiz',
    duration: '1:15 – 1:45',
    notes: 'Answer one grammar question. Mention the dual-process model (Kahneman System 1/2).',
  },
  {
    title: 'Analytics Dashboard',
    description:
      'The calibration curve plots reported confidence vs. actual accuracy. Points above the diagonal indicate ' +
      'underconfidence; below indicates overconfidence. ECE (Expected Calibration Error) quantifies miscalibration.',
    tab: 'analytics',
    duration: '1:45 – 2:30',
    notes: 'Show the live calibration curve, ECE meter, confidence histogram, and session history trend.',
  },
  {
    title: 'Learner Classification',
    description:
      'Based on calibration patterns, the system classifies the learner into one of 8 archetypes ' +
      '(e.g., Confident Expert, Cautious Learner, Dunning-Kruger pattern). This drives adaptive scaffolding.',
    tab: 'analytics',
    duration: '2:30 – 3:00',
    notes: 'Scroll down to show the learner classification card with archetype and recommendations.',
  },
  {
    title: 'Simulation Lab — Single Run',
    description:
      'The Sim Lab runs Monte Carlo simulations of the full learning engine. Select a learner profile ' +
      '(3 ability × 3 calibration = 9 profiles) and see knowledge trajectories, ECE convergence, and retention.',
    tab: 'simulation',
    duration: '3:00 – 3:30',
    notes: 'Run a single simulation with "Med-Over" profile. Point out K* vs K̂ convergence.',
  },
  {
    title: 'Simulation Lab — Scheduler Comparison',
    description:
      'Compare CalibrateMe against SM-2, BKT-only, and decay-based baselines. Bar charts show retention rates, ' +
      'time to mastery, and calibration error across schedulers.',
    tab: 'simulation',
    duration: '3:30 – 4:00',
    notes: 'Click "Compare All Schedulers". Highlight CalibrateMe\'s advantage for miscalibrated learners.',
  },
  {
    title: 'Advanced Analytics — Ablation Study',
    description:
      'Multi-seed ablation with 30 seeds per condition, 95% CIs, and Cohen\'s d effect sizes. ' +
      'Tests H1 (overconfident benefit most), H2 (underconfident benefit moderately), H3 (well-calibrated ≈ baseline).',
    tab: 'simulation',
    duration: '4:00 – 4:30',
    notes: 'Show the Advanced Analytics view. Point to ablation table with CIs and effect size badges.',
  },
  {
    title: 'Dose-Response & Sensitivity',
    description:
      'The δ dose-response chart shows how scaffolding intensity affects outcomes. ' +
      'Sensitivity heatmap reveals which parameters the system is robust or sensitive to.',
    tab: 'simulation',
    duration: '4:30 – 4:50',
    notes: 'Show dose-response chart and sensitivity heatmap. Emphasize robustness across parameter ranges.',
  },
  {
    title: 'Conclusion',
    description:
      'CalibrateMe demonstrates that calibration-aware scheduling improves retention for miscalibrated learners ' +
      'while maintaining performance for well-calibrated ones. All results reproducible via multi-seed simulations.',
    tab: 'simulation',
    duration: '4:50 – 5:00',
    notes: 'Summarize key findings. Mention the exportable charts (PNG/SVG) and generated LaTeX tables for the IEEE paper.',
  },
];

interface DemoOverlayProps {
  onNavigate?: (tab: string) => void;
}

const DemoOverlay: React.FC<DemoOverlayProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  const current = DEMO_SCRIPT[step];
  const total = DEMO_SCRIPT.length;

  // Navigate to the correct tab whenever step or visibility changes
  useEffect(() => {
    if (visible && current.tab && onNavigate) {
      onNavigate(current.tab);
    }
  }, [visible, step, current, onNavigate]);

  const next = useCallback(() => {
    setStep(s => Math.min(s + 1, total - 1));
  }, [total]);

  const prev = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const toggle = useCallback(() => {
    setVisible(v => !v);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only toggle if not typing in an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        toggle();
      }
      if (!visible) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, next, prev, toggle]);

  if (!visible) {
    return (
      <button
        className="demo-toggle-btn"
        onClick={toggle}
        aria-label="Start demo walkthrough"
        title="Press 'd' to toggle demo mode"
      >
        <Play size={16} />
      </button>
    );
  }

  return (
    <div className="demo-overlay" role="dialog" aria-label="Demo walkthrough" aria-modal="false">
      <div className="demo-overlay__card">
        <div className="demo-overlay__header">
          <span className="demo-overlay__step-badge">
            {step + 1} / {total}
          </span>
          <span className="demo-overlay__duration">{current.duration}</span>
          <button
            className="demo-overlay__close"
            onClick={() => setVisible(false)}
            aria-label="Close demo overlay"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="demo-overlay__title">{current.title}</h3>
        <p className="demo-overlay__description">{current.description}</p>

        {current.notes && (
          <div className="demo-overlay__notes">
            <strong>Speaker notes:</strong> {current.notes}
          </div>
        )}

        <div className="demo-overlay__nav">
          <button
            className="btn btn-secondary btn-sm"
            onClick={prev}
            disabled={step === 0}
            aria-label="Previous step"
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <div className="demo-overlay__progress">
            {DEMO_SCRIPT.map((_, i) => (
              <span
                key={i}
                className={`demo-overlay__dot ${i === step ? 'demo-overlay__dot--active' : ''} ${i < step ? 'demo-overlay__dot--done' : ''}`}
              />
            ))}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={next}
            disabled={step === total - 1}
            aria-label="Next step"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoOverlay;
