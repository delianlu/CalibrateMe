# CalibrateMe

**Metacognitive Calibration-Aware Adaptive Learning System**

CS 6795 — Cognitive Science | Georgia Tech | Spring 2026

---

## Overview

CalibrateMe is a web-based adaptive learning system that measures and improves **metacognitive calibration** — the alignment between a learner's confidence and their actual knowledge. Unlike traditional spaced repetition systems (e.g., SM-2), CalibrateMe uses confidence ratings alongside correctness to detect miscalibration and adapt scheduling accordingly.

Key innovations:
- **Calibration-aware scheduling** — adjusts review intervals based on the gap between confidence and accuracy (β̂ estimation)
- **Dual-process classification** — classifies responses as automatic (Type 1) or deliberate (Type 2) using response time z-scores
- **Adaptive scaffolding** — delivers reflection prompts to overconfident learners and encouragement to underconfident ones
- **BKT belief update** — Bayesian Knowledge Tracing with grid-based posterior incorporating correctness, confidence, and response time

## Features

| Feature | Description |
|---------|-------------|
| **Practice** | Vocabulary flashcards (200+ items) and OffGrid grammar exercises (329 items) with confidence rating |
| **Analytics** | Live calibration curve, ECE meter, confidence histogram, session history, learner classification (8 archetypes) |
| **Simulation Lab** | Monte Carlo simulations across 9 learner profiles (3 ability × 3 calibration) and 4 schedulers |
| **Advanced Analytics** | Multi-seed ablation studies, sensitivity analysis, δ dose-response, with 95% CIs and Cohen's d |
| **Gamification** | XP, levels, streaks, achievements, calibration bonuses |
| **Mini-Game** | 10-question calibration trivia game |
| **Dark Mode** | Full dark theme support |
| **Chart Export** | PNG/SVG export for all visualizations |
| **Demo Mode** | Guided 10-step walkthrough (press `d` to toggle) |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
npm install
npm run dev          # Development server at http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
```

### Tests

```bash
npm test             # Run all 162 tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Generate Analysis Data

```bash
npx tsx scripts/runAllAnalyses.ts     # Run 5,160 simulations → results/*.csv
npx tsx scripts/generateLatexTables.ts # Generate LaTeX tables → results/latex/*.tex
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full module breakdown.

### Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite 5** — Build tool
- **Zustand** — State management
- **Recharts** — Data visualization
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **Jest** + **ts-jest** — Testing

### Directory Structure

```
src/
├── bkt/             # Bayesian Knowledge Tracing belief update
├── calibration/     # ECE, Brier score, calibration metrics
├── memory/          # Exponential forgetting model
├── dualProcess/     # Type 1/Type 2 response classification
├── scheduler/       # Calibration-aware scheduler
├── scaffolding/     # Adaptive scaffolding engine
├── baselines/       # SM-2, BKT-only, decay-based baselines
├── profiles/        # 9 core + 6 extended learner profiles
├── simulation/      # Simulation engine, ablation, sensitivity, δ sweep
├── store/           # Zustand stores
├── workers/         # Web Worker for non-blocking simulation
├── components/      # Shared UI components
├── features/        # Feature modules (quiz, analytics, gamification, etc.)
├── utils/           # Statistics, export utilities
├── data/            # Vocabulary packs, grammar exercises
└── types/           # TypeScript type definitions
```

## Hypothesis Testing

CalibrateMe evaluates three hypotheses via multi-seed Monte Carlo simulation:

| Hypothesis | Claim | Metric |
|------------|-------|--------|
| **H1** | Overconfident learners show the largest retention improvement under CalibrateMe | 7-day retention vs SM-2 |
| **H2** | Underconfident learners show moderate improvement | 7-day retention vs SM-2 |
| **H3** | Well-calibrated learners show minimal difference (validating calibration as key variable) | 7-day retention vs SM-2 |

Ablation conditions: Full CalibrateMe, No Dual-Process, No Scaffolding, Calibration Only, SM-2 Baseline, BKT-Only.

## Generated Results

After running `scripts/runAllAnalyses.ts`:

```
results/
├── ablation_core_profiles.csv
├── ablation_extended_profiles.csv
├── sensitivity_lambda.csv
├── sensitivity_slip.csv
├── sensitivity_guess.csv
├── sensitivity_noise.csv
├── sensitivity_beta.csv
├── delta_sweep.csv
├── summary.json
└── latex/
    ├── table_ablation.tex
    ├── table_sensitivity.tex
    ├── table_delta.tex
    └── table_extended.tex
```

## License

This project is for academic use as part of Georgia Tech's CS 6795 course.
