# Simulation Environment — Section II-C Reference

This document compiles every configuration value, profile parameter, condition definition, and run count used in the CalibrateMe final-report simulations. All values are traced to specific source files in the repo. No value has been rounded, approximated, or paraphrased.

---

## Section 1 — Full experiment configuration

Source: [`config/experiment_config.json`](../config/experiment_config.json)

```json
{
  "version": "1.0.0",
  "timestamp": "2026-03-12T00:00:00Z",
  "description": "Frozen experiment configuration for IEEE final report",
  "ablation": {
    "seeds": 30,
    "conditions": ["Full CalibrateMe", "No Dual-Process", "No Scaffolding", "Calibration Only", "SM-2 Baseline", "BKT-Only"],
    "core_profiles": ["High-Over", "Med-Over", "Low-Over", "High-Under", "Med-Under", "Low-Under", "High-Well", "Med-Well", "Low-Well"],
    "extended_profiles": ["Extreme-Over", "Extreme-Under", "Fast-Forget-Over", "Noisy-Confidence", "HighAb-Extreme-Over", "Minimal-Bias"]
  },
  "sensitivity": {
    "seeds": 10,
    "profiles": ["Med-Over", "Med-Under", "Med-Well"],
    "parameters": {
      "lambda": [0.03, 0.05, 0.10, 0.15, 0.20],
      "slip_probability": [0.05, 0.10, 0.15, 0.20],
      "guess_probability": [0.10, 0.20, 0.30],
      "confidence_noise_std": [0.05, 0.10, 0.15, 0.20],
      "beta_star": [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30]
    }
  },
  "delta_sweep": {
    "seeds": 15,
    "deltas": [0.00, 0.01, 0.02, 0.03, 0.05, 0.08, 0.10, 0.15],
    "profiles": "all_core"
  },
  "matched_scaffold": {
    "seeds": 30,
    "profiles": "all_core"
  },
  "simulation": {
    "num_items": 100,
    "num_sessions": 30,
    "items_per_session": 20,
    "default_slip": 0.10,
    "default_guess": 0.20,
    "default_confidence_noise": 0.10,
    "default_scaffolding_delta": 0.03
  },
  "analytics_thresholds": {
    "session_break_minutes": 10,
    "regression_threshold_pp": 15,
    "breakout_threshold_pp": 15,
    "good_calibration_ece": 0.10,
    "phase_novice_k_star": 0.40,
    "phase_mastered_k_star": 0.90,
    "phase_plateau_gain_rate": 0.005,
    "phase_min_sessions_for_plateau": 5,
    "automatization_type1_ratio": 0.50,
    "high_effort_rt_multiplier": 1.5,
    "alpha_high": 0.25,
    "alpha_low": 0.15,
    "lambda_low": 0.07,
    "lambda_high": 0.12,
    "beta_well_calibrated": 0.08,
    "beta_severe": 0.18,
    "classification_overconfident": 0.10,
    "classification_underconfident": -0.10
  },
  "threshold_sensitivity_sweeps": {
    "session_break_minutes": [5, 10, 15, 20],
    "regression_threshold_pp": [10, 15, 20],
    "good_calibration_ece": [0.05, 0.08, 0.10, 0.12, 0.15],
    "automatization_type1_ratio": [0.40, 0.50, 0.60],
    "high_effort_rt_multiplier": [1.25, 1.50, 1.75],
    "phase_mastered_k_star": [0.85, 0.90, 0.95],
    "beta_well_calibrated": [0.05, 0.08, 0.10, 0.12]
  }
}
```

---

## Section 2 — Core learner profiles (9 profiles)

Source: [`src/profiles/learnerProfiles.ts`](../src/profiles/learnerProfiles.ts) lines 20–83 (the `PROFILE_PARAMS` record).

The `LearnerProfileParams` interface defines `alpha`, `lambda`, `beta_star`, and the optional overrides `initial_k_star`, `rt_base`, `rt_gamma`, `confidence_noise_std`, `beta_star_vocab`, and `beta_star_grammar`. None of the 9 core profiles override `slip_probability`, `guess_probability`, `confidence_noise_std`, `rt_base`, or `rt_gamma`; they inherit the defaults from Section 5.

| Profile | Ability | Calibration | α | λ | β* | σ_c (override) | Slip (override) | Guess (override) | Other overrides |
|---|---|---|---|---|---|---|---|---|---|
| Low-Over    | LOW    | OVERCONFIDENT   | 0.10 | 0.15 |  0.25 | — | — | — | — |
| Low-Under   | LOW    | UNDERCONFIDENT  | 0.10 | 0.15 | -0.20 | — | — | — | — |
| Low-Well    | LOW    | WELL_CALIBRATED | 0.10 | 0.15 |  0.00 | — | — | — | — |
| Med-Over    | MEDIUM | OVERCONFIDENT   | 0.20 | 0.10 |  0.20 | — | — | — | — |
| Med-Under   | MEDIUM | UNDERCONFIDENT  | 0.20 | 0.10 | -0.15 | — | — | — | — |
| Med-Well    | MEDIUM | WELL_CALIBRATED | 0.20 | 0.10 |  0.00 | — | — | — | — |
| High-Over   | HIGH   | OVERCONFIDENT   | 0.30 | 0.05 |  0.15 | — | — | — | — |
| High-Under  | HIGH   | UNDERCONFIDENT  | 0.30 | 0.05 | -0.10 | — | — | — | — |
| High-Well   | HIGH   | WELL_CALIBRATED | 0.30 | 0.05 |  0.00 | — | — | — | — |

Two additional per-profile quantities are derived inside `createLearnerProfile()` (lines 181–226) for every profile, including all 9 core ones:

- `alpha_err = params.alpha * 0.5` (learning rate on errors)
- `initial K_star = 0.3` (unless `params.initial_k_star` is set)
- `system_belief.K_hat = initial K_star`
- `system_belief.beta_hat = 0`
- `system_belief.confidence_interval = 0.2`
- Per-item `difficulty = (i % 3) * 0.33 + 0.17` with `ItemType` alternating `VOCABULARY`/`GRAMMAR`

---

## Section 3 — Extended profiles

Source: [`src/profiles/learnerProfiles.ts`](../src/profiles/learnerProfiles.ts) lines 85–175. Same conventions as Section 2: a dash means the profile does not override the default from Section 5.

### 3.1 Six extended boundary profiles (lines 85–126)

| Profile | Ability | Calibration | α | λ | β* | σ_c (override) | Slip (override) | Guess (override) | Other overrides |
|---|---|---|---|---|---|---|---|---|---|
| Extreme-Over         | MEDIUM | OVERCONFIDENT   | 0.15 | 0.12 |  0.35 | — | — | — | — |
| Extreme-Under        | MEDIUM | UNDERCONFIDENT  | 0.15 | 0.12 | -0.30 | — | — | — | — |
| Fast-Forget-Over     | MEDIUM | OVERCONFIDENT   | 0.20 | 0.20 |  0.25 | — | — | — | — |
| Noisy-Confidence     | MEDIUM | OVERCONFIDENT   | 0.20 | 0.10 |  0.15 | — | — | — | — |
| HighAb-Extreme-Over  | HIGH   | OVERCONFIDENT   | 0.30 | 0.05 |  0.30 | — | — | — | — |
| Minimal-Bias         | MEDIUM | WELL_CALIBRATED | 0.20 | 0.10 |  0.05 | — | — | — | — |

> Note: the profile name `Noisy-Confidence` does **not** set a different `confidence_noise_std` in `PROFILE_PARAMS`. It inherits the default σ_c = 0.1.

### 3.2 Crammer profile (lines 128–138)

| Profile | Ability | Calibration | α | λ | β* | σ_c (override) | Slip (override) | Guess (override) | Other overrides |
|---|---|---|---|---|---|---|---|---|---|
| Crammer | MEDIUM | OVERCONFIDENT | 0.10 | 0.25 | 0.30 | 0.08 | — | — | `initial_k_star = 0.5`, `rt_base = 2.0`, `rt_gamma = 1.5` |

### 3.3 Domain-asymmetric profiles (lines 140–175)

All four set per-domain overrides via `beta_star_vocab` and `beta_star_grammar`. None override slip, guess, σ_c, rt_base, or rt_gamma.

| Profile | Ability | Calibration | α | λ | Global β* | β*_vocab | β*_grammar | Other overrides |
|---|---|---|---|---|---|---|---|---|
| Vocab-Over-Grammar-Under | MEDIUM | OVERCONFIDENT   | 0.20 | 0.10 | 0.05 |  0.25 | -0.15 | — |
| Vocab-Under-Grammar-Over | MEDIUM | UNDERCONFIDENT  | 0.20 | 0.10 | 0.05 | -0.15 |  0.25 | — |
| Vocab-Well-Grammar-Over  | HIGH   | OVERCONFIDENT   | 0.25 | 0.08 | 0.10 |  0.00 |  0.20 | — |
| Both-Over-Asymmetric     | LOW    | OVERCONFIDENT   | 0.15 | 0.12 | 0.20 |  0.30 |  0.10 | — |

---

## Section 4 — Scheduling conditions

Source: [`src/simulation/ablationRunner.ts`](../src/simulation/ablationRunner.ts) lines 49–94 (`DEFAULT_CONDITIONS`). Names are the exact string literals in `condition.name` and also match the column values in `results/ablation_core_profiles.csv`.

1. **`Full CalibrateMe`** — `scheduler_type = CALIBRATEME`, `enable_scaffolding = true`, `enable_dual_process = true`; all three CalibrateMe modules (calibration-aware interval adjustment, dual-process RT×confidence classifier, adaptive scaffolding) are on.
2. **`No Dual-Process`** — `scheduler_type = CALIBRATEME`, `enable_scaffolding = true`, `enable_dual_process = false`; disables the fluency-weighted response classifier while keeping calibration adjustment and scaffolding.
3. **`No Scaffolding`** — `scheduler_type = CALIBRATEME`, `enable_scaffolding = false`, `enable_dual_process = true`; disables the adaptive scaffolding layer while keeping calibration adjustment and the dual-process classifier.
4. **`Calibration Only`** — `scheduler_type = CALIBRATEME`, `enable_scaffolding = false`, `enable_dual_process = false`; leaves only the calibration-aware interval adjustment and coverage-aware selection; both scaffolding and dual-process are off.
5. **`SM-2 Baseline`** — `scheduler_type = SM2`; SuperMemo-2 interval scheduling with no BKT, no calibration term, no scaffolding, no dual-process classifier.
6. **`BKT-Only`** — `scheduler_type = BKT_ONLY`; Bayesian Knowledge Tracing with grid-posterior updates but no calibration-aware interval adjustment, no scaffolding, and no dual-process classifier.

---

## Section 5 — Simulation defaults

Source: [`src/types/index.ts`](../src/types/index.ts) lines 217–234 (`DEFAULT_SIMULATION_CONFIG`). These are the values used whenever a profile does not override them.

| Constant | Value | Notes / source field |
|---|---|---|
| Number of items | 100 | `num_items` |
| Number of sessions | 30 | `num_sessions` |
| Items per session | 20 | `items_per_session` |
| Default scheduler type | `SchedulerType.CALIBRATEME` | `scheduler_type` |
| Default `enable_scaffolding` | `true` | — |
| Default `enable_dual_process` | `true` | — |
| Default `enable_difficulty_sequencing` | `false` | — |
| Default `enable_domain_split` | `false` | — |
| Default `random_seed` | `null` | — |
| Default slip probability (s) | 0.1 | `slip_probability` |
| Default guess probability (g) | 0.2 | `guess_probability` |
| Default confidence noise std (σ_c) | 0.1 | `confidence_noise_std` |
| Default response-time noise std (σ_τ) | 0.5 | `rt_noise_std` |
| Default response-time base (τ_base) | 3.0 (seconds) | `rt_base` |
| Default RT–knowledge strength (γ) | 2.0 | `rt_gamma` |
| Default scaffolding dose (δ) | 0.03 | `scaffolding_delta` |

Additional constants used by the analysis pipeline (source: `config/experiment_config.json`, also reflected in the `analytics_thresholds` block in Section 1):

- Session break minutes: 10
- Good-calibration ECE threshold: 0.10
- Novice phase K* ceiling: 0.40
- Mastered phase K* threshold: 0.90
- Plateau gain rate threshold: 0.005
- Minimum sessions for plateau detection: 5
- Type-1 automatization ratio threshold: 0.50
- High-effort RT multiplier: 1.5
- α_high / α_low: 0.25 / 0.15
- λ_low / λ_high: 0.07 / 0.12
- β_well_calibrated: 0.08
- β_severe: 0.18
- Classification thresholds (overconfident / underconfident): +0.10 / −0.10

Per-profile overrides observed in the repo (i.e., values that replace these defaults when the profile is active):
- `Crammer` overrides `initial_k_star = 0.5`, `rt_base = 2.0`, `rt_gamma = 1.5`, `confidence_noise_std = 0.08` (source: `src/profiles/learnerProfiles.ts:128-138`).
- The four domain-asymmetric profiles override `beta_star_vocab` and `beta_star_grammar` (source: `src/profiles/learnerProfiles.ts:140-175`).
- No core or extended (non-Crammer) profile overrides any global simulation constant.

---

## Section 6 — Run counts

Sources: [`scripts/runAllAnalyses.ts`](../scripts/runAllAnalyses.ts) lines 42–308, [`src/simulation/sensitivityAnalysis.ts`](../src/simulation/sensitivityAnalysis.ts) lines 47–52 (`DEFAULT_SWEEPS`), [`config/experiment_config.json`](../config/experiment_config.json), and [`results/summary.json`](../results/summary.json).

### 6.1 Seeds per experiment

| Experiment | Seeds per condition | Source |
|---|---|---|
| Main ablation (core + extended) | **30** | `runAllAnalyses.ts:42` (`ABLATION_SEEDS = 30`), `experiment_config.json → ablation.seeds` |
| Sensitivity analysis (every parameter value × profile × scheduler) | **10** | `runAllAnalyses.ts:43` (`SENSITIVITY_SEEDS = 10`), `experiment_config.json → sensitivity.seeds` |
| δ dose-response sweep | **15** | `runAllAnalyses.ts:44` (`DELTA_SEEDS = 15`), `experiment_config.json → delta_sweep.seeds` |
| Matched scaffold comparison | **30** | `runAllAnalyses.ts:290` (`MATCHED_SEEDS = 30`), `experiment_config.json → matched_scaffold.seeds` |

### 6.2 Total runs (explicit sums)

**Ablation — core profiles.** 9 core profiles × 6 conditions × 30 seeds = **1,620**

**Ablation — extended profiles.** 6 extended profiles × 6 conditions × 30 seeds = **1,080**

**Sensitivity analysis.** The runner performs CalibrateMe **and** SM-2 passes for every (value, profile) pair (`runAllAnalyses.ts:261`: `sweep.values.length * SENSITIVITY_PROFILES.length * 2 * SENSITIVITY_SEEDS`). With 3 sensitivity profiles and 10 seeds:

- `lambda` (5 values) × 3 × 2 × 10 = 300
- `slip_probability` (4 values) × 3 × 2 × 10 = 240
- `guess_probability` (3 values) × 3 × 2 × 10 = 180
- `confidence_noise_std` (4 values) × 3 × 2 × 10 = 240
- `beta_star` (7 values) × 3 × 2 × 10 = 420
- Sensitivity subtotal = 300 + 240 + 180 + 240 + 420 = **1,380**

**δ dose-response sweep.** 8 δ values × 9 core profiles × 15 seeds = **1,080**

**Matched scaffold comparison.** 9 core profiles × 30 seeds × 2 conditions (with/without scaffold) = **540**

**Grand total across all experiments:**

```
   1,620   (ablation, core)
+  1,080   (ablation, extended)
+  1,380   (sensitivity)
+  1,080   (δ dose-response)
+    540   (matched scaffold)
---------
=  5,700   simulation runs
```

> Cross-check: `results/summary.json` records `"total_runs": 5160` for the run completed at `2026-03-12T06:59:19.687Z`. That figure equals 1,620 + 1,080 + 1,380 + 1,080 = **5,160** and **excludes** the matched-scaffold comparison block. The matched-scaffold runner is present in `scripts/runAllAnalyses.ts:296-308` and in `experiment_config.json`, but its 540 runs were not part of the 2026-03-12 summary. Rerunning `scripts/runAllAnalyses.ts` will produce the full 5,700-run total and write `results/matched_scaffold_comparison.csv`.
