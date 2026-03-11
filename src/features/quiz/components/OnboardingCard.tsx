import { Target, Brain, Sliders, ArrowRight } from 'lucide-react';

const ONBOARDING_KEY = 'calibrateme_onboarded';

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function markOnboarded(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

interface OnboardingCardProps {
  onDismiss: () => void;
}

export default function OnboardingCard({ onDismiss }: OnboardingCardProps) {
  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto 24px' }}>
      <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Target size={22} />
        Welcome to CalibrateMe
      </h2>

      <p style={{ marginBottom: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        CalibrateMe helps you become a better learner by improving your <strong>metacognitive calibration</strong> --
        the match between how confident you feel and how well you actually know something.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Brain size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
          <div>
            <strong>Practice vocabulary & grammar</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Answer questions and self-grade your responses.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Sliders size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
          <div>
            <strong>Rate your confidence</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Before seeing the answer, slide to indicate how sure you are (0-100%).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Target size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
          <div>
            <strong>Track your calibration</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The system measures your ECE (Expected Calibration Error). A well-calibrated learner who says "80% confident" is correct about 80% of the time.
            </p>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={() => {
          markOnboarded();
          onDismiss();
        }}
      >
        Get Started
        <ArrowRight size={16} style={{ marginLeft: 8 }} />
      </button>
    </div>
  );
}
