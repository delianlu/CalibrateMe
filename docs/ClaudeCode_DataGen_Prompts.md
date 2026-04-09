# CalibrateMe: Claude Code Prompts — All 10 Tasks
## Date: March 12, 2026
## CS 6795 - Cognitive Science | Georgia Tech | Spring 2026

---

## Prompt 1: Run All Analyses and Export as CSV/JSON

### Context

We have 4 analysis modules ready but haven't run them to collect actual data:
- `src/simulation/ablationRunner.ts` — 6 conditions × profiles × seeds
- `src/simulation/sensitivityAnalysis.ts` — 5 parameter sweeps
- `src/simulation/deltaSweep.ts` — δ dose-response
- Expanded profiles in `src/profiles/learnerProfiles.ts` (6 new profiles)

I need to run all analyses programmatically (not through the UI) and export results as CSV files that can be used in the IEEE final report. The results should be saved to a `results/` directory.

### Task

Create a Node.js script `scripts/runAllAnalyses.ts` that:

1. **Ablation Study (Core Profiles)**
   - Run ablationRunner with 30 seeds across ALL 9 core profiles and 6 conditions
   - Export as `results/ablation_core_profiles.csv`
   - Columns: profile, condition, metric, mean, sd, ci95_lower, ci95_upper, n, cohens_d_vs_sm2, effect_interpretation
   - Metrics to include: retention_7day, final_ece, brier_score, accuracy, time_to_mastery, review_efficiency

2. **Ablation Study (Extended Profiles)**
   - Same analysis on the 6 new extended profiles with 30 seeds
   - Export as `results/ablation_extended_profiles.csv`
   - Same column format

3. **Sensitivity Analysis**
   - Run all 5 parameter sweeps (λ, s, g, σ_c, β*) with 10 seeds per combination
   - Use the 3 representative profiles: Med-Over, Med-Under, Med-Cal (to keep runtime reasonable)
   - Export as `results/sensitivity_lambda.csv`, `results/sensitivity_slip.csv`, `results/sensitivity_guess.csv`, `results/sensitivity_noise.csv`, `results/sensitivity_beta.csv`
   - Columns: parameter_value, profile, cm_retention_mean, cm_retention_ci_lower, cm_retention_ci_upper, sm2_retention_mean, sm2_retention_ci_lower, sm2_retention_ci_upper, advantage_mean, advantage_ci_lower, advantage_ci_upper

4. **δ Dose-Response**
   - Run δ sweep [0.00, 0.01, 0.02, 0.03, 0.05, 0.08, 0.10, 0.15] with 15 seeds per combination
   - All 9 core profiles
   - Export as `results/delta_sweep.csv`
   - Columns: delta, profile, final_ece_mean, final_ece_sd, retention_7day_mean, retention_7day_sd, time_to_mastery_mean, time_to_mastery_sd, scaffold_count_mean, scaffold_count_sd

5. **Summary JSON**
   - Export a `results/summary.json` with:
     - Total runs completed
     - Timestamp
     - Config used (seeds, profiles, conditions)
     - Key headline numbers (e.g., "best Cohen's d", "strongest sensitivity parameter")

### Requirements
- The script must run via `npx ts-node scripts/runAllAnalyses.ts` or `npx tsx scripts/runAllAnalyses.ts`
- Print progress to console (e.g., "Ablation: 540/1620 runs complete...")
- Handle the simulation modules in Node.js (they are pure TypeScript with no DOM dependencies)
- If any module requires browser APIs (localStorage, IndexedDB), mock or bypass them
- Create `results/` directory if it doesn't exist
- Total runtime estimate: 30-90 minutes depending on hardware. That's acceptable.

### Output
After running, the `results/` directory should contain:
```
results/
  ablation_core_profiles.csv
  ablation_extended_profiles.csv
  sensitivity_lambda.csv
  sensitivity_slip.csv
  sensitivity_guess.csv
  sensitivity_noise.csv
  sensitivity_beta.csv
  delta_sweep.csv
  summary.json
```

---

## Prompt 2: Auto-Generate LaTeX Tables from CSV Results

### Context

After running the analyses (Prompt 1), I have CSV files in `results/`. I need to convert these into publication-ready LaTeX tables formatted for an IEEE conference paper. The tables should use `booktabs` style (toprule/midrule/bottomrule), `scriptsize` font, and tight `tabcolsep` to fit in IEEE two-column layout.

### Task

Create a Node.js script `scripts/generateLatexTables.ts` that reads the CSV files and outputs `.tex` files.

### Table 1: Ablation Results (Core Profiles)

Read `results/ablation_core_profiles.csv` and generate `results/latex/table_ablation.tex`.

Format:
```latex
\begin{table}[t]
\centering
\scriptsize
\setlength{\tabcolsep}{2.5pt}
\caption{Ablation Study: 7-Day Retention (Mean $\pm$ 95\% CI) and Effect Size vs.\ SM-2}
\label{tab:ablation}
\begin{tabular}{lcccc}
\toprule
\textbf{Profile} & \textbf{Full CM} & \textbf{No DP} & \textbf{No Scaff.} & \textbf{Cal. Only} \\
\midrule
\multicolumn{5}{l}{\textit{H1: Overconfident}} \\
High-Over & 87.0 $\pm$ 0.8 & 86.2 $\pm$ 0.9 & 85.8 $\pm$ 0.7 & 84.1 $\pm$ 1.0 \\
... etc ...
\bottomrule
\end{tabular}
\end{table}
```

Rules:
- Group profiles by hypothesis (H1: Overconfident, H2: Underconfident, H3: Well-calibrated) using `\midrule` and `\textit` labels
- Show retention as `mean ± CI_half_width` (where CI_half_width = ci95_upper - mean, rounded to 1 decimal)
- SM-2 baseline column shows absolute values; other columns show values
- Below the table, add a row or footnote with Cohen's d vs. SM-2 for the Full CM column
- Do NOT include the BKT-Only condition (save space; SM-2 is the main baseline)

### Table 2: Sensitivity Summary

Read all 5 sensitivity CSVs and generate `results/latex/table_sensitivity.tex`.

Format: A compact table showing, for each parameter, the range over which CalibrateMe's advantage is positive (with CI not crossing zero).

```latex
\begin{table}[t]
\centering
\scriptsize
\setlength{\tabcolsep}{3pt}
\caption{Sensitivity Analysis: Parameter Ranges Where CalibrateMe Maintains Positive Retention Advantage}
\label{tab:sensitivity}
\begin{tabular}{lccc}
\toprule
\textbf{Parameter} & \textbf{Sweep Range} & \textbf{Robust Range} & \textbf{Peak Advantage} \\
\midrule
Forgetting rate ($\lambda$) & 0.03--0.20 & 0.05--0.15 & +2.8\% at $\lambda$=0.10 \\
... etc ...
\bottomrule
\end{tabular}
\end{table}
```

For each parameter:
- "Sweep Range" = full range tested
- "Robust Range" = range where the mean advantage is positive AND the lower CI bound is > 0 (for Med-Over profile as representative)
- "Peak Advantage" = maximum mean advantage and the parameter value where it occurs

### Table 3: δ Dose-Response Summary

Read `results/delta_sweep.csv` and generate `results/latex/table_delta.tex`.

Format:
```latex
\begin{table}[t]
\centering
\scriptsize
\setlength{\tabcolsep}{3pt}
\caption{Scaffolding Dose-Response: ECE and Retention by $\delta$ (Overconfident Profiles)}
\label{tab:delta}
\begin{tabular}{ccccc}
\toprule
$\delta$ & \textbf{ECE (\%)} & \textbf{Ret. (\%)} & \textbf{Mastery (sess.)} & \textbf{Scaffolds} \\
\midrule
0.00 & 18.2 $\pm$ 1.1 & 79.5 $\pm$ 0.6 & 12.3 $\pm$ 0.8 & 0.0 \\
0.01 & ... \\
... etc ...
\bottomrule
\end{tabular}
\end{table}
```

Show one representative profile group (overconfident, averaged across High-Over + Med-Over + Low-Over) for compactness. Include all 4 metrics.

### Table 4: Extended Profiles Results

Read `results/ablation_extended_profiles.csv` and generate `results/latex/table_extended.tex`.

Format: Similar to Table 1 but showing only Full CalibrateMe vs. SM-2 for the 6 extended profiles.

### Requirements
- Run via `npx tsx scripts/generateLatexTables.ts`
- Read CSVs using `fs` (no external dependencies needed for basic CSV parsing)
- Output files to `results/latex/` directory
- Round all values to 1 decimal place
- Use `$\pm$` for CI notation
- All tables should compile in a standard IEEE LaTeX document with `booktabs` package

### Output
```
results/latex/
  table_ablation.tex
  table_sensitivity.tex
  table_delta.tex
  table_extended.tex
```

---

## Prompt 3: Write Tests for New Statistical Modules

### Context

The original codebase has 7 test files with 54 passing tests covering the core engine modules (BKT, dual-process, forgetting, response generator, scheduler, scoring, simulation). The new statistical and analysis modules have ZERO tests:

- `src/simulation/statisticalAnalysis.ts` — computes CIs and effect sizes
- `src/simulation/ablationRunner.ts` — orchestrates multi-seed ablation
- `src/simulation/sensitivityAnalysis.ts` — parameter sweeps
- `src/simulation/deltaSweep.ts` — δ dose-response
- `src/features/analytics/longitudinalAnalysis.ts` — trend detection
- `src/features/analytics/patternAnalysis.ts` — confidence-bin patterns
- `src/features/analytics/learnerInsights.ts` — archetype classification
- `src/features/analytics/scaffoldingImpact.ts` — scaffolding effectiveness

These modules compute the numbers that go into the IEEE final report. If any computation is wrong, the entire Results section is invalid. Tests are essential.

### Task

Create test files in the `tests/` directory. Use the same testing framework as existing tests (Jest).

### Test File 1: `tests/statisticalAnalysis.test.ts`

This is the MOST IMPORTANT test file because every other module depends on it.

Test cases:
1. **`computeStats` with known values:**
   - Input: [2, 4, 6, 8, 10] → mean should be 6.0, SD should be ~3.16
   - Verify CI contains the mean
   - Verify CI width shrinks with larger n (test with n=5 vs n=100)

2. **`computeStats` edge cases:**
   - Single value: [5.0] → mean = 5.0, SD = 0, CI should handle gracefully (not NaN/Infinity)
   - All identical: [3, 3, 3, 3] → SD = 0, CI lower = CI upper = mean
   - Two values: [0, 10] → mean = 5.0, verify CI is wide

3. **`computeEffectSize` with known values:**
   - Group1 = [10, 10, 10], Group2 = [0, 0, 0] → Cohen's d should be very large, interpretation = "large"
   - Group1 = [5.0, 5.1, 4.9], Group2 = [5.0, 5.1, 4.9] → d ≈ 0, interpretation = "negligible"
   - Group1 = [6, 7, 8], Group2 = [5, 6, 7] → d should be positive, check interpretation thresholds

4. **Cohen's d interpretation thresholds:**
   - |d| < 0.20 → "negligible"
   - 0.20 ≤ |d| < 0.50 → "small"
   - 0.50 ≤ |d| < 0.80 → "medium"
   - |d| ≥ 0.80 → "large"

5. **Statistical correctness:**
   - For a known dataset, manually compute the 95% CI using the t-distribution and verify the function matches
   - Use t-value for df=4 (n=5): t ≈ 2.776

### Test File 2: `tests/ablationRunner.test.ts`

Test cases:
1. **Runs without errors:** Run ablation with 2 seeds, 1 profile, all 6 conditions. Verify it returns results for all conditions.
2. **Result structure:** Verify each AblationComparison has all required fields (retention_7day, final_ece, etc.)
3. **Seed reproducibility:** Run with seed=42 twice. Results should be identical.
4. **Effect size signs:** For overconfident profiles, CalibrateMe retention should be ≥ SM-2 retention (positive Cohen's d), based on H1.
5. **CSV export:** Call `ablationToCSV()` and verify the output is valid CSV with correct headers.

### Test File 3: `tests/sensitivityAnalysis.test.ts`

Test cases:
1. **Runs without errors:** Run sensitivity for one parameter (λ), 2 seeds, 1 profile.
2. **Result count:** Verify number of results = number of parameter values × number of profiles.
3. **Monotonic relationship:** For β* sweep from -0.30 to +0.30, CalibrateMe's advantage should generally increase as β* increases (more overconfident = more benefit from calibration correction).

### Test File 4: `tests/deltaSweep.test.ts`

Test cases:
1. **Runs without errors:** Run δ sweep with 2 seeds, 1 profile.
2. **δ = 0 matches no-scaffolding:** Results at δ=0.00 should show zero scaffold count.
3. **ECE decreases with δ:** For overconfident profiles, higher δ should generally produce lower final ECE.

### Test File 5: `tests/longitudinalAnalysis.test.ts`

Test cases:
1. **Improving trend detection:** Pass sessions with decreasing ECE values. Verify trend direction = "improving".
2. **Declining trend detection:** Pass sessions with increasing ECE values. Verify trend direction = "declining".
3. **Stable detection:** Pass sessions with near-constant ECE. Verify trend direction = "stable".
4. **Phase classification:** Pass sessions where final K* = 0.95. Verify phase = "mastered".

### Test File 6: `tests/patternAnalysis.test.ts`

Test cases:
1. **Confidence bin assignment:** Verify responses with confidence 0.85 land in the 80-100% bin.
2. **Dual-process ratio:** If all responses are fast + high-confidence + correct, Type 1 ratio should be high.

### Test File 7: `tests/learnerInsights.test.ts`

Test cases:
1. **Archetype classification:** Profile with K* > 0.9 and |β*| < 0.08 → "Calibrated Expert".
2. **Overconfident detection:** Profile with β* = 0.25 → classification includes "overconfident".
3. **Strength/weakness detection:** Profile with accuracy > 80% should have accuracy listed as a strength.

### Requirements
- Use Jest (same as existing test suite)
- All tests must pass with `npm test`
- Import from the actual source files (not mocks)
- Keep test runtimes short: use 2 seeds for anything that runs simulations
- Follow existing test file naming convention: `tests/moduleName.test.ts`

### Output
```
tests/
  statisticalAnalysis.test.ts    (new)
  ablationRunner.test.ts         (new)
  sensitivityAnalysis.test.ts    (new)
  deltaSweep.test.ts             (new)
  longitudinalAnalysis.test.ts   (new)
  patternAnalysis.test.ts        (new)
  learnerInsights.test.ts        (new)
  ... (existing 7 test files unchanged)
```

Expected: 14 test files total, ~90-110 tests, all passing.

---

## Prompt 4: GitHub Repository Preparation

### Context

The final report requires a GitHub repository with documentation (Task 40 in the research plan). The professor and TAs may look at this. It should look professional, explain the project clearly, and make it easy to run the app locally.

### Task

Prepare the repository for public presentation.

### Step 1: Create `README.md`

Structure:

```markdown
# CalibrateMe: Metacognitive Calibration in Adaptive Learning

A calibration-aware adaptive learning system that integrates metacognitive calibration accuracy into spaced repetition scheduling. Built for CS 6795 (Introduction to Cognitive Science) at Georgia Tech, Spring 2026.

## Research Question

How does incorporating metacognitive calibration accuracy into spaced repetition scheduling affect simulated learning outcomes compared to scheduling that ignores calibration errors?

## Cognitive Science Foundations

CalibrateMe integrates five cognitive science principles:

1. **Metacognitive Monitoring & Control** (Nelson & Narens, 1990)
2. **Bayesian Knowledge Tracing** (Corbett & Anderson, 1995)
3. **Dual-Process Theory** (Evans & Stanovich, 2013)
4. **Desirable Difficulties** (Bjork & Bjork, 2011)
5. **Self-Regulated Learning** (Zimmerman, 2002)

## System Architecture

[Include the 5-layer pipeline description: inputs → calibration scoring → BKT → dual-process → scheduler → scaffolding → outputs]

## Key Features

- **Practice Mode**: Vocabulary flashcards and grammar exercises with confidence rating
- **Analytics Dashboard**: Calibration curve, ECE gauge, confidence distribution, retention forecast, forgetting curves
- **Simulation Lab**: Run experiments across 15 learner profiles and 4+ scheduling algorithms
- **Advanced Analytics**: Ablation studies with CIs, sensitivity heatmaps, δ dose-response, mastery comparison
- **Gamification**: XP, levels, streaks, achievements

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
\```bash
git clone https://github.com/[username]/calibrateme.git
cd calibrateme
npm install
\```

### Development
\```bash
npm run dev
\```

### Testing
\```bash
npm test
\```

### Build
\```bash
npm run build
\```

## Running Analyses

To generate the statistical results used in the IEEE report:

\```bash
npx tsx scripts/runAllAnalyses.ts
\```

Results are saved to `results/`. To generate LaTeX tables:

\```bash
npx tsx scripts/generateLatexTables.ts
\```

## Project Structure

[Brief directory tree showing src/bkt, src/calibration, src/memory, src/dualProcess, src/scheduler, src/scaffolding, src/simulation, src/features, src/profiles, tests/, scripts/, results/]

## Hypotheses

- **H1**: Overconfident learners benefit most from calibration-aware scheduling
- **H2**: Underconfident learners benefit moderately
- **H3**: Well-calibrated learners show minimal difference

## References

[List the 17 references from the midpoint report]

## Author

Erdem Acarkan — Georgia Institute of Technology, CS 6795, Spring 2026

## License

This project was developed for academic coursework.
```

### Step 2: Create `.gitignore`

Standard for a Vite + TypeScript + Node project:
```
node_modules/
dist/
.env
.DS_Store
*.log
results/*.csv
results/*.json
```

Note: CSV results should be gitignored (they're generated, not source). But `results/latex/` could be included since those are report artifacts.

### Step 3: Create `ARCHITECTURE.md`

A deeper technical document for anyone who wants to understand the codebase:

- Module dependency diagram (text-based)
- Data flow: Response → CalibrationScoring → BKT → DualProcess → Scheduler → Scaffolding
- Key type definitions (TrueLearnerState, SystemBelief, SimulationConfig)
- How K* and K̂ are separated at the type level
- How the simulation engine orchestrates experiments
- How the statistical analysis pipeline works

### Step 4: Clean up the repository

- Remove any debugging console.log statements from production code
- Verify all imports resolve correctly
- Ensure `npm run build` produces a clean output
- Ensure `npm test` passes all tests
- Remove any TODO comments that reference incomplete work (replace with FUTURE: if needed)

### Requirements
- README should be readable by someone who has never seen the project
- No mention of Claude, ChatGPT, or AI assistance
- Technical enough for a CS graduate student but not overwhelming
- All code examples should actually work if copy-pasted

### Output
```
README.md          (new or replaced)
ARCHITECTURE.md    (new)
.gitignore         (new or updated)
```

---
---

# MEDIUM VALUE — Strengthens the Presentation

---

## Prompt 5: Web Worker for Long Simulations

### Context

The ablation analysis runs 1,620+ simulations (6 conditions × 9 profiles × 30 seeds). The sensitivity analysis adds ~4,500 more. When run through the browser UI, these block the main thread for minutes, freezing the entire application. The user sees an unresponsive page with no feedback.

The analysis modules (`ablationRunner.ts`, `sensitivityAnalysis.ts`, `deltaSweep.ts`) are pure TypeScript with no DOM dependencies, which makes them ideal candidates for a Web Worker.

### Task

Create a Web Worker that runs simulation analyses off the main thread.

**Step 1: Create `src/workers/simulationWorker.ts`**

The worker should:
- Accept messages with a `type` field: `"ablation"`, `"sensitivity"`, `"deltaSweep"`
- Accept the relevant config (seeds, profiles, conditions, parameter sweeps)
- Run the appropriate analysis module
- Post progress updates back to the main thread: `{ type: "progress", completed: number, total: number, currentTask: string }`
- Post final results: `{ type: "result", data: AblationResults | SensitivityReport[] | DeltaSweepReport }`
- Post errors: `{ type: "error", message: string }`

**Step 2: Create `src/workers/useSimulationWorker.ts`**

A React hook that wraps the worker:

```typescript
interface UseSimulationWorker {
  isRunning: boolean;
  progress: { completed: number; total: number; currentTask: string } | null;
  runAblation: (config: AblationConfig) => Promise<AblationResults>;
  runSensitivity: (config: SensitivityConfig) => Promise<SensitivityReport[]>;
  runDeltaSweep: (config: DeltaSweepConfig) => Promise<DeltaSweepReport>;
  cancel: () => void;
}
```

The hook should:
- Create/terminate the worker on mount/unmount
- Track progress state from worker messages
- Return a promise that resolves when the worker posts results
- Support cancellation (terminate the worker and create a new one)

**Step 3: Update `advancedAnalyticsStore.ts`**

Replace direct calls to `runAblation()` etc. with calls through the worker hook. The store should:
- Show a progress bar with percentage and current task description
- Allow cancellation
- Remain responsive while analysis runs

**Step 4: Add progress UI to `Dashboard.tsx`**

When an analysis is running:
- Show a progress bar with "Running ablation: 540/1620 (33%)..."
- Show a cancel button
- Disable other analysis buttons until current one completes

### Vite Configuration

Vite supports Web Workers natively:
```typescript
const worker = new Worker(new URL('./workers/simulationWorker.ts', import.meta.url), { type: 'module' });
```

No special config needed, but verify the worker file is included in the build output.

### Requirements
- The UI must remain fully interactive while simulations run
- Progress updates should fire at least every 10 simulations (not every single one, to avoid message overhead)
- Worker should be terminated on component unmount to prevent memory leaks
- All existing non-worker paths should still work (the Node.js script from Prompt 1 doesn't use workers)

### Output
```
src/workers/simulationWorker.ts    (new)
src/workers/useSimulationWorker.ts (new)
src/store/advancedAnalyticsStore.ts (modified)
src/components/Dashboard.tsx        (modified)
```

---

## Prompt 6: Export Charts as PNG/SVG

### Context

The IEEE final report and presentation slides need figures from the app's visualizations: sensitivity heatmap, dose-response curve, ablation chart, calibration curve, mastery comparison. Currently these render as Recharts components in the browser but cannot be exported as image files.

I need export buttons on key chart components so I can save publication-quality images directly.

### Task

**Step 1: Create `src/utils/chartExport.ts`**

A utility module with two export functions:

```typescript
// Exports a DOM element containing an SVG chart as a PNG file
export function exportAsPNG(elementId: string, filename: string, scale?: number): void

// Exports a DOM element containing an SVG chart as an SVG file  
export function exportAsSVG(elementId: string, filename: string): void
```

Implementation approach:
- For PNG: Use `html2canvas` or manually serialize the SVG to a canvas, then `canvas.toBlob()` → `URL.createObjectURL()` → trigger download. Use `scale = 2` by default for retina quality.
- For SVG: Serialize the SVG element with `new XMLSerializer().serializeToString()`, create a Blob, trigger download.

If `html2canvas` is too heavy, use the SVG serialization approach: Recharts renders SVG elements, so you can grab the `<svg>` from the container div, clone it with computed styles inlined, and export.

**Step 2: Create `src/components/ExportableChart.tsx`**

A wrapper component that adds export buttons to any chart:

```typescript
interface ExportableChartProps {
  id: string;           // unique DOM id for the chart container
  title: string;        // used as default filename
  children: ReactNode;  // the actual Recharts component
}
```

Renders:
- A container div with the given `id`
- The children (chart)
- A small button bar in the top-right corner: "PNG" and "SVG" buttons
- Buttons should be subtle (small, low opacity, full opacity on hover) so they don't clutter the chart

**Step 3: Wrap key chart components**

Add `ExportableChart` wrapper to:
- `SensitivityHeatmap.tsx` — id: `chart-sensitivity`
- `DoseResponseChart.tsx` — id: `chart-dose-response`
- `AblationTable.tsx` — id: `chart-ablation` (export the table as an image)
- `MasteryComparison.tsx` — id: `chart-mastery`
- `LiveCalibrationCurve.tsx` — id: `chart-calibration-curve`
- `SessionHistory.tsx` (ECE trend chart) — id: `chart-ece-trend`

### Requirements
- PNG exports should be at least 300 DPI equivalent (scale = 2 or 3) for print quality
- SVG exports should have all styles inlined (not relying on external CSS)
- Export should work in Chrome, Firefox, and Safari
- Filenames should be descriptive: e.g., `calibrateme_sensitivity_lambda.png`
- Install `html2canvas` if needed: `npm install html2canvas`

### Output
```
src/utils/chartExport.ts                 (new)
src/components/ExportableChart.tsx        (new)
src/features/simulation/components/*.tsx  (modified — 4 files)
src/features/analytics/components/*.tsx   (modified — 2 files)
```

---

## Prompt 7: Presentation-Ready Demo Script

### Context

The final presentation is a 5-minute recorded video (due April 19). I need to demonstrate the app's key features smoothly without fumbling through clicks during recording. A guided walkthrough mode would let me step through a scripted sequence of app states.

### Task

**Step 1: Create `src/features/demo/demoScript.ts`**

Define a sequence of demo steps:

```typescript
interface DemoStep {
  id: string;
  tab: string;              // which sidebar tab to navigate to
  title: string;            // overlay title shown during demo
  narration: string;        // text shown as narration guide (for the presenter, not shown to audience)
  action?: () => void;      // optional programmatic action (e.g., start a quiz, run simulation)
  duration: number;         // suggested pause duration in seconds before auto-advancing
  highlight?: string;       // CSS selector of element to highlight with a pulsing border
}
```

Demo script (approximately 5 minutes):

| Step | Tab | Title | Duration | Action |
|------|-----|-------|----------|--------|
| 1 | Practice | "CalibrateMe: A Calibration-Aware Learning System" | 10s | Show onboarding card |
| 2 | Practice | "Confidence Rating" | 15s | Start a quiz, show the confidence slider |
| 3 | Practice | "Session Feedback" | 15s | Show session summary with dual-process insights |
| 4 | Analytics | "Calibration Analytics" | 20s | Show full analytics dashboard |
| 5 | Analytics | "ECE Trend Over Sessions" | 15s | Highlight the ECE trend chart |
| 6 | Analytics | "Learner Classification" | 10s | Show the β̂ classification badge |
| 7 | Simulation Lab | "Simulation Lab" | 15s | Show profile selector and run a simulation |
| 8 | Simulation Lab | "Hypothesis Results" | 20s | Show H1/H2/H3 results |
| 9 | Simulation Lab | "Advanced Analytics" | 15s | Navigate to ablation table |
| 10 | Simulation Lab | "Sensitivity Analysis" | 15s | Show sensitivity heatmap |
| 11 | Simulation Lab | "Scaffolding Dose-Response" | 15s | Show δ chart |
| 12 | Simulation Lab | "Conclusion" | 10s | Show final report view |

**Step 2: Create `src/features/demo/components/DemoOverlay.tsx`**

A full-screen overlay that:
- Shows the current step title in large text at the top
- Shows the narration text in smaller text (presenter can read this while recording voiceover)
- Shows step counter: "3 / 12"
- Has "Next" and "Previous" buttons
- Has keyboard shortcuts: Right arrow = next, Left arrow = previous, Escape = exit demo
- Executes the step's `action` when entering that step
- Highlights the specified element with a pulsing CSS border
- Auto-advances after `duration` seconds if auto-play is enabled (toggle button)

**Step 3: Add demo mode entry point**

- Add a "Demo Mode" button to the app header (only visible in development mode, or behind a URL parameter like `?demo=true`)
- When activated, load the demo script and show the DemoOverlay
- The overlay should sit on top of the actual app content (semi-transparent backdrop with the highlighted area visible)

### Requirements
- Demo mode should NOT modify any user data or simulation state
- The overlay must be dismissable at any point
- Steps that involve "run a simulation" should use pre-cached results if available (from Prompt 1) to avoid waiting during the demo
- Keep the demo script editable so it can be adjusted during rehearsal

### Output
```
src/features/demo/demoScript.ts              (new)
src/features/demo/components/DemoOverlay.tsx  (new)
src/App.tsx or src/components/Header.tsx      (modified — add demo button)
src/App.css                                  (modified — overlay and highlight styles)
```

---
---

# LOWER VALUE — Nice but Not Essential

---

## Prompt 8: Accessibility Audit and Fixes

### Context

The project pitch mentioned accessibility as a design consideration. While not graded directly, demonstrating accessibility awareness reflects well in a cognitive science course where learner diversity is a relevant topic. The app currently has minimal ARIA attributes and no systematic keyboard navigation.

### Task

**Step 1: Audit current accessibility**

Run through each tab and document:
- Missing ARIA labels on interactive elements (buttons, sliders, inputs)
- Missing alt text on images
- Color contrast issues (especially in charts and badges)
- Keyboard navigation gaps (can every interactive element be reached with Tab?)
- Screen reader testing (does the confidence slider announce its value?)

**Step 2: Fix critical accessibility issues**

Priority fixes (don't over-engineer, just cover the basics):

1. **Confidence Slider**: Add `aria-label="Confidence rating"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`. Announce value changes to screen readers.

2. **Quiz Buttons**: Add `aria-label` to answer buttons. Add `role="status"` to feedback messages so screen readers announce correctness.

3. **Navigation Sidebar**: Ensure all tabs are reachable via keyboard. Add `aria-current="page"` to the active tab. Add `role="navigation"` to the sidebar.

4. **Charts**: Recharts SVGs are not accessible by default. Add `aria-label` to each chart container describing what the chart shows. Add a visually-hidden text summary for screen readers (e.g., "Calibration curve showing accuracy vs confidence for 20 responses").

5. **Color Contrast**: Check all badge colors (green/yellow/red for classification) meet WCAG AA contrast ratio (4.5:1). Adjust if needed.

6. **Focus Management**: After starting a quiz, move focus to the first interactive element. After submitting an answer, move focus to the feedback or next question.

7. **Skip Navigation**: Add a "Skip to main content" link at the top of the page for keyboard users.

**Step 3: Add `aria-live` regions**

- Session summary results: `aria-live="polite"` so screen readers announce completion
- ECE feedback messages: `aria-live="polite"`
- Scaffolding prompts: `aria-live="assertive"` (these are important metacognitive interventions)

### Requirements
- Do NOT break existing functionality or styling
- Do NOT add a full accessibility testing framework (overkill for this project)
- Focus on the 80/20: the fixes above cover the most impactful issues
- Test with keyboard-only navigation (Tab, Enter, Escape, Arrow keys)

### Output
```
Multiple component files modified (QuizContainer, ConfidenceSlider, SessionSummary, 
CalibrationDashboard, App, Sidebar, etc.)
No new files needed — this is modifications only.
```

---

## Prompt 9: Performance Profiling and Optimization

### Context

The Analytics dashboard loads all stored responses from IndexedDB on mount and recomputes ECE, Brier scores, confidence bins, and chart data on every render. With 500+ responses across multiple sessions, this could cause noticeable lag. The advanced analytics (ablation table, sensitivity heatmap) also render large datasets.

### Task

**Step 1: Profile current performance**

Add timing measurements to identify bottlenecks:

```typescript
// Add to CalibrationDashboard.tsx
const start = performance.now();
// ... existing computation ...
console.log(`Dashboard render: ${(performance.now() - start).toFixed(1)}ms`);
```

Key areas to profile:
- `CalibrationDashboard` initial render with 100, 500, 1000 responses
- `SessionHistory` with 5, 20, 50 sessions
- `AblationTable` with 9 profiles × 6 conditions
- `SensitivityHeatmap` with full sweep data
- `FinalReport` component with all analysis modules

**Step 2: Memoize expensive computations**

Wrap heavy computations in `useMemo`:

1. **ECE/Brier calculation in CalibrationDashboard**: Only recompute when `allResponses` length changes, not on every render.

2. **Session splitting in SessionHistory**: The 10-minute gap detection loops over all responses. Memoize with `allResponses.length` as dependency.

3. **Confidence bin grouping in PatternAnalysis**: Memoize the bin assignments.

4. **Ablation table rendering**: The `AblationTable` maps over results to create `StatCell` and `EffectCell` components. Memoize the mapped rows.

**Step 3: Virtualize long lists (if needed)**

If `SessionHistory` shows 50+ sessions and scrolling is janky:
- Use `react-window` or a simple manual virtualization: only render sessions visible in the viewport
- This is optional — only implement if profiling shows it's actually slow

**Step 4: Lazy-load heavy components**

The advanced analytics components (AblationTable, SensitivityHeatmap, DoseResponseChart, FinalReport) are large and only used in the Simulation Lab tab. Lazy-load them:

```typescript
const AblationTable = React.lazy(() => import('./features/simulation/components/AblationTable'));
const SensitivityHeatmap = React.lazy(() => import('./features/simulation/components/SensitivityHeatmap'));
```

Wrap in `<Suspense fallback={<LoadingSpinner />}>`.

**Step 5: Remove profiling code**

After optimizations are confirmed, remove the `console.log` timing statements or gate them behind a `DEBUG` flag.

### Requirements
- Do NOT prematurely optimize — profile first, then fix only what's actually slow
- Memoization dependencies must be correct (stale data is worse than slow data)
- All existing tests must still pass
- Build size should not increase significantly

### Output
```
Multiple component files modified (CalibrationDashboard, SessionHistory, 
AblationTable, Dashboard, etc.)
No new files needed unless using react-window.
```

---

## Prompt 10: Dark Mode Polish for New Components

### Context

The app has a dark mode toggle. The original components (Practice, Vocabulary, Analytics, Profile) are styled for both light and dark modes. However, the new components added in the recent revisions may not have dark mode styles:

- AblationTable (stat cells, effect badges)
- SensitivityHeatmap (grid cells, color coding)
- DoseResponseChart (chart background, axis labels)
- MasteryComparison (bar colors, labels)
- ScheduleComparison (timeline markers)
- LearnerClassification (badges, trend chart)
- SessionHistory (ECE trend chart, session table)
- OnboardingCard (background, text)
- FinalReport (all 10 sections, metric tiles, parameter cards)
- ErrorBoundary (error message styling)
- DemoOverlay (if implemented from Prompt 7)

### Task

**Step 1: Audit dark mode for all new components**

Switch to dark mode and screenshot each new component. Identify:
- White or light backgrounds that should be dark
- Dark text on dark backgrounds (invisible)
- Chart colors that don't contrast against dark backgrounds
- Badge colors that lose meaning in dark mode
- Borders that disappear

**Step 2: Add dark mode CSS rules**

The app uses a `body.dark-mode` or `[data-theme="dark"]` class (check which pattern exists). Add corresponding dark mode rules for each new component.

Common pattern:
```css
/* Light mode (default) */
.ablation-table__stat-cell {
  background: #f8f9fa;
  color: #333;
}

/* Dark mode */
body.dark-mode .ablation-table__stat-cell {
  background: #2a2a2a;
  color: #e0e0e0;
}
```

Key dark mode considerations:
- **Heatmap cells**: Green/gray/red should still be distinguishable on dark backgrounds. Use slightly lighter/more saturated variants.
- **Recharts**: Set `stroke`, `fill`, and `tick` colors to light values. Recharts supports inline styling — pass dark mode colors as props or via CSS variables.
- **Effect size badges**: Ensure "negligible" (gray), "small" (yellow), "medium" (blue), "large" (green) all contrast against dark backgrounds.
- **Tables**: Alternate row colors should work in both modes. Use `rgba()` for subtle striping.
- **Metric tiles/cards**: Border colors should be visible in both modes.

**Step 3: Use CSS variables (if not already)**

If the app doesn't already use CSS custom properties for theming, consider adding them to reduce duplication:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
}

body.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --text-primary: #e0e0e0;
  --text-secondary: #aaaaaa;
  --border-color: #404040;
}
```

Then use `var(--bg-primary)` throughout. This makes future theming much easier.

**Step 4: Test both modes end-to-end**

After adding dark mode styles:
- Toggle between light and dark mode on every tab
- Verify no text is invisible
- Verify all charts are readable
- Verify all badges/indicators are distinguishable
- Take screenshots of dark mode for potential use in the presentation (dark mode often looks better on slides)

### Requirements
- Every new component must be readable in both light and dark mode
- Do NOT change the dark mode toggle mechanism — only add CSS rules
- Recharts colors may need to be passed as props depending on theme — check how existing charts handle this
- All existing tests must still pass

### Output
```
src/App.css (modified — add dark mode rules for all new components)
Possibly individual component files if Recharts needs inline style changes
```

---
---

# EXECUTION ORDER

| Order | Prompt | Priority | Est. Time | Dependencies |
|-------|--------|----------|-----------|--------------|
| 1st | **Prompt 3: Tests** | High | 2-3h | None — run first to validate existing code |
| 2nd | **Prompt 1: Run Analyses** | Critical | 30-90min runtime | Tests should pass first |
| 3rd | **Prompt 2: LaTeX Tables** | Critical | 1h | Needs CSVs from Prompt 1 |
| 4th | **Prompt 5: Web Worker** | Medium | 3-4h | Independent |
| 5th | **Prompt 6: Chart Export** | Medium | 2-3h | Independent |
| 6th | **Prompt 10: Dark Mode** | Low | 2-3h | After all new components are stable |
| 7th | **Prompt 9: Performance** | Low | 2-3h | After all features are complete |
| 8th | **Prompt 8: Accessibility** | Low | 2-3h | After all UI is final |
| 9th | **Prompt 7: Demo Script** | Medium | 3-4h | After all features + dark mode are done |
| 10th | **Prompt 4: GitHub Repo** | High | 2-3h | LAST — after everything else is stable |
