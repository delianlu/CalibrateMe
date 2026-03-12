# CalibrateMe — Architecture

## System Overview

CalibrateMe is a single-page React application implementing a metacognitive calibration-aware adaptive learning system. The architecture separates **cognitive science engine modules** (pure TypeScript, no React dependencies) from **UI components** (React + Recharts).

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                        │
│  App.tsx → Feature modules → Shared components           │
├─────────────────────────────────────────────────────────┤
│                  State Management                        │
│  Zustand stores (simulationStore, advancedAnalyticsStore)│
├─────────────────────────────────────────────────────────┤
│              Cognitive Science Engines                    │
│  BKT · Calibration · Memory · DualProcess · Scheduler    │
├─────────────────────────────────────────────────────────┤
│                Simulation Layer                           │
│  SimulationEngine · AblationRunner · SensitivityAnalysis │
│  DeltaSweep · ResponseGenerator · StatisticalAnalysis    │
├─────────────────────────────────────────────────────────┤
│                 Web Worker                                │
│  simulationWorker.ts (non-blocking simulation)           │
└─────────────────────────────────────────────────────────┘
```

## Core Engine Modules

### BKT Belief Update (`src/bkt/beliefUpdateEngine.ts`)
Grid-based Bayesian posterior over knowledge state K̂. Incorporates three evidence channels with configurable weights:
- **Correctness** (w_y = 1.0) — standard BKT update
- **Confidence** (w_c = 0.5) — confidence-weighted likelihood
- **Response time** (w_τ = 0.3) — speed as evidence of automaticity

### Calibration Scoring (`src/calibration/scoringModule.ts`)
- **ECE** (Expected Calibration Error) — mean absolute gap across confidence bins
- **Brier Score** — squared difference between confidence and outcome
- **MCE** (Maximum Calibration Error) — worst-bin gap
- **β̂ estimation** — signed calibration bias (positive = overconfident)

### Forgetting Model (`src/memory/forgettingModel.ts`)
Exponential decay: K*_t' = K*_t · e^{-λ·Δt}

Learning update increases K* based on learning rate α and current knowledge level.

### Dual-Process Classifier (`src/dualProcess/classifier.ts`)
Classifies responses as Type 1 (automatic, fast) or Type 2 (deliberate, slow) using z-score normalized response times per difficulty bucket. Threshold at z = 0.

### Calibration-Aware Scheduler (`src/scheduler/calibrationAwareScheduler.ts`)
Base interval computed from BKT posterior, then adjusted:
1. **Calibration adjustment**: multiply by e^{-2·β̂} (overconfident → shorter intervals)
2. **Dual-process adjustment**: Type 1 responses get slightly longer intervals (automaticity bonus)
3. **Coverage-aware selection**: prioritize items not recently reviewed

### Adaptive Scaffolding (`src/scaffolding/adaptiveScaffolding.ts`)
- **Overconfident** (β̂ > threshold): reflection prompts, δ-decay of bias
- **Underconfident** (β̂ < -threshold): encouragement prompts, confidence boosting
- **Streak-triggered**: consecutive errors or correct answers trigger targeted scaffolds

### Baselines (`src/baselines/`)
- **SM-2** (`sm2.ts`) — SuperMemo 2 algorithm
- **BKT-Only** (`bktOnly.ts`) — Bayesian Knowledge Tracing without calibration
- **Decay-Based** (`decayBased.ts`) — pure exponential decay scheduling

## Simulation Layer

### Simulation Engine (`src/simulation/simulationEngine.ts`)
Orchestrates full experiment: creates learner profile → runs N sessions → generates responses → updates state → records trajectories. Supports configurable scheduler type, scaffolding, dual-process, and difficulty sequencing.

### Response Generator (`src/simulation/responseGenerator.ts`)
Generates synthetic learner responses:
- **Correctness**: P(correct) = K* · (1 - slip) + (1 - K*) · guess
- **Confidence**: K* + β* + N(0, σ²), clamped to [0, 1]
- **Response time**: τ_base · (1 + γ · (1 - K*)) + noise

### Statistical Analysis (`src/simulation/statisticalAnalysis.ts`)
- `computeStats()` — mean, SD, 95% CI (t-distribution)
- `computeEffectSize()` — Cohen's d with pooled SD, interpretation thresholds
- `formatStats()` — formatted string output

### Ablation Runner (`src/simulation/ablationRunner.ts`)
Runs all profiles × 6 conditions × N seeds. Computes per-condition statistics and effect sizes vs SM-2 baseline. Exports long-format CSV.

### Sensitivity Analysis (`src/simulation/sensitivityAnalysis.ts`)
Sweeps a single parameter (λ, β*, slip, guess, noise) across a range. Computes retention advantage of CalibrateMe over SM-2 at each value. 5 default sweeps defined in `DEFAULT_SWEEPS`.

### Delta Sweep (`src/simulation/deltaSweep.ts`)
Varies scaffolding rate δ from 0 to 0.35. Measures retention, ECE, time-to-mastery, and scaffold count across all profiles. 8 default delta values.

## Learner Profiles (`src/profiles/learnerProfiles.ts`)

### Core Profiles (3 × 3 = 9)
| | Low Ability | Medium Ability | High Ability |
|---|---|---|---|
| **Overconfident** | Low-Over | Med-Over | High-Over |
| **Underconfident** | Low-Under | Med-Under | High-Under |
| **Well-Calibrated** | Low-Well | Med-Well | High-Well |

### Extended Profiles (6)
Boundary cases: Near-Zero, Near-Ceiling, Extreme-Over, Extreme-Under, Fast-Forgetter, Slow-Learner.

## State Management

### `simulationStore` (Zustand)
Manages single simulation, comparison, and hypothesis test state. Actions: `runSimulation`, `runComparison`, `runHypothesisTests`, `reset`.

### `advancedAnalyticsStore` (Zustand)
Manages ablation, sensitivity, and δ sweep state. Delegates to Web Worker when available, falls back to main-thread setTimeout in Node.js/test environments. Actions: `runAblation`, `runSensitivity`, `runDeltaSweep`, `cancel`, `reset`.

## Web Worker (`src/workers/`)

### `simulationWorker.ts`
Handles three message types: `ablation`, `sensitivity`, `deltaSweep`. Throttles progress messages to 50ms intervals. Posts typed `WorkerResponse` messages back.

### `useSimulationWorker.ts`
React hook wrapping the worker. Provides `runAblation`, `runSensitivity`, `runDeltaSweep`, `cancel`. Cleans up worker on unmount.

## UI Architecture

### App Shell (`src/App.tsx`)
Sidebar + bottom nav layout with 6 tabs: Practice, Vocabulary, Analytics, Profile, Cal Game, Sim Lab. Framer Motion page transitions. Dark mode via `[data-theme="dark"]` CSS custom properties.

### Feature Modules (`src/features/`)
Each feature is self-contained with its own components, hooks, services, and types:
- **quiz** — Flashcard, ConfidenceSlider, GrammarExercise, SessionSummary
- **analytics** — CalibrationDashboard, LiveCalibrationCurve, ECEMeter, SessionHistory, LearnerClassification
- **simulation** — AblationTable, SensitivityHeatmap, DoseResponseChart, MasteryComparison
- **gamification** — XPBar, StreakDisplay, AchievementList, ConfettiEffect
- **vocabulary** — VocabularyList, VocabularyCard, Import/Export
- **user** — ProfileCard, useUserProfile hook, IndexedDB storage
- **scaffolding** — ScaffoldPromptCard
- **minigame** — MiniGameContainer

### Shared Components (`src/components/`)
Dashboard, CalibrationChart, CalibrationCurve, ComparisonView, HypothesisResults, MetricsDisplay, ProgressBar, ExportableChart, DemoOverlay, ErrorBoundary.

### Code Splitting
Heavy simulation components are lazy-loaded via `React.lazy`:
- FinalReport, AblationTable, SensitivityHeatmap, DoseResponseChart, MasteryComparison

## Testing

14 test suites, 162 tests total. All engine modules have dedicated test files in `tests/`. Tests use Jest with ts-jest. Key test categories:
- Statistical analysis (CIs, effect sizes, edge cases)
- Ablation runner (conditions, metrics, CSV export)
- Sensitivity analysis (sweeps, retention advantage)
- Delta sweep (scaffolding counts, valid ranges)
- Longitudinal analysis (trends, phases, velocity)
- Pattern analysis (confidence bins, dual-process)
- Learner insights (archetypes, recommendations)
- Core engines (BKT, forgetting, dual-process, scheduler, scoring, simulation)

## Data Pipeline

```
scripts/runAllAnalyses.ts
  → 5,160 simulations (ablation + sensitivity + δ sweep)
  → results/*.csv + results/summary.json

scripts/generateLatexTables.ts
  → results/latex/*.tex (booktabs-style IEEE tables)
```
