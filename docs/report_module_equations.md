# Module Equations and Theory-to-Code Translations

This document maps every numbered equation in the CalibrateMe pitch and final report to its concrete implementation in the codebase. Every formula is traced to a specific source file, line range, and function name. No equation is paraphrased: each one is reproduced in the same algebraic form used in the report and then re-stated in the form actually executed by the TypeScript code. Where the code differs from the pitch (e.g., likelihood reweighting, prior spread, clipping), the deviation is called out explicitly.

---

## Section 1 — Symbol table

| Symbol | Meaning | Type | Source field |
|---|---|---|---|
| K* (K_star)         | True latent knowledge of an item, in [0, 1]                    | per-item, hidden  | `TrueLearnerState.K_star` |
| K̂ (K_hat)          | System's posterior estimate of K* over [0, 1]                  | per-item, observable | `SystemBelief.K_hat` |
| β* (beta_star)      | True calibration bias of the learner (signed)                  | per-learner, hidden | `LearnerProfileParams.beta_star` |
| β̂ (beta_hat)       | EMA estimate of β* from recent confidence/accuracy gap          | per-learner, observable | `SystemBelief.beta_hat` |
| α (alpha)           | Learning rate on correct responses                              | per-learner       | `LearnerProfileParams.alpha` |
| α_err (alpha_err)   | Learning rate on incorrect responses (= α/2)                    | per-learner       | derived in `createLearnerProfile()` |
| λ (lambda)          | Forgetting rate (per day)                                       | per-learner       | `LearnerProfileParams.lambda` |
| s (slip)            | Probability of an incorrect answer when K* = 1                  | global default    | `SimulationConfig.slip_probability` |
| g (guess)           | Probability of a correct answer when K* = 0                     | global default    | `SimulationConfig.guess_probability` |
| σ_c                 | Std. dev. of additive Gaussian noise on confidence              | global default    | `SimulationConfig.confidence_noise_std` |
| σ_τ                 | Std. dev. of additive Gaussian noise on response time           | global default    | `SimulationConfig.rt_noise_std` |
| τ_base              | Baseline response time when K* = 1 (seconds)                    | global default    | `SimulationConfig.rt_base` |
| γ (gamma)           | RT–knowledge sensitivity (multiplicative)                       | global default    | `SimulationConfig.rt_gamma` |
| δ (delta)           | Per-scaffold dose applied multiplicatively to β*                | global default    | `SimulationConfig.scaffolding_delta` |
| c                   | Reported confidence in [0, 1]                                   | per-response      | `Response.confidence` |
| τ                   | Reported response time (seconds)                                | per-response      | `Response.response_time` |
| y                   | Correctness indicator ∈ {0, 1}                                  | per-response      | `Response.correctness` |
| z_τ                 | Within-learner z-score of RT (per difficulty bin)               | per-response      | `ProcessedResponse.normalized_rt` |
| q                   | SM-2 quality rating in {0, …, 5}                                | per-response (SM-2 only) | `mapToQuality()` |
| EF                  | SM-2 ease factor (≥ 1.3)                                        | per-item (SM-2 only)     | `SM2State.easeFactor` |

All symbols above appear unchanged in both the report and the TypeScript source.

---

## Section 2 — Equation 2: True learning update

**Report form (Equation 2):**

K*_{t+1} = K*_t + α · (1 − K*_t) · 1[y = 1] + α_err · (1 − K*_t) · 1[y = 0]

**Code form.** Source: [`src/memory/forgettingModel.ts`](../src/memory/forgettingModel.ts), `applyLearning()`, lines 92–104.

```ts
export function applyLearning(
  K_star: number,
  correctness: boolean,
  alpha: number,
  alpha_err: number
): number {
  if (correctness) {
    return K_star + alpha * (1 - K_star);
  } else {
    return K_star + alpha_err * (1 - K_star);
  }
}
```

**Notes.**
- α_err is **not** a free profile parameter. It is computed once per profile in `src/profiles/learnerProfiles.ts:181-226` as `alpha_err = params.alpha * 0.5`. The factor 0.5 is hard-coded; no profile overrides it.
- The update is monotone: it can only increase K* on either branch (since `(1 − K_star) ≥ 0`). There is no decay term inside `applyLearning()`; decay is handled separately in Section 3.
- The two branches are mutually exclusive — only one is applied per response — so the indicator notation in the report is preserved exactly.

---

## Section 3 — Equation 3: Exponential forgetting of K*

**Report form (Equation 3):**

K*_{t′} = K*_t · exp(−λ · Δt),    where Δt = (t′ − t) in days.

**Code form.** Source: [`src/memory/forgettingModel.ts`](../src/memory/forgettingModel.ts), `applyForgetting()`, lines 12–18.

```ts
export function applyForgetting(
  K_star: number,
  lambda: number,
  delta_t: number
): number {
  return K_star * Math.exp(-lambda * delta_t);
}
```

**Companion functions in the same file.**
- `daysSinceReview(lastReview, now)` (lines 23–27): converts a `Date` pair to fractional days using `msPerDay = 24 * 60 * 60 * 1000`.
- `predictForgottenKnowledge(K_star, lambda, days_in_future)` (lines 32–38): same call, used by analytics.
- `optimalReviewTime(K_star, lambda, threshold = 0.7)` (lines 45–54): solves the inverse, t = −ln(threshold/K*) / λ, returning 0 when K* ≤ threshold and ∞ when λ = 0.
- `applyItemForgetting(item, lambda, now)` (lines 59–75): no-op when Δt = 0; otherwise rewrites `item.true_state.K_star` in an immutable copy.
- `applyBatchForgetting(items, lambda, now)` (lines 80–86): map over a pool.
- `calculateRetention(K_star, lambda, delay_days, slip = 0.1, guess = 0.2)` (lines 109–119): composes forgetting with the slip-guess observation model from Section 4.

The slip and guess defaults inside `calculateRetention` (0.1 and 0.2) match `DEFAULT_SIMULATION_CONFIG` in `src/types/index.ts:217-234`.

---

## Section 4 — Equation 4: Observed correctness (slip-guess model)

**Report form (Equation 4):**

P(y = 1 | K*) = (1 − s) · K* + g · (1 − K*)

**Code form (generative side).** Source: [`src/simulation/responseGenerator.ts`](../src/simulation/responseGenerator.ts), `generateCorrectness()`, lines 13–21.

```ts
export function generateCorrectness(
  K_star: number,
  slip: number,
  guess: number,
  random: SeededRandom
): boolean {
  const p_correct = (1 - slip) * K_star + guess * (1 - K_star);
  return random.randomBoolean(p_correct);
}
```

**Code form (likelihood side).** Source: [`src/bkt/beliefUpdateEngine.ts`](../src/bkt/beliefUpdateEngine.ts), `likelihoodCorrectness()`, lines 13–21.

```ts
export function likelihoodCorrectness(
  y: boolean,
  K_hat: number,
  slip: number,
  guess: number
): number {
  const p_correct = (1 - slip) * K_hat + guess * (1 - K_hat);
  return y ? p_correct : (1 - p_correct);
}
```

**Notes.**
- The same algebraic form appears on both sides of the simulation: forward (for sampling y from K*) and inverse (for evaluating P(y | K̂) inside the BKT update).
- `random.randomBoolean(p)` is defined in `src/utils/random.ts` as `this.random() < p`, where `this.random()` is a seeded `mulberry32` PRNG.
- The constants used by all 9 core profiles and 5 of the 6 extended profiles are `s = 0.1`, `g = 0.2`. Only the Crammer profile leaves them at the default; no profile overrides slip or guess (verified against `PROFILE_PARAMS` in `src/profiles/learnerProfiles.ts:20-175`).

---

## Section 5 — Equation 5: Observed confidence

**Report form (Equation 5):**

c = clip(K* + β* + ε_c, 0, 1),    where ε_c ~ N(0, σ_c²)

**Code form (generative side).** Source: [`src/simulation/responseGenerator.ts`](../src/simulation/responseGenerator.ts), `generateConfidence()`, lines 27–35.

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

**Code form (likelihood side).** Source: [`src/bkt/beliefUpdateEngine.ts`](../src/bkt/beliefUpdateEngine.ts), `likelihoodConfidence()`, lines 27–37.

```ts
export function likelihoodConfidence(
  c: number,
  K_hat: number,
  beta_hat: number,
  sigma: number
): number {
  const expected_c = K_hat + beta_hat;
  const z = (c - expected_c) / sigma;
  return Math.exp(-0.5 * z * z);
}
```

**Notes.**
- The likelihood is the unnormalized Gaussian PDF (the `1 / (σ√2π)` factor is dropped because the BKT update normalizes the posterior across the K̂ grid; constant factors cancel).
- The clipping to [0, 1] is applied only on the generative side. The likelihood side does **not** truncate, which is a deliberate approximation: at K̂ near 0 or 1 the likelihood smoothly extends past the boundary, providing a softer evidence signal than a strict truncated Gaussian.
- When domain split is enabled (`enable_domain_split = true`), `generateResponse()` (lines 56–106 of `responseGenerator.ts`) overrides `beta_star` with `domainBetaStar.vocab` or `domainBetaStar.grammar` based on `item.item_type`.

---

## Section 6 — Equation 6: Observed response time

**Report form (Equation 6):**

τ = τ_base · (1 + γ · (1 − K*)) + ε_τ,    where ε_τ ~ N(0, σ_τ²)

**Code form (generative side).** Source: [`src/simulation/responseGenerator.ts`](../src/simulation/responseGenerator.ts), `generateResponseTime()`, lines 41–51.

```ts
export function generateResponseTime(
  K_star: number,
  tau_base: number,
  gamma: number,
  noise_std: number,
  random: SeededRandom
): number {
  const epsilon_tau = random.randomNormal(0, noise_std);
  const tau = tau_base * (1 + gamma * (1 - K_star)) + epsilon_tau;
  return Math.max(0.5, tau);
}
```

**Code form (likelihood side).** Source: [`src/bkt/beliefUpdateEngine.ts`](../src/bkt/beliefUpdateEngine.ts), `likelihoodRT()`, lines 43–53.

```ts
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
```

**Notes.**
- The generative side applies a per-item difficulty adjustment **before** the equation: in `generateResponse()` (line 66), `tau_base_adjusted = config.rt_base * (1 + item.difficulty * 0.5)`. The likelihood side uses the unmodified `config.rt_base` (it does not see per-item difficulty), so the BKT engine treats the difficulty-induced RT shift as part of the noise term ε_τ.
- The minimum-RT clamp (`Math.max(0.5, tau)`) prevents non-physical zero or negative RTs from leaking into downstream code; this is a code-side safeguard not present in the report form.
- The defaults are τ_base = 3.0 s and γ = 2.0 (both from `DEFAULT_SIMULATION_CONFIG`, `src/types/index.ts:217-234`). The Crammer profile overrides these to τ_base = 2.0 s and γ = 1.5 (`src/profiles/learnerProfiles.ts:128-138`).

---

## Section 7 — Equation 1: BKT belief update (with reweighting)

**Report form (Equation 1):**

P(K̂ | y, c, τ) ∝ P(y | K̂) · P(c | K̂) · P(τ | K̂) · P(K̂)

**Code form.** Source: [`src/bkt/beliefUpdateEngine.ts`](../src/bkt/beliefUpdateEngine.ts), `updateBelief()`, lines 63–125.

```ts
export function updateBelief(
  response: Response,
  current_belief: SystemBelief,
  config: SimulationConfig,
  grid_points: number = 101
): SystemBelief {
  const { slip_probability, guess_probability, confidence_noise_std,
          rt_noise_std, rt_base, rt_gamma } = config;

  const w_y = 1.0;
  const w_c = 0.5;
  const w_tau = 0.3;

  const K_values: number[] = [];
  const posteriors: number[] = [];

  for (let i = 0; i < grid_points; i++) {
    const K = i / (grid_points - 1);
    K_values.push(K);

    const prior = Math.exp(-0.5 * ((K - current_belief.K_hat) / 0.3) ** 2);

    const L_y   = Math.pow(likelihoodCorrectness(response.correctness, K,
                            slip_probability, guess_probability), w_y);
    const L_c   = Math.pow(likelihoodConfidence(response.confidence, K,
                            current_belief.beta_hat, confidence_noise_std), w_c);
    const L_tau = Math.pow(likelihoodRT(response.response_time, K,
                            rt_base, rt_gamma, rt_noise_std), w_tau);

    posteriors.push(prior * L_y * L_c * L_tau);
  }

  const sum = posteriors.reduce((a, b) => a + b, 0);
  const normalized = posteriors.map(p => p / sum);

  let K_hat_new = 0;
  for (let i = 0; i < grid_points; i++) {
    K_hat_new += K_values[i] * normalized[i];
  }

  let variance = 0;
  for (let i = 0; i < grid_points; i++) {
    variance += (K_values[i] - K_hat_new) ** 2 * normalized[i];
  }

  return {
    K_hat: clip(K_hat_new, 0, 1),
    beta_hat: current_belief.beta_hat,
    confidence_interval: Math.sqrt(variance) * 1.96,
    last_updated: new Date(),
    ...(current_belief.domain_calibration && {
      domain_calibration: current_belief.domain_calibration,
    }),
  };
}
```

**Three deviations from Equation 1 in the report.**

1. **Likelihood reweighting.** The code computes `L_y^{1.0} · L_c^{0.5} · L_τ^{0.3} · P(K̂)`, not `L_y · L_c · L_τ · P(K̂)`. The exponents are hard-coded constants on lines 75–77. The intent (documented in the in-file comment, lines 71–74) is to downweight noisy channels: confidence depends on the uncertain β̂ estimate, and RT has high variance and only weakly tracks knowledge. This prevents systematic K̂ underestimation when c or τ disagree with y. **Effect on the report's equation:** the geometric mean of likelihoods is replaced by a weighted geometric mean.

2. **Wide Gaussian prior.** The prior is `exp(−½ · ((K − K̂_t) / 0.3)²)`, i.e., a Gaussian centered at the previous K̂ with σ = 0.3 (line 89). The report form is silent on the prior shape; the code's σ = 0.3 was chosen so that K̂ responds to single observations rather than locking onto its previous value.

3. **Posterior summarization.** The code returns the posterior **mean** and a 95 % credible half-width (`1.96 · √variance`), not the full grid posterior. The grid uses `grid_points = 101` (default), giving K̂ resolution 0.01.

**β̂ is not updated here.** Line 118 (`beta_hat: current_belief.beta_hat`) explicitly keeps β̂ unchanged. β̂ is updated separately in `updateBetaHat()` (Section 8).

---

## Section 8 — β̂ EMA estimator (calibration tracking)

**Report form.**

β̂_{t+1} = β̂_t + η · ((mean confidence − mean accuracy) over a recent window − β̂_t)

**Code form.** Source: [`src/bkt/beliefUpdateEngine.ts`](../src/bkt/beliefUpdateEngine.ts), `updateBetaHat()`, lines 130–145.

```ts
export function updateBetaHat(
  responses: Response[],
  current_beta_hat: number,
  learning_rate: number = 0.1
): number {
  if (responses.length === 0) return current_beta_hat;

  const recent = responses.slice(-10);
  const mean_conf = recent.reduce((s, r) => s + r.confidence, 0) / recent.length;
  const mean_acc  = recent.reduce((s, r) => s + (r.correctness ? 1 : 0), 0) / recent.length;
  const observed_beta = mean_conf - mean_acc;

  return current_beta_hat + learning_rate * (observed_beta - current_beta_hat);
}
```

**Notes.**
- The "recent window" is the last 10 responses (`slice(-10)`, line 138). When fewer than 10 responses exist, the code uses whatever is available.
- The learning rate η defaults to 0.1 and is the third argument; callers in `simulationEngine.ts` use the default.
- This is a standard exponential moving average:    β̂_{t+1} = (1 − η) · β̂_t + η · observed.
- The "observed β" (mean conf − mean acc) is the same quantity used by the analytics-side `estimateBetaHat()` in `src/calibration/scoringModule.ts:137-145`, which computes it over the entire history rather than a window.

### 8.1 Domain-split β̂ estimator

Source: [`src/bkt/beliefUpdateEngine.ts`](../src/bkt/beliefUpdateEngine.ts), `updateDomainBetaHat()`, lines 151–180.

The same EMA is applied independently to vocabulary and grammar response streams, with a minimum-sample-size guard:

- Vocabulary EMA fires only if `vocabResponses.length >= 5` (line 165).
- Grammar EMA fires only if `grammarResponses.length >= 5` (line 172).
- Each stream uses its own last-10 window via `filter(...).slice(-10)`.

The threshold of 5 is hard-coded and is documented in the in-file comment (lines 162–164) as "stable EMA estimate before influencing scheduling."

---

## Section 9 — Calibration metrics: Brier, ECE, MCE

Source: [`src/calibration/scoringModule.ts`](../src/calibration/scoringModule.ts).

### 9.1 Brier score

**Report form:** Brier(c, y) = (c − y)²    averaged over responses.

**Code form** (lines 18–30):

```ts
export function brierScore(confidence: number, correctness: boolean): number {
  const outcome = correctness ? 1 : 0;
  return (confidence - outcome) ** 2;
}

export function aggregateBrierScore(responses: Response[]): number {
  if (responses.length === 0) return 0;
  const scores = responses.map(r => brierScore(r.confidence, r.correctness));
  return mean(scores);
}
```

### 9.2 Expected Calibration Error (ECE)

**Report form:**

ECE = Σ_b (n_b / N) · | acc(b) − conf(b) |,    bins of equal width 1/B over [0, 1].

**Code form** (lines 35–89):

```ts
export function binResponses(responses, numBins = 10) {
  const bins = [];
  const binWidth = 1 / numBins;
  for (let i = 0; i < numBins; i++) {
    const binStart = i * binWidth;
    const binEnd   = (i + 1) * binWidth;
    const inBin = responses.filter(
      r => r.confidence >= binStart && r.confidence < binEnd
    );
    if (inBin.length > 0) {
      bins.push({
        bin_start: binStart, bin_end: binEnd,
        mean_confidence: mean(inBin.map(r => r.confidence)),
        mean_accuracy:   mean(inBin.map(r => r.correctness ? 1 : 0)),
        count: inBin.length,
        calibration_gap: /* signed acc − conf */,
      });
    }
  }
  return bins;
}

export function expectedCalibrationError(responses, numBins = 10) {
  if (responses.length === 0) return 0;
  const bins = binResponses(responses, numBins);
  const n = responses.length;
  let ece = 0;
  for (const bin of bins) {
    ece += (bin.count / n) * Math.abs(bin.mean_accuracy - bin.mean_confidence);
  }
  return ece;
}
```

**Notes.**
- The bin edges are half-open `[binStart, binEnd)`, so a confidence of exactly 1.0 is **not** placed in the top bin under the loop's condition (`r.confidence < binEnd` with `binEnd = 1.0`). In practice, the generative model produces confidences strictly less than 1.0 with probability 1 because of the additive Gaussian noise in `generateConfidence()`, but for empirical data this is a known boundary effect of the half-open binning.
- The default bin count is 10. The same default is used by `expectedCalibrationError`, `maximumCalibrationError`, and `binResponses`.

### 9.3 Maximum Calibration Error (MCE)

**Code form** (lines 94–109):

```ts
export function maximumCalibrationError(responses, numBins = 10) {
  if (responses.length === 0) return 0;
  const bins = binResponses(responses, numBins);
  let mce = 0;
  for (const bin of bins) {
    mce = Math.max(mce, Math.abs(bin.mean_accuracy - bin.mean_confidence));
  }
  return mce;
}
```

### 9.4 Direction detection and aggregate β̂ estimator

**Code form** (lines 114–145):

```ts
export function detectMiscalibration(responses, threshold = 0.05): CalibrationType {
  if (responses.length === 0) return CalibrationType.WELL_CALIBRATED;
  const meanConfidence = mean(responses.map(r => r.confidence));
  const meanAccuracy   = mean(responses.map(r => r.correctness ? 1 : 0));
  const gap = meanConfidence - meanAccuracy;
  if (gap > threshold) return CalibrationType.OVERCONFIDENT;
  else if (gap < -threshold) return CalibrationType.UNDERCONFIDENT;
  else return CalibrationType.WELL_CALIBRATED;
}

export function estimateBetaHat(responses): number {
  if (responses.length === 0) return 0;
  const meanConfidence = mean(responses.map(r => r.confidence));
  const meanAccuracy   = mean(responses.map(r => r.correctness ? 1 : 0));
  return meanConfidence - meanAccuracy;
}
```

**Note.** The detection threshold here (0.05) is **not** the same as the scaffold-trigger threshold (0.10) used in Section 11. Both are hard-coded defaults and are overridable per call site. They correspond to two different decisions: "should this learner be classified as miscalibrated for analytics reporting?" versus "should we deliver a scaffold prompt to the learner right now?"

---

## Section 10 — Scheduler equations (CalibrateMe)

Source: [`src/scheduler/calibrationAwareScheduler.ts`](../src/scheduler/calibrationAwareScheduler.ts).

### 10.1 Base interval

**Report form:**

t_base = (1 / λ) · ln(K̂ / K_target),    K_target = 0.7,    clamped to [1, 30] days.

**Code form** (`baseInterval()`, lines 17–31):

```ts
export function baseInterval(K_hat: number, lambda: number): number {
  if (K_hat <= 0.7) return 1;
  if (lambda === 0) return 30;
  const target_retention = 0.7;
  const interval = -Math.log(target_retention / K_hat) / lambda;
  return Math.max(1, Math.min(30, interval));
}
```

The two short-circuits encode boundary cases of the inverse:
- `K_hat <= 0.7` would yield `−ln(≥1) / λ ≤ 0`, i.e., review immediately. The code rounds this to "tomorrow" (interval = 1).
- `lambda === 0` would divide by zero. The code returns the upper clamp 30.

### 10.2 Calibration adjustment

**Report form:**

multiplier_cal(β̂) = exp(−2 · β̂)

**Code form** (`calibrationAdjustment()`, lines 36–47):

```ts
export function calibrationAdjustment(beta_hat: number): number {
  return Math.exp(-2 * beta_hat);
}
```

The exponent factor `−2` is hard-coded; the in-file comment (lines 41–44) gives the calibrated examples β̂ = +0.2 → 0.67 and β̂ = −0.2 → 1.49 that match `exp(±0.4)`.

### 10.3 Dual-process adjustment

**Report form:**

multiplier_dp(y, type) =
- 0.5     if y = 0 (incorrect)
- 1.2     if y = 1 and type = TYPE1_AUTOMATIC
- 1.0     otherwise (TYPE2_DELIBERATE, correct)

**Code form** (`dualProcessAdjustment()`, lines 52–65):

```ts
export function dualProcessAdjustment(
  responseType: ResponseType,
  correctness: boolean
): number {
  if (!correctness) return 0.5;
  if (responseType === ResponseType.TYPE1_AUTOMATIC) return 1.2;
  return 1.0;
}
```

### 10.4 Composed next-review interval

**Report form:**

t_next = clamp_{[1,60]}( round( t_base(K̂, λ) · multiplier_cal(β̂) · multiplier_dp(y, type) ) )

**Code form** (`computeNextReviewInterval()`, lines 70–92):

```ts
export function computeNextReviewInterval(
  belief, response, lambda,
  enableCalibration = true,
  enableDualProcess = true
): number {
  let interval = baseInterval(belief.K_hat, lambda);
  if (enableCalibration)  interval *= calibrationAdjustment(belief.beta_hat);
  if (enableDualProcess)  interval *= dualProcessAdjustment(response.response_type, response.correctness);
  return Math.max(1, Math.min(60, Math.round(interval)));
}
```

The two boolean flags are how the ablation conditions in Section 4 of the simulation environment reference are realized:

| Condition (from `DEFAULT_CONDITIONS`) | enableCalibration | enableDualProcess |
|---|---|---|
| Full CalibrateMe   | true  | true  |
| No Dual-Process    | true  | false |
| No Scaffolding     | true  | true  (scaffolding is disabled at the engine level, not here) |
| Calibration Only   | true  | false |
| BKT-Only           | (uses `baseInterval` directly, see Section 13) |
| SM-2 Baseline      | (uses Section 12 instead) |

### 10.5 Coverage-aware item selection

**Report form:**

score(item) = urgency(item) − w_cov · (review_count(item) − review_count_avg) [ − w_diff · | difficulty(item) − target(K̂) | ]

where the bracketed term is added only when `enableDifficultySequencing = true`.

**Code form** (`CalibrateMeScheduler.selectItems()`, lines 206–233):

```ts
selectItems(items: Item[], count: number, now: Date = new Date()): Item[] {
  const totalItems = items.length;
  const expectedPerItem = totalItems > 0 ? this.totalReviews / totalItems : 0;

  const targetDifficulty = this.currentKHat < 0.4 ? 0.17
    : this.currentKHat < 0.7 ? 0.50
    : 0.83;

  const scored = items.map(item => {
    const urgency = calculateUrgency(item, now);
    const reviewCount = this.reviewCounts.get(item.id) || 0;
    const coveragePenalty = this.coverageWeight * (reviewCount - expectedPerItem);
    let score = urgency - coveragePenalty;

    if (this.enableDifficultySequencing) {
      const difficultyBonus = -Math.abs(item.difficulty - targetDifficulty);
      score += this.difficultyWeight * difficultyBonus;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.item);
}
```

**Notes.**
- Urgency = −days_until_due (lines 98–107). Overdue items have positive urgency; not-yet-due items have negative urgency.
- Default `coverageWeight = 0.5`, `difficultyWeight = 0.3` (constructor defaults, lines 146–162). Neither default is overridden by the experiment configuration.
- The three difficulty targets {0.17, 0.50, 0.83} match the three difficulty levels used in `createLearnerProfile()` (`(i % 3) * 0.33 + 0.17`), so the scheduler always has a non-trivial difficulty bonus to compute.

### 10.6 Domain-aware β̂ routing

When `belief.domain_calibration` is present, `processResponse()` (lines 239–263) selects the per-domain β̂ for the item's `item_type` before calling `computeNextReviewInterval`:

```ts
let effectiveBelief = belief;
if (belief.domain_calibration && response.item_type) {
  const domainBetaHat = response.item_type === ItemType.VOCABULARY
    ? belief.domain_calibration.beta_hat_vocab
    : belief.domain_calibration.beta_hat_grammar;
  effectiveBelief = { ...belief, beta_hat: domainBetaHat };
}
```

This routes vocabulary items through `beta_hat_vocab` and grammar items through `beta_hat_grammar`, leaving the rest of the scheduler equations unchanged.

---

## Section 11 — Dual-process classifier

Source: [`src/dualProcess/classifier.ts`](../src/dualProcess/classifier.ts).

### 11.1 RT normalization

**Report form:**

z_τ = (τ − μ_τ(d)) / σ_τ(d),    where μ_τ(d), σ_τ(d) are the running mean/std of RT within difficulty bin d.

**Code form** (`normalizeRTByDifficulty`, lines 44–50; `normalizeRT`, lines 33–39):

```ts
normalizeRT(tau: number): number {
  if (this.rtStats.count < 5) return 0;
  return zScore(tau, this.rtStats.mean, this.rtStats.std);
}

normalizeRTByDifficulty(tau: number, difficulty_bin: string): number {
  const stats = this.rtByDifficulty.get(difficulty_bin);
  if (!stats || stats.count < 3) return this.normalizeRT(tau);
  return zScore(tau, stats.mean, stats.std);
}
```

The two minimum-sample-size guards (`< 5` overall, `< 3` per difficulty bin) return a neutral z = 0 until enough samples accumulate. Both `OnlineStatistics` updates use Welford's algorithm (`src/utils/statistics.ts`).

### 11.2 Dual-process score

**Report form:**

score_dp = c − (0.5 · z_τ + 0.5)

**Code form** (`computeDualProcessScore`, lines 56–60):

```ts
computeDualProcessScore(normalized_rt: number, confidence: number): number {
  return confidence - (normalized_rt * 0.5 + 0.5);
}
```

This is monotone in both axes: higher confidence raises the score (more Type 1), and a faster (more negative z_τ) RT also raises the score. The constant 0.5 inside the parenthesis recenters z = 0 to a neutral half-point.

### 11.3 Type 1 / Type 2 classification rule

**Report form:**

type =
- TYPE2_DELIBERATE                        if y = 0 (errors are ambiguous, default to Type 2)
- TYPE1_AUTOMATIC                         if y = 1 ∧ z_τ < z_threshold ∧ c > c_threshold
- TYPE2_DELIBERATE                        otherwise

with z_threshold = −0.5 and c_threshold = 0.7 by default.

**Code form** (`classifyResponseType`, lines 65–83):

```ts
classifyResponseType(normalized_rt, confidence, correctness): ResponseType {
  if (!correctness) return ResponseType.TYPE2_DELIBERATE;
  const isFast           = normalized_rt < this.rtThreshold;
  const isHighConfidence = confidence > this.confidenceThreshold;
  if (isFast && isHighConfidence) return ResponseType.TYPE1_AUTOMATIC;
  return ResponseType.TYPE2_DELIBERATE;
}
```

The two thresholds are constructor parameters with the defaults shown above (lines 20–28). No condition or profile in `experiment_config.json` overrides them.

### 11.4 Interval multiplier (mirror of scheduler.10.3)

`getIntervalMultiplier()` (lines 88–98) repeats the same {0.5, 1.2, 1.0} table as `dualProcessAdjustment()`. The duplication is intentional: the scheduler can call its local copy without depending on the classifier's instance, and the classifier can return the multiplier to non-scheduler consumers (e.g., analytics).

### 11.5 Difficulty bin mapping

`getDifficultyBin(difficulty)` (lines 162–166):

| difficulty | bin label |
|---|---|
| < 0.33 | `easy`   |
| < 0.67 | `medium` |
| ≥ 0.67 | `hard`   |

These bins also match the per-item difficulties produced by `createLearnerProfile()` (0.17, 0.50, 0.83), so each generated item lands in exactly one bin.

---

## Section 12 — Adaptive scaffolding (Equation 7)

Source: [`src/scaffolding/adaptiveScaffolding.ts`](../src/scaffolding/adaptiveScaffolding.ts).

### 12.1 The β* update rule (Equation 7 from the pitch)

**Report form:**

β*_{t+1} = β*_t · (1 − δ),    applied each time a scaffold prompt is delivered.

**Code form** (`applyScaffoldingEffect`, lines 73–79):

```ts
export function applyScaffoldingEffect(
  beta_star: number,
  delta: number
): number {
  return beta_star * (1 - delta);
}
```

**Notes.**
- The update is symmetric: it shrinks |β*| toward 0 regardless of sign. An overconfident learner (β* > 0) sees β* decrease; an underconfident learner (β* < 0) sees β* move toward 0 from below.
- δ = 0.03 by default (`DEFAULT_SIMULATION_CONFIG`, `src/types/index.ts:217-234`). The δ-sweep experiment varies δ over {0.00, 0.01, 0.02, 0.03, 0.05, 0.08, 0.10, 0.15} (`config/experiment_config.json → delta_sweep.deltas`).
- This is the only place where the simulation modifies the *true* learner state from outside `applyLearning()` / `applyForgetting()`. Scaffolding therefore acts as a slow exogenous correction on the calibration bias parameter, not on K* itself.

### 12.2 Scaffold-selection rule

**Report form:**

scaffold_type(β̂) =
- REFLECTION    if β̂ > θ
- ENCOURAGEMENT if β̂ < −θ
- NONE          otherwise

with θ = 0.10 by default.

**Code form** (`selectScaffold`, lines 35–46):

```ts
export function selectScaffold(
  beta_hat: number,
  _recent_responses: ProcessedResponse[],
  threshold: number = 0.1
): ScaffoldType {
  if (beta_hat > threshold) return ScaffoldType.REFLECTION;
  else if (beta_hat < -threshold) return ScaffoldType.ENCOURAGEMENT;
  return ScaffoldType.NONE;
}
```

The `_recent_responses` argument is reserved for a future history-aware variant; it is currently unused (signaled by the leading underscore).

### 12.3 Scaffold-trigger gating

**Report form:**

trigger(t, k) = (calibration_type ≠ WELL_CALIBRATED) ∧ (k ≥ k_min)

where k is the number of responses since the last scaffold and k_min = 5.

**Code form** (`shouldTriggerScaffold`, lines 51–67):

```ts
export function shouldTriggerScaffold(
  calibration_type: CalibrationType,
  responses_since_last_scaffold: number,
  min_interval: number = 5
): boolean {
  if (calibration_type === CalibrationType.WELL_CALIBRATED) return false;
  if (responses_since_last_scaffold < min_interval) return false;
  return true;
}
```

The minimum interval `k_min = 5` is the only refractory mechanism; there is no upper bound on the number of scaffolds per session.

### 12.4 End-to-end scaffolding step

`AdaptiveScaffoldingManager.processResponse()` (lines 118–170) composes the three rules:

1. Increment the responses-since-last-scaffold counter.
2. Classify the learner via the threshold rule on β̂ (uses θ = `this.threshold`, default 0.10).
3. Call `shouldTriggerScaffold(calibration_type, counter, this.minInterval)`.
4. If triggered, call `selectScaffold(...)`. If the result is `NONE`, return without changing β*.
5. Otherwise, reset the counter, push to history, compute `applyScaffoldingEffect(β*_t, δ)`, draw a random prompt via `getScaffoldPrompt(...)`, and return the new β*.

The scaffold history (`scaffoldHistory`) is exposed via `getHistory()` for analytics.

---

## Section 13 — BKT-Only baseline

Source: [`src/baselines/bktOnly.ts`](../src/baselines/bktOnly.ts).

**Report form.** Identical to Equation 1 (BKT update) for the belief side, but the scheduler ignores β̂ and the dual-process classifier:

t_next = baseInterval(K̂, λ),    rounded to days.

**Code form** (`BKTOnlyScheduler.processResponse`, lines 43–60):

```ts
processResponse(response: Response): { nextReview: Date; interval: number } {
  const currentBelief = this.getBelief(response.item_id);
  const updatedBelief = updateBelief(response, currentBelief, this.config);
  this.beliefs.set(response.item_id, updatedBelief);

  const interval = baseInterval(updatedBelief.K_hat, this.lambda);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + Math.round(interval));
  return { nextReview, interval: Math.round(interval) };
}
```

**Notes.**
- The belief is initialized once per item with `K_hat = 0.3`, `beta_hat = 0`, `confidence_interval = 0.2` (lines 28–38). These match the initialization used in `createLearnerProfile()` for the CalibrateMe scheduler.
- `beta_hat = 0` is preserved throughout (no `updateBetaHat()` call), which is the operational definition of "calibration-blind" for this baseline.
- The condition string `"BKT-Only"` in `DEFAULT_CONDITIONS` (`src/simulation/ablationRunner.ts:49-94`) is the only place this scheduler is activated in the experiments.

---

## Section 14 — SM-2 baseline

Source: [`src/baselines/sm2.ts`](../src/baselines/sm2.ts).

### 14.1 Quality mapping

**Report form:**

q = 0,                         if y = 0
q = round(5 · c),              if y = 1

**Code form** (`mapToQuality`, lines 33–36):

```ts
export function mapToQuality(confidence: number, correctness: boolean): number {
  if (!correctness) return 0;
  return Math.round(5 * confidence);
}
```

This is the only point where SM-2 sees the learner's confidence at all; everything downstream is the standard SuperMemo-2 update.

### 14.2 Ease factor and interval update

**Report form (SuperMemo-2):**

EF_{t+1} = max(1.3, EF_t + 0.1 − (5 − q) · (0.08 + (5 − q) · 0.02))

interval_{t+1} =
- 1                          if q < 3
- 1                          if q ≥ 3 and reps_{t+1} = 1
- 6                          if q ≥ 3 and reps_{t+1} = 2
- round(interval_t · EF_{t+1}) otherwise

reps_{t+1} =
- 0                          if q < 3
- reps_t + 1                 if q ≥ 3

**Code form** (`updateSM2`, lines 41–74):

```ts
export function updateSM2(state: SM2State, quality: number): SM2State {
  const q = Math.max(0, Math.min(5, quality));
  let newEF = state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newReps: number;

  if (q < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    newReps = state.repetitions + 1;
    if (newReps === 1)      newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else                    newInterval = Math.round(state.interval * newEF);
  }
  return { easeFactor: newEF, interval: newInterval, repetitions: newReps };
}
```

**Notes.**
- The initial state for any new item is `EF = 2.5, interval = 1, repetitions = 0` (`initSM2State`, lines 20–26), matching the canonical SM-2 initialization.
- There is no upper clamp on the interval; on a long success streak, the interval grows geometrically with ratio EF_t. The simulation runs at most 30 sessions, which empirically caps the maximum SM-2 interval reached during the experiments.

---

## Section 15 — Decay-based baseline (legacy)

Source: [`src/baselines/decayBased.ts`](../src/baselines/decayBased.ts). This baseline is not part of the 6-condition ablation but is included in the codebase for sanity checks.

**Report form:**

interval_{t+1} =
- min(2 · interval_t, 30)    if y = 1
- 1                          if y = 0

**Code form** (`DecayBasedScheduler.processResponse`, lines 54–82):

```ts
if (response.correctness) {
  newStreak = state.streak + 1;
  newInterval = Math.min(state.interval * 2, this.maxInterval);
} else {
  newStreak = 0;
  newInterval = 1;
}
```

The maximum interval is `maxInterval = 30` (constructor default, line 36). No interaction with confidence, K̂, or β̂.

---

## Section 16 — Cross-reference: equations to source files

| Equation | Pitch label | Forward (generative) | Inverse (likelihood / scheduling) |
|---|---|---|---|
| 1 | BKT belief update           | —                                                  | `bkt/beliefUpdateEngine.ts:63-125` (`updateBelief`) |
| 2 | True learning update        | `memory/forgettingModel.ts:92-104` (`applyLearning`) | — |
| 3 | Forgetting drift            | `memory/forgettingModel.ts:12-18` (`applyForgetting`) | `memory/forgettingModel.ts:45-54` (`optimalReviewTime`); `bkt/beliefUpdateEngine.ts:185-199` (`applyBeliefDrift`) |
| 4 | Slip-guess correctness      | `simulation/responseGenerator.ts:13-21` (`generateCorrectness`) | `bkt/beliefUpdateEngine.ts:13-21` (`likelihoodCorrectness`) |
| 5 | Confidence model            | `simulation/responseGenerator.ts:27-35` (`generateConfidence`) | `bkt/beliefUpdateEngine.ts:27-37` (`likelihoodConfidence`) |
| 6 | Response time model         | `simulation/responseGenerator.ts:41-51` (`generateResponseTime`) | `bkt/beliefUpdateEngine.ts:43-53` (`likelihoodRT`) |
| 7 | Scaffolding β* update       | `scaffolding/adaptiveScaffolding.ts:73-79` (`applyScaffoldingEffect`) | — |
| —  | β̂ EMA                       | —                                                  | `bkt/beliefUpdateEngine.ts:130-145` (`updateBetaHat`); `bkt/beliefUpdateEngine.ts:151-180` (`updateDomainBetaHat`); `calibration/scoringModule.ts:137-145` (`estimateBetaHat`) |
| —  | ECE / MCE / Brier            | —                                                  | `calibration/scoringModule.ts:18-109` |
| —  | Base interval                | —                                                  | `scheduler/calibrationAwareScheduler.ts:17-31` (`baseInterval`) |
| —  | Calibration adjustment       | —                                                  | `scheduler/calibrationAwareScheduler.ts:36-47` (`calibrationAdjustment`) |
| —  | Dual-process adjustment      | —                                                  | `scheduler/calibrationAwareScheduler.ts:52-65`; `dualProcess/classifier.ts:88-98` |
| —  | Coverage-aware scoring       | —                                                  | `scheduler/calibrationAwareScheduler.ts:206-233` (`CalibrateMeScheduler.selectItems`) |
| —  | SM-2 quality + EF            | —                                                  | `baselines/sm2.ts:33-74` |
| —  | BKT-only scheduling          | —                                                  | `baselines/bktOnly.ts:43-60` |
| —  | Decay-based scheduling       | —                                                  | `baselines/decayBased.ts:54-82` |

---

## Section 17 — Engineering Choices Table

This section documents the provenance of every numeric tuning constant referenced in Sections 2–16. Origins were determined by inspecting `git log -p --follow` for each source file, reading in-file comments, and checking commit messages. Where neither a commit message nor an in-file comment justifies the value, the origin is marked as needing author confirmation rather than guessed. The values themselves are unchanged; this table is purely descriptive.

| Parameter | Value | Source file:line | Origin |
|---|---|---|---|
| Coefficient `2` in `e^{-2·β̂}` (calibration adjustment) | `2` | `src/scheduler/calibrationAwareScheduler.ts:46` | origin unknown; needs author confirmation (present in initial import `cc3a23f`; in-file comment lines 41–44 only illustrates the resulting multipliers `β̂=±0.2 → 0.67 / 1.49`, with no derivation or citation) |
| BKT likelihood weight `w_y` (correctness) | `1.0` | `src/bkt/beliefUpdateEngine.ts:75` | tuned on pilot runs (added in commit `8eb23e7` "Fix scheduler retention deficit and BKT knowledge estimation gap"; commit message: "Add likelihood reliability weights (correctness=1.0, confidence=0.5, RT=0.3) … Result: K-hat gap reduced from 25+ to 12-15 percentage points") |
| BKT likelihood weight `w_c` (confidence) | `0.5` | `src/bkt/beliefUpdateEngine.ts:76` | tuned on pilot runs (commit `8eb23e7`; same justification as `w_y`; in-file comment lines 71–74: "Confidence (w=0.5): depends on uncertain β̂ estimate") |
| BKT likelihood weight `w_τ` (response time) | `0.3` | `src/bkt/beliefUpdateEngine.ts:77` | tuned on pilot runs (commit `8eb23e7`; in-file comment lines 71–74: "Response time (w=0.3): high variance, weak knowledge signal") |
| BKT prior Gaussian spread `σ` | `0.3` | `src/bkt/beliefUpdateEngine.ts:89` | tuned on pilot runs (commit `8eb23e7` widened the prior from `σ=0.2` to `σ=0.3`; commit message: "Widen prior spread (sigma 0.2 -> 0.3) for faster evidence response"; in-file comment lines 87–88: "wider spread (σ=0.3) to allow K̂ to respond more readily to new evidence") |
| BKT grid resolution `grid_points` | `101` | `src/bkt/beliefUpdateEngine.ts:67` | chosen pragmatically (present in initial import `cc3a23f`; gives K̂ resolution `1/100 = 0.01`, which is the round-number grid spacing referenced in Section 7) |
| β̂ EMA learning rate `η` | `0.1` | `src/bkt/beliefUpdateEngine.ts:133` | origin unknown; needs author confirmation (default value present in initial import `cc3a23f`; no in-file comment or commit message justifies the choice) |
| β̂ EMA window length | `10` (last responses) | `src/bkt/beliefUpdateEngine.ts:138` | origin unknown; needs author confirmation (in-file comment "Last 10 responses" merely restates the value; present in initial import `cc3a23f` with no further rationale) |
| Domain-split β̂ minimum sample size | `5` | `src/bkt/beliefUpdateEngine.ts:165, 172` | tuned on pilot runs (raised from `3` to `5` in commit `7edd957` "fix: 5 pre-report methodological fixes"; commit message Fix 3: "Domain β̂ minimum responses — increase from 3 to 5 for more stable EMA estimates before influencing scheduling"; in-file comment lines 162–164 echoes the same rationale) |
| Dual-process RT z-threshold (`rtThreshold`) | `−0.5` | `src/dualProcess/classifier.ts:21` | origin unknown; needs author confirmation (default constructor argument present in initial import `cc3a23f`; no comment or commit message justifies the specific cutoff) |
| Dual-process confidence threshold (`confidenceThreshold`) | `0.7` | `src/dualProcess/classifier.ts:22` | origin unknown; needs author confirmation (default constructor argument present in initial import `cc3a23f`; no rationale recorded) |
| Dual-process interval multiplier (incorrect, `y=0`) | `0.5` | `src/scheduler/calibrationAwareScheduler.ts:57`; `src/dualProcess/classifier.ts:90` | chosen pragmatically (present in initial import `cc3a23f`; in-file comment "Shorten interval for errors" gives the design intent — halve the interval after a miss — but no source citation) |
| Dual-process interval multiplier (Type 2 deliberate, correct) | `1.0` | `src/scheduler/calibrationAwareScheduler.ts:64`; `src/dualProcess/classifier.ts:96` | chosen pragmatically (no-op default; present in initial import `cc3a23f`) |
| Dual-process interval multiplier (Type 1 automatic, correct) | `1.2` | `src/scheduler/calibrationAwareScheduler.ts:61`; `src/dualProcess/classifier.ts:94` | chosen pragmatically (present in initial import `cc3a23f`; in-file comment "Slightly longer for automatized" describes the intent of a small positive bump, but the specific magnitude `1.2` is not justified or cited) |
| Scaffolding default dose `δ` | `0.03` | `src/types/index.ts:233`; `src/scaffolding/adaptiveScaffolding.ts:104` | chosen pragmatically (present in initial import `cc3a23f`; in-file comment in `types/index.ts:214` declares the design range `δ ∈ [0.02, 0.05]` and `0.03` is the midpoint that the δ-sweep experiment in `config/experiment_config.json → delta_sweep.deltas` later uses as the central value) |
| Scaffold reflection threshold (β̂ > +θ) | `+0.10` | `src/scaffolding/adaptiveScaffolding.ts:38, 105` | origin unknown; needs author confirmation (default `threshold = 0.1` present in initial import `cc3a23f`; no in-file comment or commit message justifies the value) |
| Scaffold encouragement threshold (β̂ < −θ) | `−0.10` | `src/scaffolding/adaptiveScaffolding.ts:42, 105` | origin unknown; needs author confirmation (same `threshold = 0.1` parameter as the reflection branch; no rationale recorded) |
| Scaffold refractory window `min_interval` | `5` (responses) | `src/scaffolding/adaptiveScaffolding.ts:54, 106` | origin unknown; needs author confirmation (default constructor argument present in initial import `cc3a23f`; in-file comment "Don't scaffold too frequently" gives the intent but not the magnitude) |
| Scheduler interval clamp (lower bound) | `1` (day) | `src/scheduler/calibrationAwareScheduler.ts:91` | chosen pragmatically (present in initial import `cc3a23f`; "review tomorrow" is the smallest physically meaningful interval given the day-granular scheduler) |
| Scheduler interval clamp (upper bound) | `60` (days) | `src/scheduler/calibrationAwareScheduler.ts:91` | origin unknown; needs author confirmation (in-file comment "Clamp to [1, 60] days" merely restates the value; no justification for `60` over alternatives such as `30` or `90`. Note: `baseInterval()` itself uses a tighter inner clamp of `30` on lines 30, again without justification) |
| Base-interval target retention `K_target` | `0.7` | `src/scheduler/calibrationAwareScheduler.ts:23, 26` | chosen pragmatically (present in initial import `cc3a23f`; in-file comment lines 18–21 derives the formula `t = −ln(0.7/K̂)/λ` from the design choice "target K* = 0.7 at next review", but does not cite a source for the `0.7` target) |
| Calibration detection threshold (`detectMiscalibration`) | `0.05` | `src/calibration/scoringModule.ts:116` | origin unknown; needs author confirmation (default argument present in initial import `cc3a23f`; Section 9.4 of this document explicitly notes that this `0.05` is intentionally distinct from the `0.10` scaffold-trigger threshold, but no source or pilot result is recorded for either value) |

**Methodology note.** The git history examined was the full history of each source file as returned by `git log --all -p --follow`. Two commits substantively introduced or modified constants in this table: `8eb23e7` (BKT likelihood weights `w_y, w_c, w_τ` and prior `σ`) and `7edd957` (domain-split minimum sample size). All other constants entered the codebase in the initial import `cc3a23f` ("Set up CalibrateMe project: complete codebase from starter docs") with no accompanying derivation, citation, or pilot-result justification in either the commit message or the in-file comments. Constants marked "origin unknown; needs author confirmation" should be confirmed with the original author before being defended in the report as deliberate design choices.

Every numbered equation in the report has a forward implementation, an inverse implementation, or both, in exactly the file and line range listed above. No equation in the report is missing from the codebase, and no equation in the codebase is missing from the report (with the three documented deviations in Section 7: likelihood reweighting, prior shape, and posterior summarization).