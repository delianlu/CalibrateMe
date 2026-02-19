import { useEffect, useRef, useCallback } from 'react';

// =============================================================================
// ConfettiEffect - Canvas-based particle celebration animation
// =============================================================================

interface ConfettiEffectProps {
  active: boolean;
  variant: 'level-up' | 'achievement';
  onComplete?: () => void;
}

// ── Color Palettes ──────────────────────────────────────────────────────

const COLOR_PALETTES: Record<ConfettiEffectProps['variant'], string[]> = {
  'level-up': ['#FFD700', '#FFA500', '#FF8C00', '#FFEC8B', '#FFE4B5'],
  achievement: ['#38a169', '#4299e1', '#48BB78', '#63B3ED', '#68D391'],
};

const PARTICLE_COUNTS: Record<ConfettiEffectProps['variant'], [number, number]> = {
  'level-up': [80, 120],
  achievement: [40, 60],
};

// ── Particle Definition ─────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  color: string;
  shape: 'rect' | 'circle';
}

// ── Helpers ─────────────────────────────────────────────────────────────

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createParticles(
  variant: ConfettiEffectProps['variant'],
  canvasWidth: number,
): Particle[] {
  const palette = COLOR_PALETTES[variant];
  const [minCount, maxCount] = PARTICLE_COUNTS[variant];
  const count = Math.floor(randomInRange(minCount, maxCount));
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: randomInRange(0, canvasWidth),
      y: randomInRange(-20, -100),
      vx: randomInRange(-4, 4),
      vy: randomInRange(-12, -6),
      rotation: randomInRange(0, Math.PI * 2),
      rotationSpeed: randomInRange(-0.15, 0.15),
      size: randomInRange(3, 8),
      opacity: 1,
      color: randomFromArray(palette),
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  return particles;
}

// ── Constants ───────────────────────────────────────────────────────────

const GRAVITY = 0.25;
const DRAG = 0.99;
const DURATION_MS = 3000;
const FADE_START_MS = 2000;

// ── Component ───────────────────────────────────────────────────────────

export default function ConfettiEffect({ active, variant, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);

  // Keep the callback ref up to date without triggering effect re-runs
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size the canvas to the viewport
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    particlesRef.current = createParticles(variant, canvas.width);
    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = now - startTimeRef.current;

      // End the animation after DURATION_MS
      if (elapsed >= DURATION_MS) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        onCompleteRef.current?.();
        return;
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics update
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out during the last portion of the animation
        if (elapsed > FADE_START_MS) {
          const fadeProgress = (elapsed - FADE_START_MS) / (DURATION_MS - FADE_START_MS);
          p.opacity = Math.max(0, 1 - fadeProgress);
        }

        // Draw particle
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);

      // Clear canvas on cleanup
      const cleanupCtx = canvas.getContext('2d');
      if (cleanupCtx) {
        cleanupCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, variant, resizeCanvas]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1001,
      }}
    />
  );
}
