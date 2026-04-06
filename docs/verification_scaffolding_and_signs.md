# Verification: β* Sign Convention and Scaffolding Functionality

## Question 1: Sign convention for β*

### 1a. Confidence generation from K* and β*

From `src/simulation/responseGenerator.ts`, lines 27–35:

```ts
export function generateConfidence(
  K_star: number,
  beta_star: number,
  noise_std: number,
  random: SeededRandom
): number {
  const epsilon_c = random.randomNormal(0, noise_std);
  return clip(K_star + beta_star + epsilon_c, 0, 1);
}
```

Because confidence is computed as `K_star + beta_star + epsilon_c`, a positive `beta_star` produces confidence **above** `K*`, and a negative `beta_star` produces confidence **below** `K*`.

### 1b. β* values for core profiles

From `src/profiles/learnerProfiles.ts`:

```ts
  'Low-Over': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: 0.25,
  },
```
(line 21–27)

```ts
  'Med-Over': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: 0.20,
  },
```
(line 42–48)

```ts
  'High-Over': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.OVERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: 0.15,
  },
```
(line 63–69)

```ts
  'Low-Under': {
    ability: AbilityLevel.LOW,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.10,
    lambda: 0.15,
    beta_star: -0.20,
  },
```
(line 28–34)

```ts
  'Med-Under': {
    ability: AbilityLevel.MEDIUM,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.20,
    lambda: 0.10,
    beta_star: -0.15,
  },
```
(line 49–55)

```ts
  'High-Under': {
    ability: AbilityLevel.HIGH,
    calibration: CalibrationType.UNDERCONFIDENT,
    alpha: 0.30,
    lambda: 0.05,
    beta_star: -0.10,
  },
```
(line 70–76)

Summary of raw values:

| Profile | β* |
|---|---|
| Low-Over | +0.25 |
| Med-Over | +0.20 |
| High-Over | +0.15 |
| Low-Under | -0.20 |
| Med-Under | -0.15 |
| High-Under | -0.10 |

### 1c. Conclusion — sign convention

**Confirmed: In this codebase, OVERCONFIDENT profiles have positive β* and produce confidence values above their true knowledge state (K\*).**

---

## Question 2: Does scaffolding actually do anything?

### 2a. Call site of `applyScaffoldingEffect()` inside the simulation loop

`applyScaffoldingEffect` is invoked indirectly via `AdaptiveScaffoldingManager.processResponse()`. The call site inside the main simulation loop is in `src/simulation/simulationEngine.ts`, lines 247–259:

```ts
      // Apply scaffolding (CalibrateMe only)
      if (effectiveConfig.enable_scaffolding && effectiveConfig.scheduler_type === SchedulerType.CALIBRATEME) {
        const scaffoldResult = scaffoldingManager.processResponse(
          processedResponse,
          systemBelief.beta_hat,
          learner.true_state
        );

        if (scaffoldResult.scaffold !== ScaffoldType.NONE) {
          scaffoldsDelivered++;
          learner.true_state.beta_star = scaffoldResult.updated_beta_star;
        }
      }
```

The underlying `applyScaffoldingEffect()` is called inside that manager, in `src/scaffolding/adaptiveScaffolding.ts` line 155:

```ts
      const updated_beta_star = applyScaffoldingEffect(learner_state.beta_star, this.delta);
```

So `applyScaffoldingEffect` *is* called from inside the main session/item loop when `enable_scaffolding === true` and `scheduler_type === CALIBRATEME`, and its return value is written back to `learner.true_state.beta_star`.

### 2b. Single-seed trace for Med-Under (seed = 42)

Produced by `scripts/verifyScaffolding.ts`, which calls `runSimulation` twice on a fresh `Med-Under` profile with identical seeds and reads `session_data[i].beta_star_end` after each session.

| session | β*_with_scaffolding | β*_without_scaffolding | difference |
|---:|---:|---:|---:|
| 0 | -0.141135 | -0.150000 | 0.008865 |
| 1 | -0.124946 | -0.150000 | 0.025054 |
| 2 | -0.110614 | -0.150000 | 0.039386 |
| 3 | -0.097925 | -0.150000 | 0.052075 |
| 4 | -0.086693 | -0.150000 | 0.063307 |
| 5 | -0.076748 | -0.150000 | 0.073252 |
| 6 | -0.067945 | -0.150000 | 0.082055 |
| 7 | -0.060151 | -0.150000 | 0.089849 |
| 8 | -0.054898 | -0.150000 | 0.095102 |
| 9 | -0.048601 | -0.150000 | 0.101399 |
| 10 | -0.043026 | -0.150000 | 0.106974 |
| 11 | -0.038091 | -0.150000 | 0.111909 |
| 12 | -0.033721 | -0.150000 | 0.116279 |
| 13 | -0.031729 | -0.150000 | 0.118271 |
| 14 | -0.030777 | -0.150000 | 0.119223 |
| 15 | -0.027246 | -0.150000 | 0.122754 |
| 16 | -0.024121 | -0.150000 | 0.125879 |
| 17 | -0.021354 | -0.150000 | 0.128646 |
| 18 | -0.019489 | -0.150000 | 0.130511 |
| 19 | -0.017254 | -0.150000 | 0.132746 |
| 20 | -0.015747 | -0.150000 | 0.134253 |
| 21 | -0.014816 | -0.150000 | 0.135184 |
| 22 | -0.014372 | -0.150000 | 0.135628 |
| 23 | -0.013523 | -0.150000 | 0.136477 |
| 24 | -0.011971 | -0.150000 | 0.138029 |
| 25 | -0.010598 | -0.150000 | 0.139402 |
| 26 | -0.009383 | -0.150000 | 0.140617 |
| 27 | -0.008563 | -0.150000 | 0.141437 |
| 28 | -0.007581 | -0.150000 | 0.142419 |
| 29 | -0.007581 | -0.150000 | 0.142419 |

The two columns diverge starting at session 0 and continue to diverge monotonically: the "without" column stays fixed at the initial -0.15, while the "with" column decays in magnitude toward 0.

### 2c. `scaffolds_per_session` under the matched-scaffold "with" condition

Computed with the same configuration as `runMatchedScaffoldComparison` (CalibrateMe scheduler, `enable_scaffolding: true`, `enable_dual_process: true`, 30 seeds, `random_seed: seed + 1`), averaging `session_data[i].scaffolds_delivered` across sessions within each run, then taking mean ± sd across seeds:

| profile | scaffolds_per_session_mean | scaffolds_per_session_sd | n_seeds |
|---|---:|---:|---:|
| Med-Under  | 3.3400 | 0.3153 | 30 |
| High-Under | 2.7511 | 0.3492 | 30 |

For reference, `results/crammer_stress_test.csv` reports `Crammer, Full CalibrateMe, scaffolds_per_session_mean = 1.7000, sd = 0.4124`.

### 2d. Conclusion — scaffolding functionality

**Scaffolding is a functional component of the simulation for the matched-comparison profiles: β\* diverges session-by-session between the with/without runs at identical seeds, and scaffolds_per_session is substantially non-zero (3.34 for Med-Under, 2.75 for High-Under).**
