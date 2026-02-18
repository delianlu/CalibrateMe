# CalibrateMe: Complete Starter Codebase
## React + TypeScript Implementation

This file contains all source code for the CalibrateMe project. Copy each section into the corresponding file in your project.

---

# Table of Contents

1. [Project Setup](#1-project-setup)
2. [Type Definitions](#2-type-definitions)
3. [Core Modules](#3-core-modules)
4. [Baselines](#4-baselines)
5. [Simulation Engine](#5-simulation-engine)
6. [React Components](#6-react-components)
7. [Tests](#7-tests)
8. [Utilities](#8-utilities)

---

# 1. Project Setup

## 1.1 package.json

```json
{
  "name": "calibrateme",
  "version": "1.0.0",
  "description": "Calibration-aware adaptive learning system",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## 1.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 1.3 tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## 1.4 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## 1.5 jest.config.js

```javascript
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
};

module.exports = config;
```

## 1.6 index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CalibrateMe</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        background-color: #f5f5f5;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 1.7 src/main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## 1.8 Folder Structure

```
calibrateme/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── jest.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── types/
│   │   └── index.ts
│   ├── simulation/
│   │   ├── responseGenerator.ts
│   │   └── simulationEngine.ts
│   ├── calibration/
│   │   └── scoringModule.ts
│   ├── bkt/
│   │   └── beliefUpdateEngine.ts
│   ├── memory/
│   │   └── forgettingModel.ts
│   ├── dualProcess/
│   │   └── classifier.ts
│   ├── scheduler/
│   │   └── calibrationAwareScheduler.ts
│   ├── scaffolding/
│   │   └── adaptiveScaffolding.ts
│   ├── profiles/
│   │   └── learnerProfiles.ts
│   ├── baselines/
│   │   ├── sm2.ts
│   │   ├── bktOnly.ts
│   │   └── decayBased.ts
│   ├── store/
│   │   └── simulationStore.ts
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── CalibrationChart.tsx
│   │   ├── LearnerProfileSelector.tsx
│   │   ├── SimulationControls.tsx
│   │   ├── MetricsDisplay.tsx
│   │   └── ResponseHistory.tsx
│   └── utils/
│       ├── random.ts
│       └── statistics.ts
└── tests/
    ├── responseGenerator.test.ts
    ├── scoringModule.test.ts
    ├── beliefUpdateEngine.test.ts
    └── forgettingModel.test.ts
```

---

# 2. Type Definitions

## 2.1 src/types/index.ts

```typescript
// =============================================================================
// CalibrateMe Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export enum AbilityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CalibrationType {
  OVERCONFIDENT = 'OVERCONFIDENT',
  UNDERCONFIDENT = 'UNDERCONFIDENT',
  WELL_CALIBRATED = 'WELL_CALIBRATED',
}

export enum ResponseType {
  TYPE1_AUTOMATIC = 'TYPE1_AUTOMATIC',
  TYPE2_DELIBERATE = 'TYPE2_DELIBERATE',
}

export enum ScaffoldType {
  REFLECTION = 'REFLECTION',           // For overconfident learners
  ENCOURAGEMENT = 'ENCOURAGEMENT',     // For underconfident learners
  NONE = 'NONE',
}

export enum SchedulerType {
  CALIBRATEME = 'CALIBRATEME',
  SM2 = 'SM2',
  BKT_ONLY = 'BKT_ONLY',
  DECAY_BASED = 'DECAY_BASED',
}

// -----------------------------------------------------------------------------
// Core Interfaces
// -----------------------------------------------------------------------------

/**
 * True (hidden) state of the learner - generates observable behavior
 * The system cannot directly access this; it must infer from responses
 */
export interface TrueLearnerState {
  K_star: number;           // True knowledge level [0, 1]
  beta_star: number;        // True calibration bias [-0.3, +0.3]
  alpha: number;            // Learning rate on correct responses [0.1, 0.3]
  alpha_err: number;        // Learning rate on errors (typically 0.5 * alpha)
  lambda: number;           // Forgetting rate [0.05, 0.15]
}

/**
 * System's belief about the learner - updated via BKT from observations
 */
export interface SystemBelief {
  K_hat: number;            // Estimated knowledge level [0, 1]
  beta_hat: number;         // Estimated calibration bias
  confidence_interval: number; // Uncertainty in estimate
  last_updated: Date;
}

/**
 * Item being learned (e.g., a vocabulary word, flashcard)
 */
export interface Item {
  id: string;
  difficulty: number;       // Item difficulty [0, 1]
  true_state: ItemTrueState;
  system_belief: ItemSystemBelief;
  review_history: ReviewRecord[];
}

export interface ItemTrueState {
  K_star: number;           // True knowledge for this specific item
  last_review: Date | null;
}

export interface ItemSystemBelief {
  K_hat: number;
  beta_hat: number;
  next_review: Date;
  interval_days: number;
  ease_factor: number;      // For SM-2 compatibility
}

/**
 * A single response from the learner
 */
export interface Response {
  item_id: string;
  correctness: boolean;     // y: correct (true) or incorrect (false)
  confidence: number;       // c: reported confidence [0, 1]
  response_time: number;    // τ: response time in seconds
  timestamp: Date;
}

/**
 * Processed response with additional computed fields
 */
export interface ProcessedResponse extends Response {
  response_type: ResponseType;
  normalized_rt: number;
  dual_process_score: number;
  brier_score: number;
}

/**
 * Record of a single review session
 */
export interface ReviewRecord {
  response: ProcessedResponse;
  K_star_before: number;
  K_star_after: number;
  K_hat_before: number;
  K_hat_after: number;
  interval_assigned: number;
  scaffold_delivered: ScaffoldType;
}

// -----------------------------------------------------------------------------
// Learner Profile
// -----------------------------------------------------------------------------

export interface LearnerProfileParams {
  ability: AbilityLevel;
  calibration: CalibrationType;
  alpha: number;
  lambda: number;
  beta_star: number;
}

export interface LearnerProfile {
  id: string;
  name: string;
  params: LearnerProfileParams;
  true_state: TrueLearnerState;
  system_belief: SystemBelief;
  items: Item[];
  response_history: ProcessedResponse[];
  session_count: number;
}

// -----------------------------------------------------------------------------
// Calibration Metrics
// -----------------------------------------------------------------------------

export interface CalibrationMetrics {
  brier_score: number;      // Mean squared error of confidence
  ece: number;              // Expected Calibration Error
  mce: number;              // Maximum Calibration Error
  calibration_direction: CalibrationType;
  bin_data: CalibrationBin[];
}

export interface CalibrationBin {
  bin_start: number;
  bin_end: number;
  mean_confidence: number;
  mean_accuracy: number;
  count: number;
  calibration_gap: number;  // accuracy - confidence
}

// -----------------------------------------------------------------------------
// Simulation Configuration
// -----------------------------------------------------------------------------

export interface SimulationConfig {
  num_items: number;
  num_sessions: number;
  items_per_session: number;
  scheduler_type: SchedulerType;
  enable_scaffolding: boolean;
  enable_dual_process: boolean;
  random_seed: number | null;
  
  // Model parameters
  slip_probability: number;       // s = 0.1
  guess_probability: number;      // g = 0.2
  confidence_noise_std: number;   // σ_c = 0.1
  rt_noise_std: number;           // σ_τ = 0.5
  rt_base: number;                // Base response time in seconds
  rt_gamma: number;               // Knowledge-RT relationship strength
  scaffolding_delta: number;      // δ ∈ [0.02, 0.05]
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  num_items: 100,
  num_sessions: 30,
  items_per_session: 20,
  scheduler_type: SchedulerType.CALIBRATEME,
  enable_scaffolding: true,
  enable_dual_process: true,
  random_seed: null,
  slip_probability: 0.1,
  guess_probability: 0.2,
  confidence_noise_std: 0.1,
  rt_noise_std: 0.5,
  rt_base: 3.0,
  rt_gamma: 2.0,
  scaffolding_delta: 0.03,
};

// -----------------------------------------------------------------------------
// Simulation Results
// -----------------------------------------------------------------------------

export interface SimulationResults {
  profile_id: string;
  scheduler_type: SchedulerType;
  config: SimulationConfig;
  
  // Primary metrics
  retention_1day: number;
  retention_7day: number;
  retention_30day: number;
  time_to_mastery: number;      // Sessions until K* > 0.9 sustained
  review_efficiency: number;    // Reviews per mastered item
  total_review_time: number;    // Cost proxy
  
  // Calibration trajectory
  ece_trajectory: number[];
  brier_trajectory: number[];
  
  // Knowledge trajectory
  K_star_trajectory: number[];
  K_hat_trajectory: number[];
  
  // Per-session data
  session_data: SessionData[];
}

export interface SessionData {
  session_number: number;
  items_reviewed: number;
  correct_count: number;
  mean_confidence: number;
  mean_rt: number;
  type1_count: number;
  type2_count: number;
  scaffolds_delivered: number;
  mean_K_star: number;
  mean_K_hat: number;
  ece: number;
  brier: number;
}

// -----------------------------------------------------------------------------
// Experiment Configuration
// -----------------------------------------------------------------------------

export interface ExperimentConfig {
  profiles: LearnerProfile[];
  conditions: SchedulerType[];
  simulation_config: SimulationConfig;
  num_replications: number;
}

export interface ExperimentResults {
  config: ExperimentConfig;
  results: Map<string, Map<SchedulerType, SimulationResults[]>>;
  summary: ExperimentSummary;
}

export interface ExperimentSummary {
  by_profile: Map<string, ProfileSummary>;
  by_scheduler: Map<SchedulerType, SchedulerSummary>;
  hypothesis_tests: HypothesisTestResults;
}

export interface ProfileSummary {
  profile_id: string;
  mean_retention_1day: Map<SchedulerType, number>;
  mean_retention_7day: Map<SchedulerType, number>;
  mean_retention_30day: Map<SchedulerType, number>;
  mean_time_to_mastery: Map<SchedulerType, number>;
  improvement_vs_sm2: number;
}

export interface SchedulerSummary {
  scheduler_type: SchedulerType;
  mean_retention_1day: number;
  mean_retention_7day: number;
  mean_retention_30day: number;
  mean_time_to_mastery: number;
}

export interface HypothesisTestResults {
  h1_overconfident_largest_improvement: boolean;
  h2_underconfident_moderate_improvement: boolean;
  h3_wellcalibrated_minimal_difference: boolean;
  effect_sizes: Map<string, number>;
  p_values: Map<string, number>;
}
```

---

# 3. Core Modules

## 3.1 src/utils/random.ts

```typescript
// =============================================================================
// Random Number Generation Utilities
// =============================================================================

/**
 * Seeded random number generator for reproducibility
 * Uses a simple linear congruential generator
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }
  
  /**
   * Generate a random number in [0, 1)
   */
  random(): number {
    // LCG parameters (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  /**
   * Generate a random number in [min, max)
   */
  randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }
  
  /**
   * Generate a random integer in [min, max]
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }
  
  /**
   * Generate a random number from standard normal distribution
   * Using Box-Muller transform
   */
  randomNormal(mean: number = 0, std: number = 1): number {
    const u1 = this.random();
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }
  
  /**
   * Generate a random boolean with given probability
   */
  randomBoolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }
  
  /**
   * Shuffle an array in place
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Reset the seed
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }
}

// Global random instance (can be seeded for reproducibility)
export const globalRandom = new SeededRandom();

/**
 * Clip a value to [min, max]
 */
export function clip(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

## 3.2 src/utils/statistics.ts

```typescript
// =============================================================================
// Statistical Utilities
// =============================================================================

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate variance of an array
 */
export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

/**
 * Calculate standard deviation of an array
 */
export function std(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Online mean and variance calculator (Welford's algorithm)
 */
export class OnlineStatistics {
  private n: number = 0;
  private mean_: number = 0;
  private M2: number = 0;
  
  update(value: number): void {
    this.n++;
    const delta = value - this.mean_;
    this.mean_ += delta / this.n;
    const delta2 = value - this.mean_;
    this.M2 += delta * delta2;
  }
  
  get count(): number {
    return this.n;
  }
  
  get mean(): number {
    return this.mean_;
  }
  
  get variance(): number {
    return this.n < 2 ? 0 : this.M2 / (this.n - 1);
  }
  
  get std(): number {
    return Math.sqrt(this.variance);
  }
  
  reset(): void {
    this.n = 0;
    this.mean_ = 0;
    this.M2 = 0;
  }
}

/**
 * Calculate z-score
 */
export function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}

/**
 * Calculate Cohen's d effect size
 */
export function cohensD(group1: number[], group2: number[]): number {
  const m1 = mean(group1);
  const m2 = mean(group2);
  const s1 = std(group1);
  const s2 = std(group2);
  const n1 = group1.length;
  const n2 = group2.length;
  
  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / (n1 + n2 - 2)
  );
  
  return pooledStd === 0 ? 0 : (m1 - m2) / pooledStd;
}
```

## 3.3 src/simulation/responseGenerator.ts

```typescript
// =============================================================================
// Response Generator Module
// Implements Equations 4, 5, 6 from the project pitch
// =============================================================================

import { Response, TrueLearnerState, Item, SimulationConfig } from '../types';
import { SeededRandom, clip } from '../utils/random';

/**
 * Generate correctness based on slip-guess model (Equation 4)
 * P(y=1|K*) = (1-s) × K* + g × (1-K*)
 * 
 * @param K_star - True knowledge level [0, 1]
 * @param slip - Slip probability (knowing but erring), default 0.1
 * @param guess - Guess probability (not knowing but correct), default 0.2
 * @param random - Random number generator
 */
export function generateCorrectness(
  K_star: number,
  slip: number,
  guess: number,
  random: SeededRandom
): boolean {
  const p_correct = (1 - slip) * K_star + guess * (1 - K_star);
  return random.randomBoolean(p_correct);
}

/**
 * Generate confidence based on true knowledge + miscalibration (Equation 5)
 * c = clip(K* + β* + ε_c, 0, 1)
 * 
 * @param K_star - True knowledge level [0, 1]
 * @param beta_star - Calibration bias (+ = overconfident, - = underconfident)
 * @param noise_std - Standard deviation of confidence noise, default 0.1
 * @param random - Random number generator
 */
export function generateConfidence(
  K_star: number,
  beta_star: number,
  noise_std: number,
  random: SeededRandom
): number {
  const epsilon_c = random.randomNormal(0, noise_std);
  return clip(K_star + beta_star + epsilon_c, 0, 1);
}

/**
 * Generate response time based on knowledge level (Equation 6)
 * τ = τ_base × (1 + γ × (1 - K*)) + ε_τ
 * 
 * @param K_star - True knowledge level [0, 1]
 * @param tau_base - Base response time in seconds
 * @param gamma - Knowledge-RT relationship strength
 * @param noise_std - Standard deviation of RT noise
 * @param random - Random number generator
 */
export function generateResponseTime(
  K_star: number,
  tau_base: number,
  gamma: number,
  noise_std: number,
  random: SeededRandom
): number {
  const epsilon_tau = random.randomNormal(0, noise_std);
  const tau = tau_base * (1 + gamma * (1 - K_star)) + epsilon_tau;
  return Math.max(0.5, tau); // Minimum 0.5 seconds
}

/**
 * Generate a complete response for an item
 */
export function generateResponse(
  item: Item,
  learner_state: TrueLearnerState,
  config: SimulationConfig,
  random: SeededRandom
): Response {
  const K_star = item.true_state.K_star;
  
  // Adjust base RT by item difficulty
  const tau_base_adjusted = config.rt_base * (1 + item.difficulty * 0.5);
  
  const correctness = generateCorrectness(
    K_star,
    config.slip_probability,
    config.guess_probability,
    random
  );
  
  const confidence = generateConfidence(
    K_star,
    learner_state.beta_star,
    config.confidence_noise_std,
    random
  );
  
  const response_time = generateResponseTime(
    K_star,
    tau_base_adjusted,
    config.rt_gamma,
    config.rt_noise_std,
    random
  );
  
  return {
    item_id: item.id,
    correctness,
    confidence,
    response_time,
    timestamp: new Date(),
  };
}

/**
 * Batch generate responses for multiple items
 */
export function generateResponses(
  items: Item[],
  learner_state: TrueLearnerState,
  config: SimulationConfig,
  random: SeededRandom
): Response[] {
  return items.map(item => generateResponse(item, learner_state, config, random));
}
```

## 3.4 src/calibration/scoringModule.ts

```typescript
// =============================================================================
// Calibration Scoring Module
// Implements ECE, Brier Score, and calibration detection
// =============================================================================

import {
  Response,
  ProcessedResponse,
  CalibrationMetrics,
  CalibrationBin,
  CalibrationType,
} from '../types';
import { mean } from '../utils/statistics';

/**
 * Calculate Brier score for a single response
 * Brier Score = (confidence - correctness)²
 */
export function brierScore(confidence: number, correctness: boolean): number {
  const outcome = correctness ? 1 : 0;
  return (confidence - outcome) ** 2;
}

/**
 * Calculate aggregate Brier score over multiple responses
 */
export function aggregateBrierScore(responses: Response[]): number {
  if (responses.length === 0) return 0;
  const scores = responses.map(r => brierScore(r.confidence, r.correctness));
  return mean(scores);
}

/**
 * Bin responses by confidence level for ECE calculation
 */
export function binResponses(
  responses: Response[],
  numBins: number = 10
): CalibrationBin[] {
  const bins: CalibrationBin[] = [];
  const binWidth = 1 / numBins;
  
  for (let i = 0; i < numBins; i++) {
    const binStart = i * binWidth;
    const binEnd = (i + 1) * binWidth;
    
    const binResponses = responses.filter(
      r => r.confidence >= binStart && r.confidence < binEnd
    );
    
    if (binResponses.length > 0) {
      const meanConfidence = mean(binResponses.map(r => r.confidence));
      const meanAccuracy = mean(binResponses.map(r => r.correctness ? 1 : 0));
      
      bins.push({
        bin_start: binStart,
        bin_end: binEnd,
        mean_confidence: meanConfidence,
        mean_accuracy: meanAccuracy,
        count: binResponses.length,
        calibration_gap: meanAccuracy - meanConfidence,
      });
    }
  }
  
  return bins;
}

/**
 * Calculate Expected Calibration Error (ECE)
 * ECE = Σ (|bin_size|/n) × |accuracy(bin) - mean_confidence(bin)|
 */
export function expectedCalibrationError(
  responses: Response[],
  numBins: number = 10
): number {
  if (responses.length === 0) return 0;
  
  const bins = binResponses(responses, numBins);
  const n = responses.length;
  
  let ece = 0;
  for (const bin of bins) {
    const weight = bin.count / n;
    const gap = Math.abs(bin.mean_accuracy - bin.mean_confidence);
    ece += weight * gap;
  }
  
  return ece;
}

/**
 * Calculate Maximum Calibration Error (MCE)
 */
export function maximumCalibrationError(
  responses: Response[],
  numBins: number = 10
): number {
  if (responses.length === 0) return 0;
  
  const bins = binResponses(responses, numBins);
  
  let mce = 0;
  for (const bin of bins) {
    const gap = Math.abs(bin.mean_accuracy - bin.mean_confidence);
    mce = Math.max(mce, gap);
  }
  
  return mce;
}

/**
 * Detect miscalibration direction from responses
 */
export function detectMiscalibration(
  responses: Response[],
  threshold: number = 0.05
): CalibrationType {
  if (responses.length === 0) return CalibrationType.WELL_CALIBRATED;
  
  // Calculate mean confidence - mean accuracy
  const meanConfidence = mean(responses.map(r => r.confidence));
  const meanAccuracy = mean(responses.map(r => r.correctness ? 1 : 0));
  const gap = meanConfidence - meanAccuracy;
  
  if (gap > threshold) {
    return CalibrationType.OVERCONFIDENT;
  } else if (gap < -threshold) {
    return CalibrationType.UNDERCONFIDENT;
  } else {
    return CalibrationType.WELL_CALIBRATED;
  }
}

/**
 * Estimate beta_hat (calibration bias) from response history
 */
export function estimateBetaHat(responses: Response[]): number {
  if (responses.length === 0) return 0;
  
  // β̂ ≈ mean(confidence) - mean(accuracy)
  const meanConfidence = mean(responses.map(r => r.confidence));
  const meanAccuracy = mean(responses.map(r => r.correctness ? 1 : 0));
  
  return meanConfidence - meanAccuracy;
}

/**
 * Calculate complete calibration metrics
 */
export function calculateCalibrationMetrics(
  responses: Response[],
  numBins: number = 10
): CalibrationMetrics {
  return {
    brier_score: aggregateBrierScore(responses),
    ece: expectedCalibrationError(responses, numBins),
    mce: maximumCalibrationError(responses, numBins),
    calibration_direction: detectMiscalibration(responses),
    bin_data: binResponses(responses, numBins),
  };
}
```

## 3.5 src/bkt/beliefUpdateEngine.ts

```typescript
// =============================================================================
// Bayesian Knowledge Tracing Belief Update Engine
// Implements Equation 1 from the project pitch
// =============================================================================

import { Response, SystemBelief, SimulationConfig } from '../types';
import { clip } from '../utils/random';

/**
 * Calculate likelihood of correctness given knowledge estimate
 * P(y|K̂) using slip-guess model
 */
export function likelihoodCorrectness(
  y: boolean,
  K_hat: number,
  slip: number,
  guess: number
): number {
  const p_correct = (1 - slip) * K_hat + guess * (1 - K_hat);
  return y ? p_correct : (1 - p_correct);
}

/**
 * Calculate likelihood of confidence given knowledge estimate
 * P(c|K̂) assuming c ~ N(K̂ + β̂, σ²)
 */
export function likelihoodConfidence(
  c: number,
  K_hat: number,
  beta_hat: number,
  sigma: number
): number {
  const expected_c = K_hat + beta_hat;
  const z = (c - expected_c) / sigma;
  // Gaussian PDF (unnormalized is fine for Bayes)
  return Math.exp(-0.5 * z * z);
}

/**
 * Calculate likelihood of response time given knowledge estimate
 * P(τ|K̂) assuming RT decreases with knowledge
 */
export function likelihoodRT(
  tau: number,
  K_hat: number,
  tau_base: number,
  gamma: number,
  sigma: number
): number {
  const expected_tau = tau_base * (1 + gamma * (1 - K_hat));
  const z = (tau - expected_tau) / sigma;
  return Math.exp(-0.5 * z * z);
}

/**
 * Perform Bayesian belief update (Equation 1)
 * P(K̂|y,c,τ) ∝ P(y|K̂) × P(c|K̂) × P(τ|K̂) × P(K̂)
 * 
 * Uses grid approximation for tractability
 */
export function updateBelief(
  response: Response,
  current_belief: SystemBelief,
  config: SimulationConfig,
  grid_points: number = 101
): SystemBelief {
  const { slip_probability, guess_probability, confidence_noise_std, rt_noise_std, rt_base, rt_gamma } = config;
  
  // Create grid of K̂ values
  const K_values: number[] = [];
  const posteriors: number[] = [];
  
  for (let i = 0; i < grid_points; i++) {
    const K = i / (grid_points - 1);
    K_values.push(K);
    
    // Prior: peaked at current belief
    const prior = Math.exp(-0.5 * ((K - current_belief.K_hat) / 0.2) ** 2);
    
    // Likelihoods
    const L_y = likelihoodCorrectness(response.correctness, K, slip_probability, guess_probability);
    const L_c = likelihoodConfidence(response.confidence, K, current_belief.beta_hat, confidence_noise_std);
    const L_tau = likelihoodRT(response.response_time, K, rt_base, rt_gamma, rt_noise_std);
    
    // Posterior (unnormalized)
    posteriors.push(prior * L_y * L_c * L_tau);
  }
  
  // Normalize
  const sum = posteriors.reduce((a, b) => a + b, 0);
  const normalized = posteriors.map(p => p / sum);
  
  // Compute expected value of K̂
  let K_hat_new = 0;
  for (let i = 0; i < grid_points; i++) {
    K_hat_new += K_values[i] * normalized[i];
  }
  
  // Compute variance for confidence interval
  let variance = 0;
  for (let i = 0; i < grid_points; i++) {
    variance += (K_values[i] - K_hat_new) ** 2 * normalized[i];
  }
  
  return {
    K_hat: clip(K_hat_new, 0, 1),
    beta_hat: current_belief.beta_hat, // Updated separately
    confidence_interval: Math.sqrt(variance) * 1.96,
    last_updated: new Date(),
  };
}

/**
 * Update beta_hat estimate based on recent responses
 */
export function updateBetaHat(
  responses: Response[],
  current_beta_hat: number,
  learning_rate: number = 0.1
): number {
  if (responses.length === 0) return current_beta_hat;
  
  // Calculate recent calibration gap
  const recent = responses.slice(-10); // Last 10 responses
  const mean_conf = recent.reduce((s, r) => s + r.confidence, 0) / recent.length;
  const mean_acc = recent.reduce((s, r) => s + (r.correctness ? 1 : 0), 0) / recent.length;
  const observed_beta = mean_conf - mean_acc;
  
  // Exponential moving average
  return current_beta_hat + learning_rate * (observed_beta - current_beta_hat);
}

/**
 * Apply forgetting drift to belief between sessions
 */
export function applyBeliefDrift(
  belief: SystemBelief,
  lambda: number,
  days_elapsed: number
): SystemBelief {
  // Belief drifts toward uncertainty (0.5) over time
  const decay = Math.exp(-lambda * days_elapsed);
  const K_hat_drifted = belief.K_hat * decay + 0.5 * (1 - decay);
  
  return {
    ...belief,
    K_hat: K_hat_drifted,
    confidence_interval: belief.confidence_interval * (1 + 0.1 * days_elapsed), // Uncertainty grows
  };
}
```

## 3.6 src/memory/forgettingModel.ts

```typescript
// =============================================================================
// Forgetting Model
// Implements Equation 3 from the project pitch
// =============================================================================

import { Item, TrueLearnerState } from '../types';

/**
 * Apply exponential forgetting to true knowledge (Equation 3)
 * K*_{t'} = K*_t × e^{-λ × Δt}
 * 
 * @param K_star - Current true knowledge level
 * @param lambda - Forgetting rate
 * @param delta_t - Time elapsed in days
 */
export function applyForgetting(
  K_star: number,
  lambda: number,
  delta_t: number
): number {
  return K_star * Math.exp(-lambda * delta_t);
}

/**
 * Calculate days since last review
 */
export function daysSinceReview(lastReview: Date | null, now: Date = new Date()): number {
  if (!lastReview) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return (now.getTime() - lastReview.getTime()) / msPerDay;
}

/**
 * Predict knowledge at a future time point
 */
export function predictForgottenKnowledge(
  K_star: number,
  lambda: number,
  days_in_future: number
): number {
  return applyForgetting(K_star, lambda, days_in_future);
}

/**
 * Calculate optimal review time (when K* drops to threshold)
 * Solving: threshold = K* × e^{-λt}
 * t = -ln(threshold/K*) / λ
 */
export function optimalReviewTime(
  K_star: number,
  lambda: number,
  threshold: number = 0.7
): number {
  if (K_star <= threshold) return 0; // Review immediately
  if (lambda === 0) return Infinity;
  
  return -Math.log(threshold / K_star) / lambda;
}

/**
 * Apply forgetting to an item
 */
export function applyItemForgetting(
  item: Item,
  lambda: number,
  now: Date = new Date()
): Item {
  const delta_t = daysSinceReview(item.true_state.last_review, now);
  
  if (delta_t === 0) return item;
  
  return {
    ...item,
    true_state: {
      ...item.true_state,
      K_star: applyForgetting(item.true_state.K_star, lambda, delta_t),
    },
  };
}

/**
 * Apply forgetting to all items in a pool
 */
export function applyBatchForgetting(
  items: Item[],
  lambda: number,
  now: Date = new Date()
): Item[] {
  return items.map(item => applyItemForgetting(item, lambda, now));
}

/**
 * Update true knowledge after a learning event (Equation 2)
 * K*_{t+1} = K*_t + α × (1 - K*_t) × 1[y=1] + α_err × (1 - K*_t) × 1[y=0]
 */
export function applyLearning(
  K_star: number,
  correctness: boolean,
  alpha: number,
  alpha_err: number
): number {
  if (correctness) {
    return K_star + alpha * (1 - K_star);
  } else {
    // Learning from errors (smaller effect)
    return K_star + alpha_err * (1 - K_star);
  }
}

/**
 * Calculate retention probability at a given delay
 */
export function calculateRetention(
  K_star: number,
  lambda: number,
  delay_days: number,
  slip: number = 0.1,
  guess: number = 0.2
): number {
  const K_at_delay = applyForgetting(K_star, lambda, delay_days);
  // Using slip-guess model
  return (1 - slip) * K_at_delay + guess * (1 - K_at_delay);
}
```

## 3.7 src/dualProcess/classifier.ts

```typescript
// =============================================================================
// Dual-Process Classifier
// Classifies responses as Type 1 (automatic) or Type 2 (deliberate)
// =============================================================================

import { Response, ProcessedResponse, ResponseType } from '../types';
import { OnlineStatistics, zScore } from '../utils/statistics';

/**
 * Dual-process classifier state (tracks running statistics)
 */
export class DualProcessClassifier {
  private rtStats: OnlineStatistics;
  private rtByDifficulty: Map<string, OnlineStatistics>;
  
  // Thresholds for classification
  private rtThreshold: number;      // Z-score threshold for "fast"
  private confidenceThreshold: number; // Confidence threshold for "high"
  
  constructor(
    rtThreshold: number = -0.5,
    confidenceThreshold: number = 0.7
  ) {
    this.rtStats = new OnlineStatistics();
    this.rtByDifficulty = new Map();
    this.rtThreshold = rtThreshold;
    this.confidenceThreshold = confidenceThreshold;
  }
  
  /**
   * Normalize RT within learner
   */
  normalizeRT(tau: number): number {
    if (this.rtStats.count < 5) {
      // Not enough data, return 0 (neutral)
      return 0;
    }
    return zScore(tau, this.rtStats.mean, this.rtStats.std);
  }
  
  /**
   * Normalize RT by item difficulty
   */
  normalizeRTByDifficulty(tau: number, difficulty_bin: string): number {
    const stats = this.rtByDifficulty.get(difficulty_bin);
    if (!stats || stats.count < 3) {
      return this.normalizeRT(tau);
    }
    return zScore(tau, stats.mean, stats.std);
  }
  
  /**
   * Compute dual-process score (RT × confidence interaction)
   * Higher score = more Type 1 (automatic)
   */
  computeDualProcessScore(normalized_rt: number, confidence: number): number {
    // Fast (negative z-score) + high confidence = positive score (Type 1)
    // Slow (positive z-score) + low confidence = negative score (Type 2)
    return confidence - (normalized_rt * 0.5 + 0.5);
  }
  
  /**
   * Classify response type
   */
  classifyResponseType(
    normalized_rt: number,
    confidence: number,
    correctness: boolean
  ): ResponseType {
    // Only classify correct responses (errors are ambiguous)
    if (!correctness) {
      return ResponseType.TYPE2_DELIBERATE; // Default for errors
    }
    
    const isFast = normalized_rt < this.rtThreshold;
    const isHighConfidence = confidence > this.confidenceThreshold;
    
    if (isFast && isHighConfidence) {
      return ResponseType.TYPE1_AUTOMATIC;
    } else {
      return ResponseType.TYPE2_DELIBERATE;
    }
  }
  
  /**
   * Get interval multiplier based on response type
   */
  getIntervalMultiplier(responseType: ResponseType, correctness: boolean): number {
    if (!correctness) {
      return 0.5; // Shorter interval for errors
    }
    
    if (responseType === ResponseType.TYPE1_AUTOMATIC) {
      return 1.2; // Slightly longer interval for automatized responses
    } else {
      return 1.0; // Standard interval for deliberate responses
    }
  }
  
  /**
   * Update running statistics with new response
   */
  updateStatistics(response: Response, difficulty_bin: string): void {
    this.rtStats.update(response.response_time);
    
    if (!this.rtByDifficulty.has(difficulty_bin)) {
      this.rtByDifficulty.set(difficulty_bin, new OnlineStatistics());
    }
    this.rtByDifficulty.get(difficulty_bin)!.update(response.response_time);
  }
  
  /**
   * Process a response and return enriched version
   */
  processResponse(response: Response, difficulty_bin: string): ProcessedResponse {
    // Update statistics first
    this.updateStatistics(response, difficulty_bin);
    
    // Normalize RT
    const normalized_rt = this.normalizeRTByDifficulty(
      response.response_time,
      difficulty_bin
    );
    
    // Compute score and classify
    const dual_process_score = this.computeDualProcessScore(
      normalized_rt,
      response.confidence
    );
    
    const response_type = this.classifyResponseType(
      normalized_rt,
      response.confidence,
      response.correctness
    );
    
    // Calculate Brier score
    const outcome = response.correctness ? 1 : 0;
    const brier_score = (response.confidence - outcome) ** 2;
    
    return {
      ...response,
      response_type,
      normalized_rt,
      dual_process_score,
      brier_score,
    };
  }
  
  /**
   * Reset classifier state
   */
  reset(): void {
    this.rtStats.reset();
    this.rtByDifficulty.clear();
  }
}

/**
 * Get difficulty bin label for an item
 */
export function getDifficultyBin(difficulty: number): string {
  if (difficulty < 0.33) return 'easy';
  if (difficulty < 0.67) return 'medium';
  return 'hard';
}
```

## 3.8 src/scheduler/calibrationAwareScheduler.ts

```typescript
// =============================================================================
// Calibration-Aware Scheduler
// Schedules reviews based on K̂, β̂, and dual-process classification
// =============================================================================

import {
  Item,
  ProcessedResponse,
  SystemBelief,
  ResponseType,
  SchedulerType,
} from '../types';

/**
 * Calculate base interval from knowledge estimate and forgetting rate
 */
export function baseInterval(K_hat: number, lambda: number): number {
  // Higher knowledge = longer interval
  // Base formula: target K* = 0.7 at next review
  // 0.7 = K_hat × e^{-λ × t}
  // t = -ln(0.7/K_hat) / λ
  
  if (K_hat <= 0.7) return 1; // Review tomorrow if knowledge is low
  if (lambda === 0) return 30; // Max interval if no forgetting
  
  const target_retention = 0.7;
  const interval = -Math.log(target_retention / K_hat) / lambda;
  
  // Clamp to reasonable range
  return Math.max(1, Math.min(30, interval));
}

/**
 * Adjust interval based on calibration estimate
 */
export function calibrationAdjustment(beta_hat: number): number {
  // Overconfident (β̂ > 0): shorten interval (multiply by < 1)
  // Underconfident (β̂ < 0): lengthen interval (multiply by > 1)
  // Well-calibrated (β̂ ≈ 0): no adjustment
  
  // Adjustment factor: e^{-2β̂}
  // β̂ = +0.2 → factor ≈ 0.67 (shorter)
  // β̂ = -0.2 → factor ≈ 1.49 (longer)
  // β̂ = 0 → factor = 1 (no change)
  
  return Math.exp(-2 * beta_hat);
}

/**
 * Adjust interval based on dual-process classification
 */
export function dualProcessAdjustment(
  responseType: ResponseType,
  correctness: boolean
): number {
  if (!correctness) {
    return 0.5; // Shorten interval for errors
  }
  
  if (responseType === ResponseType.TYPE1_AUTOMATIC) {
    return 1.2; // Slightly longer for automatized
  }
  
  return 1.0; // Standard for deliberate
}

/**
 * Compute next review interval for an item
 */
export function computeNextReviewInterval(
  belief: SystemBelief,
  response: ProcessedResponse,
  lambda: number,
  enableCalibration: boolean = true,
  enableDualProcess: boolean = true
): number {
  // Start with base interval
  let interval = baseInterval(belief.K_hat, lambda);
  
  // Apply calibration adjustment
  if (enableCalibration) {
    interval *= calibrationAdjustment(belief.beta_hat);
  }
  
  // Apply dual-process adjustment
  if (enableDualProcess) {
    interval *= dualProcessAdjustment(response.response_type, response.correctness);
  }
  
  // Clamp to [1, 60] days
  return Math.max(1, Math.min(60, Math.round(interval)));
}

/**
 * Calculate review urgency for an item
 * Higher urgency = should be reviewed sooner
 */
export function calculateUrgency(item: Item, now: Date = new Date()): number {
  const scheduled = item.system_belief.next_review;
  const days_until_due = (scheduled.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  
  // Negative days = overdue (high urgency)
  // Positive days = not yet due (lower urgency)
  return -days_until_due;
}

/**
 * Select next items to review from pool
 */
export function selectItemsForReview(
  items: Item[],
  count: number,
  now: Date = new Date()
): Item[] {
  // Sort by urgency (most urgent first)
  const sorted = [...items].sort((a, b) => {
    return calculateUrgency(b, now) - calculateUrgency(a, now);
  });
  
  return sorted.slice(0, count);
}

/**
 * CalibrateMe Scheduler
 */
export class CalibrateMe Scheduler {
  private lambda: number;
  private enableCalibration: boolean;
  private enableDualProcess: boolean;
  
  constructor(
    lambda: number = 0.1,
    enableCalibration: boolean = true,
    enableDualProcess: boolean = true
  ) {
    this.lambda = lambda;
    this.enableCalibration = enableCalibration;
    this.enableDualProcess = enableDualProcess;
  }
  
  scheduleNext(
    item: Item,
    belief: SystemBelief,
    response: ProcessedResponse
  ): Date {
    const interval = computeNextReviewInterval(
      belief,
      response,
      this.lambda,
      this.enableCalibration,
      this.enableDualProcess
    );
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    return nextReview;
  }
  
  selectItems(items: Item[], count: number): Item[] {
    return selectItemsForReview(items, count);
  }
}
```

## 3.9 src/scaffolding/adaptiveScaffolding.ts

```typescript
// =============================================================================
// Adaptive Scaffolding Module
// Delivers prompts that modify β* over time (Equation 7)
// =============================================================================

import {
  ScaffoldType,
  CalibrationType,
  TrueLearnerState,
  ProcessedResponse,
} from '../types';
import { clip } from '../utils/random';

/**
 * Scaffold prompt templates
 */
export const SCAFFOLD_PROMPTS = {
  [ScaffoldType.REFLECTION]: [
    "Take a moment to reflect: Was your confidence level accurate for this item?",
    "Consider: Are you perhaps overestimating your knowledge of this topic?",
    "Think about what made this item challenging. Does your confidence match the difficulty?",
    "Pause and ask yourself: Do I truly know this, or am I just familiar with it?",
  ],
  [ScaffoldType.ENCOURAGEMENT]: [
    "You're doing better than you think! Trust your knowledge more.",
    "Your answer was correct - have more confidence in your abilities!",
    "Remember: You've studied this material. Give yourself credit for what you know.",
    "Great job! Your performance suggests you know more than you realize.",
  ],
  [ScaffoldType.NONE]: [],
};

/**
 * Select appropriate scaffold based on calibration estimate
 */
export function selectScaffold(
  beta_hat: number,
  recent_responses: ProcessedResponse[],
  threshold: number = 0.1
): ScaffoldType {
  if (beta_hat > threshold) {
    return ScaffoldType.REFLECTION;
  } else if (beta_hat < -threshold) {
    return ScaffoldType.ENCOURAGEMENT;
  }
  return ScaffoldType.NONE;
}

/**
 * Check if scaffold should be triggered
 */
export function shouldTriggerScaffold(
  calibration_type: CalibrationType,
  responses_since_last_scaffold: number,
  min_interval: number = 5
): boolean {
  // Don't scaffold well-calibrated learners
  if (calibration_type === CalibrationType.WELL_CALIBRATED) {
    return false;
  }
  
  // Don't scaffold too frequently
  if (responses_since_last_scaffold < min_interval) {
    return false;
  }
  
  return true;
}

/**
 * Apply scaffolding effect on true calibration (Equation 7)
 * β*_{t+1} = β*_t × (1 - δ)
 * 
 * @param beta_star - Current true calibration bias
 * @param delta - Scaffolding effectiveness rate [0.02, 0.05]
 */
export function applyScaffoldingEffect(
  beta_star: number,
  delta: number
): number {
  // Scaffolding reduces the magnitude of miscalibration
  return beta_star * (1 - delta);
}

/**
 * Get a random prompt for the scaffold type
 */
export function getScaffoldPrompt(
  scaffoldType: ScaffoldType,
  randomIndex: number = Math.floor(Math.random() * 4)
): string {
  const prompts = SCAFFOLD_PROMPTS[scaffoldType];
  if (prompts.length === 0) return '';
  return prompts[randomIndex % prompts.length];
}

/**
 * Adaptive Scaffolding Manager
 */
export class AdaptiveScaffoldingManager {
  private delta: number;
  private threshold: number;
  private minInterval: number;
  private responsesSinceLastScaffold: number;
  private scaffoldHistory: Array<{ type: ScaffoldType; timestamp: Date }>;
  
  constructor(
    delta: number = 0.03,
    threshold: number = 0.1,
    minInterval: number = 5
  ) {
    this.delta = delta;
    this.threshold = threshold;
    this.minInterval = minInterval;
    this.responsesSinceLastScaffold = 0;
    this.scaffoldHistory = [];
  }
  
  /**
   * Process a response and potentially deliver scaffold
   */
  processResponse(
    response: ProcessedResponse,
    beta_hat: number,
    learner_state: TrueLearnerState
  ): {
    scaffold: ScaffoldType;
    prompt: string;
    updated_beta_star: number;
  } {
    this.responsesSinceLastScaffold++;
    
    // Determine calibration type
    let calibration_type: CalibrationType;
    if (beta_hat > this.threshold) {
      calibration_type = CalibrationType.OVERCONFIDENT;
    } else if (beta_hat < -this.threshold) {
      calibration_type = CalibrationType.UNDERCONFIDENT;
    } else {
      calibration_type = CalibrationType.WELL_CALIBRATED;
    }
    
    // Check if we should trigger scaffold
    if (!shouldTriggerScaffold(calibration_type, this.responsesSinceLastScaffold, this.minInterval)) {
      return {
        scaffold: ScaffoldType.NONE,
        prompt: '',
        updated_beta_star: learner_state.beta_star,
      };
    }
    
    // Select and apply scaffold
    const scaffold = selectScaffold(beta_hat, [], this.threshold);
    
    if (scaffold !== ScaffoldType.NONE) {
      this.responsesSinceLastScaffold = 0;
      this.scaffoldHistory.push({ type: scaffold, timestamp: new Date() });
      
      const updated_beta_star = applyScaffoldingEffect(learner_state.beta_star, this.delta);
      const prompt = getScaffoldPrompt(scaffold);
      
      return {
        scaffold,
        prompt,
        updated_beta_star,
      };
    }
    
    return {
      scaffold: ScaffoldType.NONE,
      prompt: '',
      updated_beta_star: learner_state.beta_star,
    };
  }
  
  /**
   * Get scaffold history
   */
  getHistory(): Array<{ type: ScaffoldType; timestamp: Date }> {
    return [...this.scaffoldHistory];
  }
  
  /**
   * Reset manager state
   */
  reset(): void {
    this.responsesSinceLastScaffold = 0;
    this.scaffoldHistory = [];
  }
}
```

---

# 4. Baselines

## 4.1 src/baselines/sm2.ts

```typescript
// =============================================================================
// SM-2 Baseline Scheduler
// Classic SuperMemo 2 algorithm (calibration-blind)
// =============================================================================

import { Item, Response } from '../types';

/**
 * SM-2 Algorithm State for an item
 */
export interface SM2State {
  easeFactor: number;    // EF (starts at 2.5)
  interval: number;      // Current interval in days
  repetitions: number;   // Number of successful repetitions
}

/**
 * Initialize SM-2 state for a new item
 */
export function initSM2State(): SM2State {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
  };
}

/**
 * Map confidence and correctness to SM-2 quality rating (0-5)
 * q = round(5 × c × 1[y=1])
 * Incorrect responses receive q = 0
 */
export function mapToQuality(confidence: number, correctness: boolean): number {
  if (!correctness) return 0;
  return Math.round(5 * confidence);
}

/**
 * Update SM-2 state based on response quality
 */
export function updateSM2(state: SM2State, quality: number): SM2State {
  // Quality must be in [0, 5]
  const q = Math.max(0, Math.min(5, quality));
  
  // Update ease factor
  let newEF = state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, newEF); // Minimum EF is 1.3
  
  let newInterval: number;
  let newReps: number;
  
  if (q < 3) {
    // Failed response - reset
    newReps = 0;
    newInterval = 1;
  } else {
    // Successful response
    newReps = state.repetitions + 1;
    
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(state.interval * newEF);
    }
  }
  
  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
  };
}

/**
 * SM-2 Scheduler
 */
export class SM2Scheduler {
  private states: Map<string, SM2State>;
  
  constructor() {
    this.states = new Map();
  }
  
  /**
   * Get or initialize state for an item
   */
  getState(itemId: string): SM2State {
    if (!this.states.has(itemId)) {
      this.states.set(itemId, initSM2State());
    }
    return this.states.get(itemId)!;
  }
  
  /**
   * Process a response and schedule next review
   */
  processResponse(response: Response): { nextReview: Date; interval: number } {
    const state = this.getState(response.item_id);
    const quality = mapToQuality(response.confidence, response.correctness);
    const newState = updateSM2(state, quality);
    
    this.states.set(response.item_id, newState);
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newState.interval);
    
    return {
      nextReview,
      interval: newState.interval,
    };
  }
  
  /**
   * Reset scheduler state
   */
  reset(): void {
    this.states.clear();
  }
}
```

## 4.2 src/baselines/bktOnly.ts

```typescript
// =============================================================================
// BKT-Only Baseline Scheduler
// Uses Bayesian Knowledge Tracing without calibration adjustment
// =============================================================================

import { Item, Response, SystemBelief, SimulationConfig } from '../types';
import { updateBelief } from '../bkt/beliefUpdateEngine';
import { baseInterval } from '../scheduler/calibrationAwareScheduler';

/**
 * BKT-Only Scheduler
 * Schedules based on K̂ only, ignoring calibration
 */
export class BKTOnlyScheduler {
  private beliefs: Map<string, SystemBelief>;
  private lambda: number;
  private config: SimulationConfig;
  
  constructor(lambda: number, config: SimulationConfig) {
    this.beliefs = new Map();
    this.lambda = lambda;
    this.config = config;
  }
  
  /**
   * Get or initialize belief for an item
   */
  getBelief(itemId: string): SystemBelief {
    if (!this.beliefs.has(itemId)) {
      this.beliefs.set(itemId, {
        K_hat: 0.3, // Initial belief
        beta_hat: 0, // Ignored in BKT-only
        confidence_interval: 0.2,
        last_updated: new Date(),
      });
    }
    return this.beliefs.get(itemId)!;
  }
  
  /**
   * Process a response and schedule next review
   */
  processResponse(response: Response): { nextReview: Date; interval: number } {
    const currentBelief = this.getBelief(response.item_id);
    
    // Update belief using BKT
    const updatedBelief = updateBelief(response, currentBelief, this.config);
    this.beliefs.set(response.item_id, updatedBelief);
    
    // Calculate interval based on K̂ only (no calibration adjustment)
    const interval = baseInterval(updatedBelief.K_hat, this.lambda);
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.round(interval));
    
    return {
      nextReview,
      interval: Math.round(interval),
    };
  }
  
  /**
   * Reset scheduler state
   */
  reset(): void {
    this.beliefs.clear();
  }
}
```

## 4.3 src/baselines/decayBased.ts

```typescript
// =============================================================================
// Decay-Based Baseline Scheduler
// Simple exponential decay scheduler (ignores calibration)
// =============================================================================

import { Item, Response } from '../types';

/**
 * Decay-Based Scheduler State
 */
export interface DecayState {
  interval: number;       // Current interval in days
  lastReview: Date | null;
  streak: number;         // Consecutive correct answers
}

/**
 * Initialize decay state for a new item
 */
export function initDecayState(): DecayState {
  return {
    interval: 1,
    lastReview: null,
    streak: 0,
  };
}

/**
 * Decay-Based Scheduler
 * Simple: double interval on correct, reset on incorrect
 */
export class DecayBasedScheduler {
  private states: Map<string, DecayState>;
  private maxInterval: number;
  
  constructor(maxInterval: number = 30) {
    this.states = new Map();
    this.maxInterval = maxInterval;
  }
  
  /**
   * Get or initialize state for an item
   */
  getState(itemId: string): DecayState {
    if (!this.states.has(itemId)) {
      this.states.set(itemId, initDecayState());
    }
    return this.states.get(itemId)!;
  }
  
  /**
   * Process a response and schedule next review
   */
  processResponse(response: Response): { nextReview: Date; interval: number } {
    const state = this.getState(response.item_id);
    
    let newInterval: number;
    let newStreak: number;
    
    if (response.correctness) {
      // Double the interval (exponential growth)
      newStreak = state.streak + 1;
      newInterval = Math.min(state.interval * 2, this.maxInterval);
    } else {
      // Reset on error
      newStreak = 0;
      newInterval = 1;
    }
    
    this.states.set(response.item_id, {
      interval: newInterval,
      lastReview: new Date(),
      streak: newStreak,
    });
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    
    return {
      nextReview,
      interval: newInterval,
    };
  }
  
  /**
   * Reset scheduler state
   */
  reset(): void {
    this.states.clear();
  }
}
```

---

# 5. Simulation Engine

## 5.1 src/profiles/learnerProfiles.ts

```typescript
// =============================================================================
// Learner Profiles
// Defines the 9 synthetic learner profiles (3 Ability × 3 Calibration)
// =============================================================================

import {
  AbilityLevel,
  CalibrationType,
  LearnerProfile,
  LearnerProfileParams,
  TrueLearnerState,
  SystemBelief,
  Item,
} from '../types';

/**
 * Profile parameter definitions (Table 2 from pitch)
 */
export const PROFILE_PARAMS: Record<string, LearnerProfileParams> = {
  'Low-Over': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: 0.25,
  },
  'Low-Under': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: -0.20,
  },
  'Low-Well': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: 0.00,
  },
  'Med-Over': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.20,
  },
  'Med-Under': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: -0.15,
  },
  'Med-Well': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.00,
  },
  'High-Over': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: 0.15,
  },
  'High-Under': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: -0.10,
  },
  'High-Well': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.WELL_CALIBRATED,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: 0.00,
  },
};

/**
 * Create a learner profile by name
 */
export function createLearnerProfile(
  profileName: string,
  numItems: number = 100
): LearnerProfile {
  const params = PROFILE_PARAMS[profileName];
  if (!params) {
    throw new Error(`Unknown profile: ${profileName}`);
  }
  
  const trueState: TrueLearnerState = {
    K_star: 0.3, // Initial global knowledge
    beta_star: params.beta_star,
    alpha: params.alpha,
    alpha_err: params.alpha * 0.5,
    lambda: params.lambda,
  };
  
  const systemBelief: SystemBelief = {
    K_hat: 0.3,
    beta_hat: 0, // System starts with no calibration estimate
    confidence_interval: 0.2,
    last_updated: new Date(),
  };
  
  // Create item pool
  const items: Item[] = [];
  for (let i = 0; i < numItems; i++) {
    const difficulty = (i % 3) * 0.33 + 0.17; // Easy/Medium/Hard
    items.push(createItem(`item-${i}`, difficulty));
  }
  
  return {
    id: profileName,
    name: profileName,
    params,
    true_state: trueState,
    system_belief: systemBelief,
    items,
    response_history: [],
    session_count: 0,
  };
}

/**
 * Create an item
 */
export function createItem(id: string, difficulty: number): Item {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    id,
    difficulty,
    true_state: {
      K_star: 0.1, // Start with low knowledge
      last_review: null,
    },
    system_belief: {
      K_hat: 0.1,
      beta_hat: 0,
      next_review: tomorrow,
      interval_days: 1,
      ease_factor: 2.5,
    },
    review_history: [],
  };
}

/**
 * Get all profile names
 */
export function getAllProfileNames(): string[] {
  return Object.keys(PROFILE_PARAMS);
}

/**
 * Create all 9 profiles
 */
export function createAllProfiles(numItems: number = 100): LearnerProfile[] {
  return getAllProfileNames().map(name => createLearnerProfile(name, numItems));
}
```

## 5.2 src/simulation/simulationEngine.ts

```typescript
// =============================================================================
// Simulation Engine
// Orchestrates all modules for running experiments
// =============================================================================

import {
  LearnerProfile,
  Item,
  Response,
  ProcessedResponse,
  SimulationConfig,
  SimulationResults,
  SessionData,
  SchedulerType,
  ScaffoldType,
  DEFAULT_SIMULATION_CONFIG,
} from '../types';
import { SeededRandom } from '../utils/random';
import { mean } from '../utils/statistics';
import { generateResponse } from './responseGenerator';
import { calculateCalibrationMetrics, estimateBetaHat } from '../calibration/scoringModule';
import { updateBelief, updateBetaHat } from '../bkt/beliefUpdateEngine';
import { applyForgetting, applyLearning, calculateRetention } from '../memory/forgettingModel';
import { DualProcessClassifier, getDifficultyBin } from '../dualProcess/classifier';
import { CalibrateMe Scheduler, selectItemsForReview } from '../scheduler/calibrationAwareScheduler';
import { AdaptiveScaffoldingManager, applyScaffoldingEffect } from '../scaffolding/adaptiveScaffolding';
import { SM2Scheduler } from '../baselines/sm2';
import { BKTOnlyScheduler } from '../baselines/bktOnly';
import { DecayBasedScheduler } from '../baselines/decayBased';

/**
 * Run a complete simulation for a learner profile
 */
export function runSimulation(
  profile: LearnerProfile,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG
): SimulationResults {
  // Initialize random generator
  const random = new SeededRandom(config.random_seed ?? Date.now());
  
  // Clone profile to avoid mutation
  const learner = JSON.parse(JSON.stringify(profile)) as LearnerProfile;
  
  // Initialize modules
  const dualProcessClassifier = new DualProcessClassifier();
  const scaffoldingManager = new AdaptiveScaffoldingManager(config.scaffolding_delta);
  
  // Initialize scheduler based on type
  let scheduler: any;
  switch (config.scheduler_type) {
    case SchedulerType.SM2:
      scheduler = new SM2Scheduler();
      break;
    case SchedulerType.BKT_ONLY:
      scheduler = new BKTOnlyScheduler(learner.params.lambda, config);
      break;
    case SchedulerType.DECAY_BASED:
      scheduler = new DecayBasedScheduler();
      break;
    case SchedulerType.CALIBRATEME:
    default:
      scheduler = new CalibrateMe Scheduler(
        learner.params.lambda,
        true, // enable calibration
        config.enable_dual_process
      );
      break;
  }
  
  // Tracking variables
  const eceTrajectory: number[] = [];
  const brierTrajectory: number[] = [];
  const KStarTrajectory: number[] = [];
  const KHatTrajectory: number[] = [];
  const sessionDataList: SessionData[] = [];
  
  let masteryAchievedSession = -1;
  let masteryCount = 0;
  
  // Run sessions
  for (let session = 0; session < config.num_sessions; session++) {
    // Apply forgetting to all items (simulate time passing)
    const daysBetweenSessions = session === 0 ? 0 : 1;
    learner.items = learner.items.map(item => ({
      ...item,
      true_state: {
        ...item.true_state,
        K_star: applyForgetting(
          item.true_state.K_star,
          learner.params.lambda,
          daysBetweenSessions
        ),
      },
    }));
    
    // Select items for review
    const itemsToReview = selectItemsForReview(
      learner.items,
      config.items_per_session
    );
    
    // Session tracking
    let correctCount = 0;
    let type1Count = 0;
    let type2Count = 0;
    let scaffoldsDelivered = 0;
    const sessionResponses: ProcessedResponse[] = [];
    
    // Process each item
    for (const item of itemsToReview) {
      // Generate response based on true state
      const response = generateResponse(
        item,
        learner.true_state,
        config,
        random
      );
      
      // Process with dual-process classifier
      const processedResponse = dualProcessClassifier.processResponse(
        response,
        getDifficultyBin(item.difficulty)
      );
      
      // Update statistics
      if (processedResponse.correctness) correctCount++;
      if (processedResponse.response_type === 'TYPE1_AUTOMATIC') type1Count++;
      else type2Count++;
      
      // Update true knowledge (learning)
      const newKStar = applyLearning(
        item.true_state.K_star,
        response.correctness,
        learner.true_state.alpha,
        learner.true_state.alpha_err
      );
      item.true_state.K_star = newKStar;
      item.true_state.last_review = new Date();
      
      // Update system belief
      if (config.scheduler_type === SchedulerType.CALIBRATEME ||
          config.scheduler_type === SchedulerType.BKT_ONLY) {
        const updatedBelief = updateBelief(
          response,
          learner.system_belief,
          config
        );
        learner.system_belief = updatedBelief;
        
        // Update beta_hat
        learner.system_belief.beta_hat = updateBetaHat(
          learner.response_history.slice(-20),
          learner.system_belief.beta_hat
        );
      }
      
      // Apply scaffolding (CalibrateMe only)
      if (config.enable_scaffolding && config.scheduler_type === SchedulerType.CALIBRATEME) {
        const scaffoldResult = scaffoldingManager.processResponse(
          processedResponse,
          learner.system_belief.beta_hat,
          learner.true_state
        );
        
        if (scaffoldResult.scaffold !== ScaffoldType.NONE) {
          scaffoldsDelivered++;
          learner.true_state.beta_star = scaffoldResult.updated_beta_star;
        }
      }
      
      // Schedule next review
      const scheduleResult = scheduler.processResponse(response);
      item.system_belief.next_review = scheduleResult.nextReview;
      item.system_belief.interval_days = scheduleResult.interval;
      
      // Store response
      sessionResponses.push(processedResponse);
      learner.response_history.push(processedResponse);
    }
    
    // Calculate session metrics
    const metrics = calculateCalibrationMetrics(sessionResponses);
    eceTrajectory.push(metrics.ece);
    brierTrajectory.push(metrics.brier_score);
    
    const meanKStar = mean(learner.items.map(i => i.true_state.K_star));
    KStarTrajectory.push(meanKStar);
    KHatTrajectory.push(learner.system_belief.K_hat);
    
    // Check mastery
    if (meanKStar > 0.9) {
      masteryCount++;
      if (masteryCount >= 2 && masteryAchievedSession < 0) {
        masteryAchievedSession = session;
      }
    } else {
      masteryCount = 0;
    }
    
    // Store session data
    sessionDataList.push({
      session_number: session,
      items_reviewed: itemsToReview.length,
      correct_count: correctCount,
      mean_confidence: mean(sessionResponses.map(r => r.confidence)),
      mean_rt: mean(sessionResponses.map(r => r.response_time)),
      type1_count: type1Count,
      type2_count: type2Count,
      scaffolds_delivered: scaffoldsDelivered,
      mean_K_star: meanKStar,
      mean_K_hat: learner.system_belief.K_hat,
      ece: metrics.ece,
      brier: metrics.brier_score,
    });
  }
  
  // Calculate final metrics
  const finalKStar = mean(learner.items.map(i => i.true_state.K_star));
  const retention1 = calculateRetention(finalKStar, learner.params.lambda, 1);
  const retention7 = calculateRetention(finalKStar, learner.params.lambda, 7);
  const retention30 = calculateRetention(finalKStar, learner.params.lambda, 30);
  
  return {
    profile_id: profile.id,
    scheduler_type: config.scheduler_type,
    config,
    retention_1day: retention1,
    retention_7day: retention7,
    retention_30day: retention30,
    time_to_mastery: masteryAchievedSession >= 0 ? masteryAchievedSession : config.num_sessions,
    review_efficiency: learner.response_history.length / config.num_items,
    total_review_time: learner.response_history.reduce((s, r) => s + r.response_time, 0),
    ece_trajectory: eceTrajectory,
    brier_trajectory: brierTrajectory,
    K_star_trajectory: KStarTrajectory,
    K_hat_trajectory: KHatTrajectory,
    session_data: sessionDataList,
  };
}

/**
 * Run simulations for all profiles and conditions
 */
export function runExperiment(
  profiles: LearnerProfile[],
  schedulerTypes: SchedulerType[],
  config: SimulationConfig,
  replications: number = 1
): Map<string, Map<SchedulerType, SimulationResults[]>> {
  const results = new Map<string, Map<SchedulerType, SimulationResults[]>>();
  
  for (const profile of profiles) {
    const profileResults = new Map<SchedulerType, SimulationResults[]>();
    
    for (const schedulerType of schedulerTypes) {
      const repResults: SimulationResults[] = [];
      
      for (let rep = 0; rep < replications; rep++) {
        const simConfig = {
          ...config,
          scheduler_type: schedulerType,
          random_seed: config.random_seed ? config.random_seed + rep : null,
        };
        
        const result = runSimulation(profile, simConfig);
        repResults.push(result);
      }
      
      profileResults.set(schedulerType, repResults);
    }
    
    results.set(profile.id, profileResults);
  }
  
  return results;
}
```

---

# 6. React Components

## 6.1 src/App.tsx

```tsx
import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CalibrateMe</h1>
        <p>Metacognitive Calibration in Adaptive Learning</p>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
      <footer className="app-footer">
        <p>CS 6795 - Cognitive Science | Georgia Tech | Spring 2026</p>
      </footer>
    </div>
  );
}

export default App;
```

## 6.2 src/App.css

```css
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  padding: 1.5rem 2rem;
  text-align: center;
}

.app-header h1 {
  margin: 0;
  font-size: 2rem;
}

.app-header p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 1rem;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: #2d3748;
  color: #a0aec0;
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
}

/* Dashboard Layout */
.dashboard {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Card Component */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

/* Form Elements */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.375rem;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #2d3748;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-primary:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-block {
  width: 100%;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #718096;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.metric-value.positive {
  color: #38a169;
}

.metric-value.negative {
  color: #e53e3e;
}

/* Charts */
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 1rem;
}

/* Response Table */
.response-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.response-table th,
.response-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.response-table th {
  font-weight: 600;
  color: #4a5568;
  background: #f7fafc;
}

.response-table tr:hover {
  background: #f7fafc;
}

/* Status Badges */
.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: #c6f6d5;
  color: #22543d;
}

.badge-error {
  background: #fed7d7;
  color: #822727;
}

.badge-warning {
  background: #fefcbf;
  color: #744210;
}

.badge-info {
  background: #bee3f8;
  color: #2a4365;
}

/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

## 6.3 src/store/simulationStore.ts

```typescript
// =============================================================================
// Zustand Store for Simulation State
// =============================================================================

import { create } from 'zustand';
import {
  LearnerProfile,
  SimulationConfig,
  SimulationResults,
  SchedulerType,
  DEFAULT_SIMULATION_CONFIG,
} from '../types';
import { createLearnerProfile, getAllProfileNames } from '../profiles/learnerProfiles';
import { runSimulation } from '../simulation/simulationEngine';

interface SimulationStore {
  // State
  selectedProfile: string;
  config: SimulationConfig;
  profile: LearnerProfile | null;
  results: SimulationResults | null;
  isRunning: boolean;
  error: string | null;
  
  // Actions
  setSelectedProfile: (profileName: string) => void;
  setSchedulerType: (type: SchedulerType) => void;
  setConfig: (config: Partial<SimulationConfig>) => void;
  runSimulation: () => Promise<void>;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  selectedProfile: 'Med-Over',
  config: DEFAULT_SIMULATION_CONFIG,
  profile: null,
  results: null,
  isRunning: false,
  error: null,
  
  // Actions
  setSelectedProfile: (profileName: string) => {
    set({ selectedProfile: profileName, results: null });
  },
  
  setSchedulerType: (type: SchedulerType) => {
    set(state => ({
      config: { ...state.config, scheduler_type: type },
      results: null,
    }));
  },
  
  setConfig: (newConfig: Partial<SimulationConfig>) => {
    set(state => ({
      config: { ...state.config, ...newConfig },
      results: null,
    }));
  },
  
  runSimulation: async () => {
    const { selectedProfile, config } = get();
    
    set({ isRunning: true, error: null });
    
    try {
      // Create profile
      const profile = createLearnerProfile(selectedProfile, config.num_items);
      
      // Run simulation (in a setTimeout to allow UI to update)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const results = runSimulation(profile, config);
      
      set({ profile, results, isRunning: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Simulation failed',
        isRunning: false,
      });
    }
  },
  
  reset: () => {
    set({
      profile: null,
      results: null,
      error: null,
    });
  },
}));
```

## 6.4 src/components/Dashboard.tsx

```tsx
import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import LearnerProfileSelector from './LearnerProfileSelector';
import SimulationControls from './SimulationControls';
import MetricsDisplay from './MetricsDisplay';
import CalibrationChart from './CalibrationChart';
import ResponseHistory from './ResponseHistory';

const Dashboard: React.FC = () => {
  const { results, isRunning, error } = useSimulationStore();
  
  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <LearnerProfileSelector />
        <SimulationControls />
      </div>
      
      <div className="dashboard-content">
        {error && (
          <div className="card" style={{ background: '#fed7d7', color: '#822727' }}>
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
        
        {isRunning && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ marginBottom: '1rem' }}></div>
            <p>Running simulation...</p>
          </div>
        )}
        
        {results && !isRunning && (
          <>
            <MetricsDisplay results={results} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <CalibrationChart
                title="Knowledge Trajectory"
                data={results.K_star_trajectory.map((k, i) => ({
                  session: i + 1,
                  'True (K*)': k,
                  'Belief (K̂)': results.K_hat_trajectory[i],
                }))}
                dataKeys={['True (K*)', 'Belief (K̂)']}
                colors={['#38a169', '#4299e1']}
              />
              <CalibrationChart
                title="Calibration Error (ECE)"
                data={results.ece_trajectory.map((e, i) => ({
                  session: i + 1,
                  ECE: e,
                }))}
                dataKeys={['ECE']}
                colors={['#e53e3e']}
              />
            </div>
            <ResponseHistory sessionData={results.session_data} />
          </>
        )}
        
        {!results && !isRunning && !error && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            <p>Select a learner profile and click "Run Simulation" to see results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
```

## 6.5 src/components/LearnerProfileSelector.tsx

```tsx
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
```

## 6.6 src/components/SimulationControls.tsx

```tsx
import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { SchedulerType } from '../types';

const SimulationControls: React.FC = () => {
  const { config, setConfig, setSchedulerType, runSimulation, reset, isRunning } = useSimulationStore();
  
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
        <label className="form-label">Sessions</label>
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
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          className="btn btn-primary btn-block"
          onClick={runSimulation}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : 'Run Simulation'}
        </button>
        <button
          className="btn btn-secondary"
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
```

## 6.7 src/components/MetricsDisplay.tsx

```tsx
import React from 'react';
import { SimulationResults } from '../types';

interface MetricsDisplayProps {
  results: SimulationResults;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ results }) => {
  const metrics = [
    {
      label: 'Retention (1 day)',
      value: `${(results.retention_1day * 100).toFixed(1)}%`,
      positive: results.retention_1day > 0.8,
    },
    {
      label: 'Retention (7 days)',
      value: `${(results.retention_7day * 100).toFixed(1)}%`,
      positive: results.retention_7day > 0.7,
    },
    {
      label: 'Retention (30 days)',
      value: `${(results.retention_30day * 100).toFixed(1)}%`,
      positive: results.retention_30day > 0.6,
    },
    {
      label: 'Time to Mastery',
      value: `${results.time_to_mastery} sessions`,
      positive: results.time_to_mastery < results.config.num_sessions,
    },
    {
      label: 'Review Efficiency',
      value: `${results.review_efficiency.toFixed(2)}`,
      positive: results.review_efficiency < 5,
    },
    {
      label: 'Final ECE',
      value: results.ece_trajectory[results.ece_trajectory.length - 1]?.toFixed(3) || 'N/A',
      positive: (results.ece_trajectory[results.ece_trajectory.length - 1] || 1) < 0.1,
    },
  ];
  
  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-label">{metric.label}</div>
          <div className={`metric-value ${metric.positive ? 'positive' : ''}`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsDisplay;
```

## 6.8 src/components/CalibrationChart.tsx

```tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CalibrationChartProps {
  title: string;
  data: Array<Record<string, number>>;
  dataKeys: string[];
  colors: string[];
}

const CalibrationChart: React.FC<CalibrationChartProps> = ({
  title,
  data,
  dataKeys,
  colors,
}) => {
  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="session"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CalibrationChart;
```

## 6.9 src/components/ResponseHistory.tsx

```tsx
import React from 'react';
import { SessionData } from '../types';

interface ResponseHistoryProps {
  sessionData: SessionData[];
}

const ResponseHistory: React.FC<ResponseHistoryProps> = ({ sessionData }) => {
  // Show last 10 sessions
  const recentSessions = sessionData.slice(-10);
  
  return (
    <div className="card">
      <h3 className="card-title">Session History (Last 10)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="response-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Items</th>
              <th>Correct</th>
              <th>Accuracy</th>
              <th>Mean Conf.</th>
              <th>Type 1</th>
              <th>Type 2</th>
              <th>Scaffolds</th>
              <th>Mean K*</th>
              <th>ECE</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.map((session) => {
              const accuracy = session.correct_count / session.items_reviewed;
              return (
                <tr key={session.session_number}>
                  <td>{session.session_number + 1}</td>
                  <td>{session.items_reviewed}</td>
                  <td>{session.correct_count}</td>
                  <td>
                    <span className={`badge ${accuracy > 0.7 ? 'badge-success' : 'badge-warning'}`}>
                      {(accuracy * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>{(session.mean_confidence * 100).toFixed(0)}%</td>
                  <td>{session.type1_count}</td>
                  <td>{session.type2_count}</td>
                  <td>{session.scaffolds_delivered}</td>
                  <td>{session.mean_K_star.toFixed(2)}</td>
                  <td>{session.ece.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResponseHistory;
```

---

# 7. Tests

## 7.1 tests/responseGenerator.test.ts

```typescript
import { generateCorrectness, generateConfidence, generateResponseTime } from '../src/simulation/responseGenerator';
import { SeededRandom } from '../src/utils/random';

describe('Response Generator', () => {
  const random = new SeededRandom(12345);
  
  beforeEach(() => {
    random.setSeed(12345);
  });
  
  describe('generateCorrectness', () => {
    it('should generate correct responses more often with high knowledge', () => {
      let correctCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (generateCorrectness(0.9, 0.1, 0.2, random)) correctCount++;
      }
      // P(correct|K*=0.9) = 0.9 * 0.9 + 0.2 * 0.1 = 0.83
      expect(correctCount / 1000).toBeCloseTo(0.83, 1);
    });
    
    it('should generate incorrect responses more often with low knowledge', () => {
      let correctCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (generateCorrectness(0.1, 0.1, 0.2, random)) correctCount++;
      }
      // P(correct|K*=0.1) = 0.9 * 0.1 + 0.2 * 0.9 = 0.27
      expect(correctCount / 1000).toBeCloseTo(0.27, 1);
    });
  });
  
  describe('generateConfidence', () => {
    it('should generate higher confidence with overconfidence bias', () => {
      const confidences: number[] = [];
      for (let i = 0; i < 100; i++) {
        confidences.push(generateConfidence(0.5, 0.2, 0.1, random));
      }
      const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      expect(mean).toBeGreaterThan(0.6); // K* + β* = 0.7
    });
    
    it('should generate lower confidence with underconfidence bias', () => {
      const confidences: number[] = [];
      for (let i = 0; i < 100; i++) {
        confidences.push(generateConfidence(0.5, -0.2, 0.1, random));
      }
      const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      expect(mean).toBeLessThan(0.4); // K* + β* = 0.3
    });
    
    it('should clip confidence to [0, 1]', () => {
      for (let i = 0; i < 100; i++) {
        const c = generateConfidence(0.9, 0.3, 0.2, random);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('generateResponseTime', () => {
    it('should generate faster responses with high knowledge', () => {
      const highK: number[] = [];
      const lowK: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        highK.push(generateResponseTime(0.9, 3, 2, 0.5, random));
        lowK.push(generateResponseTime(0.1, 3, 2, 0.5, random));
      }
      
      const highMean = highK.reduce((a, b) => a + b, 0) / highK.length;
      const lowMean = lowK.reduce((a, b) => a + b, 0) / lowK.length;
      
      expect(highMean).toBeLessThan(lowMean);
    });
  });
});
```

## 7.2 tests/scoringModule.test.ts

```typescript
import {
  brierScore,
  aggregateBrierScore,
  expectedCalibrationError,
  detectMiscalibration,
} from '../src/calibration/scoringModule';
import { Response, CalibrationType } from '../src/types';

describe('Calibration Scoring Module', () => {
  describe('brierScore', () => {
    it('should return 0 for perfect prediction (correct with 100% confidence)', () => {
      expect(brierScore(1.0, true)).toBe(0);
    });
    
    it('should return 0 for perfect prediction (incorrect with 0% confidence)', () => {
      expect(brierScore(0.0, false)).toBe(0);
    });
    
    it('should return 1 for worst prediction (incorrect with 100% confidence)', () => {
      expect(brierScore(1.0, false)).toBe(1);
    });
    
    it('should return 0.25 for 50% confidence on correct answer', () => {
      expect(brierScore(0.5, true)).toBe(0.25);
    });
  });
  
  describe('aggregateBrierScore', () => {
    it('should return average Brier score', () => {
      const responses: Response[] = [
        { item_id: '1', correctness: true, confidence: 1.0, response_time: 2, timestamp: new Date() },
        { item_id: '2', correctness: false, confidence: 0.0, response_time: 2, timestamp: new Date() },
      ];
      expect(aggregateBrierScore(responses)).toBe(0);
    });
  });
  
  describe('expectedCalibrationError', () => {
    it('should return 0 for perfectly calibrated responses', () => {
      // Create responses where confidence = accuracy in each bin
      const responses: Response[] = [];
      for (let i = 0; i < 100; i++) {
        const confidence = (i % 10) / 10 + 0.05;
        const correctness = Math.random() < confidence;
        responses.push({
          item_id: `${i}`,
          correctness,
          confidence,
          response_time: 2,
          timestamp: new Date(),
        });
      }
      // ECE should be relatively low for many responses
      const ece = expectedCalibrationError(responses);
      expect(ece).toBeLessThan(0.2);
    });
  });
  
  describe('detectMiscalibration', () => {
    it('should detect overconfidence', () => {
      const responses: Response[] = Array(100).fill(null).map((_, i) => ({
        item_id: `${i}`,
        correctness: i < 50, // 50% accuracy
        confidence: 0.8,    // 80% confidence
        response_time: 2,
        timestamp: new Date(),
      }));
      expect(detectMiscalibration(responses)).toBe(CalibrationType.OVERCONFIDENT);
    });
    
    it('should detect underconfidence', () => {
      const responses: Response[] = Array(100).fill(null).map((_, i) => ({
        item_id: `${i}`,
        correctness: i < 80, // 80% accuracy
        confidence: 0.5,    // 50% confidence
        response_time: 2,
        timestamp: new Date(),
      }));
      expect(detectMiscalibration(responses)).toBe(CalibrationType.UNDERCONFIDENT);
    });
  });
});
```

## 7.3 tests/forgettingModel.test.ts

```typescript
import {
  applyForgetting,
  optimalReviewTime,
  calculateRetention,
} from '../src/memory/forgettingModel';

describe('Forgetting Model', () => {
  describe('applyForgetting', () => {
    it('should return same value for 0 time elapsed', () => {
      expect(applyForgetting(0.8, 0.1, 0)).toBe(0.8);
    });
    
    it('should decay knowledge over time', () => {
      const K_initial = 0.9;
      const K_after = applyForgetting(K_initial, 0.1, 7);
      expect(K_after).toBeLessThan(K_initial);
    });
    
    it('should decay faster with higher lambda', () => {
      const K_initial = 0.9;
      const K_slow = applyForgetting(K_initial, 0.05, 7);
      const K_fast = applyForgetting(K_initial, 0.15, 7);
      expect(K_fast).toBeLessThan(K_slow);
    });
    
    it('should follow exponential decay formula', () => {
      const K_initial = 1.0;
      const lambda = 0.1;
      const t = 10;
      const expected = Math.exp(-lambda * t);
      expect(applyForgetting(K_initial, lambda, t)).toBeCloseTo(expected, 5);
    });
  });
  
  describe('optimalReviewTime', () => {
    it('should return 0 if knowledge is already below threshold', () => {
      expect(optimalReviewTime(0.5, 0.1, 0.7)).toBe(0);
    });
    
    it('should return correct time for knowledge to decay to threshold', () => {
      // K* = 1.0, threshold = 0.5, lambda = 0.1
      // 0.5 = 1.0 * e^(-0.1 * t)
      // t = -ln(0.5) / 0.1 ≈ 6.93
      const t = optimalReviewTime(1.0, 0.1, 0.5);
      expect(t).toBeCloseTo(6.93, 1);
    });
  });
  
  describe('calculateRetention', () => {
    it('should return high retention for high knowledge', () => {
      const retention = calculateRetention(0.9, 0.1, 1);
      expect(retention).toBeGreaterThan(0.8);
    });
    
    it('should return lower retention over longer delays', () => {
      const K_star = 0.8;
      const lambda = 0.1;
      const ret1 = calculateRetention(K_star, lambda, 1);
      const ret7 = calculateRetention(K_star, lambda, 7);
      const ret30 = calculateRetention(K_star, lambda, 30);
      
      expect(ret1).toBeGreaterThan(ret7);
      expect(ret7).toBeGreaterThan(ret30);
    });
  });
});
```

---

# 8. Setup Instructions

## How to Set Up the Project

1. **Create project folder:**
   ```bash
   mkdir calibrateme
   cd calibrateme
   ```

2. **Initialize npm and install dependencies:**
   ```bash
   npm init -y
   npm install react react-dom recharts zustand
   npm install -D typescript vite @vitejs/plugin-react @types/react @types/react-dom jest ts-jest @types/jest
   ```

3. **Create folder structure:**
   ```bash
   mkdir -p src/{types,simulation,calibration,bkt,memory,dualProcess,scheduler,scaffolding,profiles,baselines,store,components,utils}
   mkdir tests
   ```

4. **Copy each file from this document to its corresponding location**

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Run tests:**
   ```bash
   npm test
   ```

---

# Quick Reference

## Key Files by Task

| Task | Primary File(s) |
|------|----------------|
| Task 8 (Types) | `src/types/index.ts` |
| Task 9 (Response Gen) | `src/simulation/responseGenerator.ts` |
| Task 10 (Calibration) | `src/calibration/scoringModule.ts` |
| Task 11 (BKT) | `src/bkt/beliefUpdateEngine.ts` |
| Task 12 (Forgetting) | `src/memory/forgettingModel.ts` |
| Task 13 (Dual-Process) | `src/dualProcess/classifier.ts` |
| Task 14 (Scheduler) | `src/scheduler/calibrationAwareScheduler.ts` |
| Task 15 (Scaffolding) | `src/scaffolding/adaptiveScaffolding.ts` |
| Task 16 (Integration) | `src/simulation/simulationEngine.ts` |
| Task 17 (Profiles) | `src/profiles/learnerProfiles.ts` |
| Task 18 (Baselines) | `src/baselines/*.ts` |

## Key Equations Implemented

| Equation | Location | Function |
|----------|----------|----------|
| Eq. 1 (BKT Update) | `beliefUpdateEngine.ts` | `updateBelief()` |
| Eq. 2 (Learning) | `forgettingModel.ts` | `applyLearning()` |
| Eq. 3 (Forgetting) | `forgettingModel.ts` | `applyForgetting()` |
| Eq. 4 (Correctness) | `responseGenerator.ts` | `generateCorrectness()` |
| Eq. 5 (Confidence) | `responseGenerator.ts` | `generateConfidence()` |
| Eq. 6 (RT) | `responseGenerator.ts` | `generateResponseTime()` |
| Eq. 7 (Scaffolding) | `adaptiveScaffolding.ts` | `applyScaffoldingEffect()` |

---

*Document created: Feb 8, 2026*
*For: CS 6795 CalibrateMe Project*
*Total lines of code: ~3000+*
