# CalibrateMe: Midpoint Implementation Plan & Report Outline

## Next Deliverable: Optional Midpoint Check-In

| Detail | Information |
|--------|-------------|
| **Assigned** | Feb 16, 2026 |
| **Due** | Mar 8, 2026 |
| **Word Limit** | 2000 words (excluding title, references, appendices) |
| **Format** | IEEE |
| **Grade Weight** | 0% (feedback only, scored out of 10) |

---

## Required Sections (Computational Model/Tool Track)

### 1. Important Findings
- What have you learned from building your system so far?
- How do these findings relate to cognitive science concepts or models?

### 2. Project Conduct
- How did you build your model/tool?
- Which tools, platforms, or frameworks did you use?
- How did you translate cognitive science concepts into system features?
- What refinements did you make to the design?
- What worked, what didn't, and what were your key takeaways?

### 3. Research Plan Update
- Update task list: completed tasks, remaining tasks, timeline changes
- Total effort ≥ 100 hours
- Include as appendix

---

## Tasks to Complete Before Midpoint (Weeks 5-8)

| Task # | Description | Hours | Status |
|--------|-------------|-------|--------|
| 8 | Formalize K* vs K̂ separation and response generation | 3 | To do |
| 9 | Define slip-guess and confidence generation parameters | 3 | To do |
| 10 | Implement calibration scoring module (ECE, Brier) | 4 | To do |
| 11 | Implement BKT belief update engine | 5 | To do |
| 12 | Implement forgetting decay model | 3 | To do |
| 13 | Implement dual-process classifier (RT × confidence) | 4 | To do |
| 14 | Implement calibration-aware scheduler | 4 | To do |
| 15 | Implement adaptive scaffolding module | 3 | To do |
| 16 | Integration testing and debugging | 3 | To do |
| 17 | Create 9 synthetic learner profiles | 3 | To do |
| 18 | Run initial baseline simulations | 4 | To do |
| 19 | Write midpoint check-in report | 4 | To do |

**Total work before midpoint:** 43 hours (Tasks 8-19)

---

## Recommended Timeline

| Week | Dates | Focus | Tasks |
|------|-------|-------|-------|
| 5 | Feb 9-15 | Formalization | 8, 9 (6h) |
| 6 | Feb 16-22 | Core Implementation | 10, 11, 12 (12h) |
| 7 | Feb 23-Mar 1 | Complete Pipeline | 13, 14, 15, 16 (14h) |
| 8 | Mar 2-8 | Testing + Report | 17, 18, 19 (11h) |

---

# Part 1: Detailed Implementation Plan

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Frontend | React |
| State Management | React hooks or Zustand |
| Visualization | Recharts or D3.js |
| Testing | Jest |
| Build | Vite |

---

## Task 8: Formalize K* vs K̂ Separation (3 hours)

**Objective:** Create the data structures that cleanly separate true learner state from system beliefs.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 8.1 | Define `TrueLearnerState` interface | 30m | `{ K_star: number, beta_star: number, alpha: number, lambda: number }` |
| 8.2 | Define `SystemBelief` interface | 30m | `{ K_hat: number, beta_hat: number, confidence_interval: number }` |
| 8.3 | Define `LearnerProfile` type (9 profiles) | 30m | Enum + parameter lookup table |
| 8.4 | Define `Response` interface | 30m | `{ correctness: boolean, confidence: number, response_time: number }` |
| 8.5 | Define `Item` interface | 30m | `{ id: string, difficulty: number, last_review: Date, K_star: number }` |
| 8.6 | Write unit tests for data structures | 30m | Jest test file |

**Deliverable:** `src/types/` folder with all TypeScript interfaces

---

## Task 9: Define Slip-Guess and Confidence Generation (3 hours)

**Objective:** Implement the response generation model (Equations 4, 5, 6 from pitch).

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 9.1 | Implement `generateCorrectness(K_star, slip, guess)` | 30m | Returns boolean based on Eq. 4 |
| 9.2 | Implement `generateConfidence(K_star, beta_star, noise)` | 30m | Returns clipped confidence [0,1] per Eq. 5 |
| 9.3 | Implement `generateResponseTime(K_star, tau_base, gamma)` | 30m | Returns RT in seconds per Eq. 6 |
| 9.4 | Implement `generateResponse()` wrapper | 30m | Combines all three into Response object |
| 9.5 | Implement noise generators (Gaussian) | 30m | Helper functions for ε_c, ε_τ |
| 9.6 | Write unit tests with known seeds | 30m | Verify statistical properties |

**Deliverable:** `src/simulation/responseGenerator.ts`

**Dependencies:** Task 8 (interfaces)

**Key Formulas:**
```
P(y=1|K*) = (1-s) × K* + g × (1-K*)     [Eq. 4]
c = clip(K* + β* + ε_c, 0, 1)            [Eq. 5]
τ = τ_base × (1 + γ × (1 - K*)) + ε_τ    [Eq. 6]
```

---

## Task 10: Implement Calibration Scoring Module (4 hours)

**Objective:** Implement ECE and Brier score calculation.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 10.1 | Implement `brierScore(confidence, correctness)` | 30m | Single-item Brier score |
| 10.2 | Implement `aggregateBrierScore(responses[])` | 30m | Mean Brier over history |
| 10.3 | Implement `binResponses(responses[], numBins)` | 45m | Group by confidence deciles |
| 10.4 | Implement `expectedCalibrationError(responses[])` | 45m | ECE calculation |
| 10.5 | Implement `detectMiscalibration(ECE, threshold)` | 30m | Returns 'over' / 'under' / 'well' |
| 10.6 | Implement `estimateBetaHat(responses[])` | 30m | Estimate β̂ from response history |
| 10.7 | Write unit tests with synthetic data | 30m | Test all edge cases |

**Deliverable:** `src/calibration/scoringModule.ts`

**Key Formulas:**
```
Brier Score = (confidence - correctness)²
ECE = Σ (|bin_size|/n) × |accuracy(bin) - mean_confidence(bin)|
```

---

## Task 11: Implement BKT Belief Update Engine (5 hours)

**Objective:** Implement Bayesian Knowledge Tracing update (Equation 1).

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 11.1 | Implement `priorKnowledge(K_hat_prev)` | 30m | P(K̂) |
| 11.2 | Implement `likelihoodCorrectness(y, K_hat, slip, guess)` | 45m | P(y\|K̂) |
| 11.3 | Implement `likelihoodConfidence(c, K_hat, beta_hat, sigma)` | 45m | P(c\|K̂) |
| 11.4 | Implement `likelihoodRT(tau, K_hat, tau_base, gamma)` | 45m | P(τ\|K̂) |
| 11.5 | Implement `posteriorUpdate(prior, likelihoods[])` | 45m | Bayes rule combination |
| 11.6 | Implement `updateBelief(response, currentBelief)` | 30m | Main BKT update function |
| 11.7 | Implement `applyForgettingDrift(K_hat, lambda, delta_t)` | 30m | Between-session decay of belief |
| 11.8 | Write integration tests | 30m | Verify belief updates correctly |

**Deliverable:** `src/bkt/beliefUpdateEngine.ts`

**Dependencies:** Task 8, Task 10 (for β̂ estimation)

**Key Formula:**
```
P(K̂|y,c,τ) ∝ P(y|K̂) × P(c|K̂) × P(τ|K̂) × P(K̂)   [Eq. 1]
```

---

## Task 12: Implement Forgetting Decay Model (3 hours)

**Objective:** Implement true-state forgetting (Equation 3) and belief drift.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 12.1 | Implement `applyForgetting(K_star, lambda, delta_t)` | 30m | K* decay per Eq. 3 |
| 12.2 | Implement `calculateDaysSinceReview(lastReview, now)` | 20m | Time delta helper |
| 12.3 | Implement `predictForgottenKnowledge(K_star, lambda, future_t)` | 30m | Project future K* |
| 12.4 | Implement `optimalReviewTime(K_star, lambda, threshold)` | 40m | When K* drops below threshold |
| 12.5 | Implement batch forgetting for all items | 30m | Apply to item pool |
| 12.6 | Write unit tests | 30m | Verify exponential decay |

**Deliverable:** `src/memory/forgettingModel.ts`

**Key Formula:**
```
K*_{t'} = K*_t × e^{-λ × Δt}   [Eq. 3]
```

---

## Task 13: Implement Dual-Process Classifier (4 hours)

**Objective:** Classify responses as Type 1 (automatic) or Type 2 (deliberate).

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 13.1 | Implement `normalizeRT(tau, learner_mean, learner_std)` | 30m | Z-score within learner |
| 13.2 | Implement `normalizeRTByDifficulty(tau, difficulty)` | 30m | Adjust for item difficulty |
| 13.3 | Implement `computeDualProcessScore(norm_RT, confidence)` | 45m | RT × confidence interaction |
| 13.4 | Implement `classifyResponseType(score, threshold)` | 30m | Returns 'Type1' or 'Type2' |
| 13.5 | Implement `getIntervalMultiplier(responseType, correctness)` | 45m | Scheduling adjustment factor |
| 13.6 | Track running statistics for normalization | 30m | Online mean/std calculator |
| 13.7 | Write unit tests | 30m | Test classification logic |

**Deliverable:** `src/dualProcess/classifier.ts`

**Classification Logic:**
```
Fast + High Confidence + Correct → Type 1 (automatized)
Slow + Low Confidence + Correct → Type 2 (effortful)
```

---

## Task 14: Implement Calibration-Aware Scheduler (4 hours)

**Objective:** Schedule reviews based on K̂, β̂, and dual-process classification.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 14.1 | Implement `baseInterval(K_hat, lambda)` | 30m | Optimal spacing from belief |
| 14.2 | Implement `calibrationAdjustment(beta_hat)` | 45m | Shorten if overconfident, lengthen if under |
| 14.3 | Implement `dualProcessAdjustment(responseType)` | 30m | Multiplier from Task 13 |
| 14.4 | Implement `computeNextReview(item, belief, response)` | 45m | Combine all factors |
| 14.5 | Implement `selectNextItem(items[], beliefs[])` | 45m | Priority queue by urgency |
| 14.6 | Implement `SM2Baseline(confidence, correctness)` | 30m | Comparison baseline |
| 14.7 | Write integration tests | 15m | Verify scheduling logic |

**Deliverable:** `src/scheduler/calibrationAwareScheduler.ts`

**Dependencies:** Tasks 10, 11, 12, 13

---

## Task 15: Implement Adaptive Scaffolding Module (3 hours)

**Objective:** Deliver prompts that modify β* over time (Equation 7).

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 15.1 | Define scaffold prompt templates | 30m | Reflection (overconfident), Encouragement (underconfident) |
| 15.2 | Implement `selectScaffold(beta_hat, responseHistory)` | 45m | Choose appropriate prompt |
| 15.3 | Implement `applyScaffoldingEffect(beta_star, delta)` | 30m | Modify true β* per Eq. 7 |
| 15.4 | Implement `shouldTriggerScaffold(miscalibration, threshold)` | 30m | Decision logic |
| 15.5 | Track scaffolding history | 30m | When/what prompts delivered |
| 15.6 | Write unit tests | 15m | Verify β* modification |

**Deliverable:** `src/scaffolding/adaptiveScaffolding.ts`

**Key Formula:**
```
β*_{t+1} = β*_t × (1 - δ)   where δ ∈ [0.02, 0.05]   [Eq. 7]
```

---

## Task 16: Integration Testing and Debugging (3 hours)

**Objective:** Connect all modules into working pipeline.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 16.1 | Create `SimulationEngine` class | 45m | Orchestrates all modules |
| 16.2 | Implement `runSession(learner, items, scheduler)` | 45m | Single learning session |
| 16.3 | Implement `runExperiment(profiles[], conditions[])` | 45m | Full experimental protocol |
| 16.4 | Debug end-to-end data flow | 30m | Fix integration issues |
| 16.5 | Verify K* vs K̂ separation maintained | 15m | Critical correctness check |

**Deliverable:** `src/simulation/simulationEngine.ts`

---

## Task 17: Create 9 Synthetic Learner Profiles (3 hours)

**Objective:** Instantiate the 3×3 profile grid from Table 2.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 17.1 | Implement `createLearnerProfile(ability, calibration)` | 30m | Factory function |
| 17.2 | Define parameter values for all 9 profiles | 45m | Match Table 2 exactly |
| 17.3 | Implement `initializeLearner(profile, itemPool)` | 30m | Set initial K* for all items |
| 17.4 | Create profile validation tests | 30m | Verify parameter ranges |
| 17.5 | Generate sample trajectories for each profile | 45m | Sanity check behavior |

**Deliverable:** `src/profiles/learnerProfiles.ts`

**Profile Parameters (from Pitch Table 2):**

| Profile | α (learn) | λ (forget) | β* (calib.) |
|---------|-----------|------------|-------------|
| Low-Over | 0.10 | 0.15 | +0.25 |
| Low-Under | 0.10 | 0.15 | −0.20 |
| Low-Well | 0.10 | 0.15 | 0.00 |
| Med-Over | 0.20 | 0.10 | +0.20 |
| Med-Under | 0.20 | 0.10 | −0.15 |
| Med-Well | 0.20 | 0.10 | 0.00 |
| High-Over | 0.30 | 0.05 | +0.15 |
| High-Under | 0.30 | 0.05 | −0.10 |
| High-Well | 0.30 | 0.05 | 0.00 |

---

## Task 18: Run Initial Baseline Simulations (4 hours)

**Objective:** Compare CalibrateMe vs baselines on all 9 profiles.

**Subtasks:**

| # | Subtask | Time | Output |
|---|---------|------|--------|
| 18.1 | Implement SM-2 baseline scheduler | 45m | Classic algorithm |
| 18.2 | Implement BKT-only baseline | 30m | No calibration adjustment |
| 18.3 | Implement decay-based baseline | 30m | Simple exponential |
| 18.4 | Run 30 sessions × 9 profiles × 4 conditions | 60m | Generate raw data |
| 18.5 | Compute metrics (retention, mastery, efficiency) | 45m | Summary statistics |
| 18.6 | Create preliminary visualizations | 30m | Charts for report |

**Deliverable:** `src/baselines/`, `results/preliminary/`

---

## Implementation Dependency Graph

```
Task 8 (Types)
    ↓
Task 9 (Response Gen) ←────────────────────┐
    ↓                                       │
Task 10 (Calibration) ──→ Task 11 (BKT) ──→ Task 14 (Scheduler)
    ↓                         ↓                   ↓
Task 13 (Dual-Process) ──────┴───────────────────┤
    ↓                                             │
Task 12 (Forgetting) ────────────────────────────┤
    ↓                                             │
Task 15 (Scaffolding) ───────────────────────────┤
    ↓                                             ↓
Task 16 (Integration) ←───────────────────────────┘
    ↓
Task 17 (Profiles)
    ↓
Task 18 (Simulations)
```

---

## Suggested File Structure

```
calibrateme/
├── src/
│   ├── types/
│   │   └── index.ts              # Task 8
│   ├── simulation/
│   │   ├── responseGenerator.ts   # Task 9
│   │   └── simulationEngine.ts    # Task 16
│   ├── calibration/
│   │   └── scoringModule.ts       # Task 10
│   ├── bkt/
│   │   └── beliefUpdateEngine.ts  # Task 11
│   ├── memory/
│   │   └── forgettingModel.ts     # Task 12
│   ├── dualProcess/
│   │   └── classifier.ts          # Task 13
│   ├── scheduler/
│   │   └── calibrationAwareScheduler.ts  # Task 14
│   ├── scaffolding/
│   │   └── adaptiveScaffolding.ts # Task 15
│   ├── profiles/
│   │   └── learnerProfiles.ts     # Task 17
│   ├── baselines/
│   │   ├── sm2.ts                 # Task 18
│   │   ├── bktOnly.ts
│   │   └── decayBased.ts
│   └── index.ts
├── tests/
│   └── ... (unit tests for each module)
├── results/
│   └── preliminary/
└── package.json
```

---

# Part 2: Midpoint Report Outline

## Document Structure

```
Title: CalibrateMe: Midpoint Check-In
Author: Erdem Acarkan
Course Info: CS 6795, Spring 2026, Track: Computational Tool

I. Important Findings (~600 words)
II. Project Conduct (~1000 words)
III. Conclusion and Next Steps (~400 words)

Appendix: Updated Research Plan
References
```

---

## Section I: Important Findings (600 words)

### A. System Development Insights
- What worked when translating equations to code
- Unexpected challenges in implementation
- Key design decisions made

### B. Preliminary Simulation Results
- Initial comparison: CalibrateMe vs baselines
- Which profiles show expected patterns (H1, H2, H3)
- Any surprising findings

### C. Cognitive Science Connections
- How BKT implementation reinforced understanding of probabilistic representation
- Insights about dual-process operationalization
- What calibration scoring revealed about monitoring/control distinction

**Include:** 1-2 figures showing preliminary results (e.g., calibration curves from simulation, retention comparison chart)

---

## Section II: Project Conduct (1000 words)

### A. Development Approach
- Modular architecture decision (why 5 separate modules)
- Test-driven development for mathematical functions
- Iterative refinement process

### B. Tools and Frameworks

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript | Type safety for complex state |
| Testing | Jest | Verify mathematical correctness |
| Visualization | Recharts | React integration |
| Build | Vite | Fast development iteration |

### C. Translating Cognitive Science to Code

- **Metacognitive Monitoring → Calibration Module:** How ECE/Brier capture monitoring accuracy
- **CRUM/BKT → Belief Engine:** Implementing probabilistic inference
- **Dual-Process → Classifier:** Operationalizing RT×confidence heuristic
- **Desirable Difficulties → Scheduler:** Spacing adjustments based on β̂
- **SRL → Scaffolding:** Prompt selection logic

### D. Design Refinements Since Pitch
- Any changes to equations or parameters
- Adjustments to evaluation protocol
- New insights that modified approach

### E. What Worked
- Modular separation enabled independent testing
- K* vs K̂ distinction caught bugs early
- Unit tests for mathematical functions

### F. What Didn't Work / Challenges
- Integration complexity
- Parameter tuning challenges
- Any scope adjustments

### G. Key Takeaways
- Lessons learned about computational modeling
- Insights about cognitive science through implementation

**Include:** 1 figure showing system architecture or code structure

---

## Section III: Conclusion and Next Steps (400 words)

### A. Current Status
- What's complete vs. in progress
- Overall percentage toward final deliverable

### B. Remaining Work
- Demo interface (Tasks 20-22)
- Full evaluation (Tasks 23-28)
- Report writing (Tasks 29-34)

### C. Feasibility Assessment
- On track / slightly behind / ahead
- Any scope adjustments needed
- Confidence in completing by deadline

### D. Questions for Feedback (Optional)
- Specific areas where instructor input would help

---

## Appendix: Updated Research Plan

**Format:** Same table structure as pitch, with updates:

| Week | # | Task | Hours | Complete? | Total | Notes |
|------|---|------|-------|-----------|-------|-------|
| 3-4 | 1-7 | (Pre-pitch tasks) | 24 | Y | 24 | |
| 5 | 8-9 | Formalization | 6 | Y | 30 | |
| 6 | 10-12 | Core implementation | 12 | Y | 42 | |
| 7 | 13-16 | Pipeline completion | 14 | Y | 56 | |
| 8 | 17-19 | Testing + Report | 11 | Y | 67 | |
| ... | ... | (Remaining tasks) | ... | N | ... | |

**Add column or notes for:**
- Actual hours (if different from estimated)
- Status notes (any delays, scope changes)

---

## Suggested Figures for Midpoint Report

| Figure | Content | Purpose |
|--------|---------|---------|
| Fig. 1 | System architecture (reuse from pitch or update) | Show implementation structure |
| Fig. 2 | Preliminary calibration curves from simulation | Demonstrate working calibration scoring |
| Fig. 3 | Retention comparison: CalibrateMe vs SM-2 (preliminary) | Show early results supporting hypotheses |

---

## Word Budget

| Section | Target | Max |
|---------|--------|-----|
| I. Important Findings | 600 | 700 |
| II. Project Conduct | 1000 | 1100 |
| III. Conclusion | 400 | 400 |
| **Total** | **2000** | **2000** |

---

# Summary Checklist

## Before Midpoint Submission (Mar 8)

### Implementation
- [ ] Task 8: Types and interfaces defined
- [ ] Task 9: Response generation working
- [ ] Task 10: Calibration scoring (ECE, Brier) implemented
- [ ] Task 11: BKT belief updates working
- [ ] Task 12: Forgetting model implemented
- [ ] Task 13: Dual-process classifier working
- [ ] Task 14: Calibration-aware scheduler complete
- [ ] Task 15: Scaffolding module implemented
- [ ] Task 16: All modules integrated
- [ ] Task 17: 9 learner profiles created
- [ ] Task 18: Preliminary simulations run

### Report
- [ ] Section I drafted (findings)
- [ ] Section II drafted (conduct)
- [ ] Section III drafted (next steps)
- [ ] Figures created
- [ ] Research plan updated
- [ ] Word count verified (≤2000)
- [ ] IEEE formatting applied

---

*Document created: Feb 8, 2026*
*For: CS 6795 CalibrateMe Project*
