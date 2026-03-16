import confetti from 'canvas-confetti';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const celebrations = {
  sessionComplete: (accuracy: number) => {
    if (prefersReducedMotion()) return;

    if (accuracy === 1.0) {
      // Fireworks for 3 seconds
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b'];
      const frame = () => {
        if (Date.now() > end) return;
        confetti({
          particleCount: 3,
          angle: 60, spread: 55, startVelocity: 60,
          origin: { x: 0, y: 0.6 }, colors,
        });
        confetti({
          particleCount: 3,
          angle: 120, spread: 55, startVelocity: 60,
          origin: { x: 1, y: 0.6 }, colors,
        });
        requestAnimationFrame(frame);
      };
      frame();
    } else if (accuracy >= 0.8) {
      // Side cannons
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
    }
  },

  achievementUnlocked: () => {
    if (prefersReducedMotion()) return;
    const scalar = 2;
    const star = confetti.shapeFromText({ text: '⭐', scalar });
    confetti({
      shapes: [star], scalar, spread: 360,
      particleCount: 30, startVelocity: 20,
      gravity: 0.5, ticks: 60,
      origin: { x: 0.5, y: 0.4 },
    });
  },

  levelUp: () => {
    if (prefersReducedMotion()) return;
    const scalar = 2;
    const brain = confetti.shapeFromText({ text: '🧠', scalar });
    const grad = confetti.shapeFromText({ text: '🎓', scalar });
    confetti({
      shapes: [brain, grad], scalar, spread: 360,
      particleCount: 40, startVelocity: 25,
      gravity: 0.4, ticks: 80,
      origin: { x: 0.5, y: 0.3 },
    });
  },

  wellCalibrated: () => {
    if (prefersReducedMotion()) return;
    confetti({
      particleCount: 20, spread: 60,
      startVelocity: 15, gravity: 0.8,
      colors: ['#22c55e', '#10b981', '#6ee7b7'],
      origin: { x: 0.5, y: 0.5 },
    });
  },

  perfectCalibrationGame: () => {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 50, spread: 360,
          startVelocity: 30,
          origin: { x: Math.random(), y: Math.random() * 0.5 },
          colors: ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'],
        });
      }, i * 300);
    }
  },

  streakMilestone: () => {
    if (prefersReducedMotion()) return;
    confetti({
      particleCount: 80, spread: 360,
      startVelocity: 25,
      colors: ['#f59e0b', '#d97706', '#fbbf24'],
      origin: { x: 0.5, y: 0.4 },
    });
  },
};
