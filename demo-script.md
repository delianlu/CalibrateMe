# CalibrateMe — 5-Minute Video Demo Script

**CS 6795 Cognitive Science | Georgia Tech | Spring 2026**

> Press **`d`** to toggle the demo overlay in the app. Use **arrow keys** or click to navigate steps.

---

## Step 1: Introduction (0:00 – 0:30)
**Tab:** Practice

"CalibrateMe is a metacognitive calibration-aware adaptive learning system. It helps learners become aware of what they know and don't know — a skill called *calibration*. Unlike traditional spaced repetition systems, CalibrateMe measures confidence alongside correctness and adapts scheduling based on the gap between the two."

---

## Step 2: Vocabulary Flashcard Practice (0:30 – 1:15)
**Tab:** Practice

Do 2–3 flashcard items:
1. Show a flashcard, flip it, self-grade
2. **Point out the confidence slider** — "This 0–100 slider is the key input. We compare what learners *think* they know vs what they *actually* know."
3. Show session summary after completing items

---

## Step 3: Grammar Exercise (1:15 – 1:45)
**Tab:** Practice

Answer one grammar question:
- "OffGrid grammar exercises also collect confidence."
- "Our dual-process classifier uses response time to determine if each answer was *automatic* (System 1) or *deliberate* (System 2), following Kahneman's framework."

---

## Step 4: Analytics Dashboard (1:45 – 2:30)
**Tab:** Analytics

Show key visualizations:
- **Live Calibration Curve**: "Points above the diagonal = underconfidence, below = overconfidence. Perfect calibration would lie exactly on the diagonal."
- **ECE Meter**: "Expected Calibration Error quantifies miscalibration as a single number."
- **Confidence Histogram**: "Shows the distribution of confidence ratings."
- **Session History**: "ECE trend over sessions — this is how we measure calibration improvement."

---

## Step 5: Learner Classification (2:30 – 3:00)
**Tab:** Analytics

Scroll to the learner classification card:
- "Based on calibration patterns, we classify learners into 8 archetypes."
- "Each archetype gets tailored scaffolding — overconfident learners get reflection prompts, underconfident learners get encouragement."

---

## Step 6: Simulation Lab — Single Run (3:00 – 3:30)
**Tab:** Sim Lab

1. Select "Med-Over" profile (medium ability, overconfident)
2. Click "Run Simulation"
3. Show results:
   - "K* (true knowledge) vs K̂ (system's belief) converging"
   - "ECE decreasing over sessions"
   - "Retention metrics at 1, 7, and 30 days"

---

## Step 7: Scheduler Comparison (3:30 – 4:00)
**Tab:** Sim Lab

1. Click "Compare All Schedulers"
2. Show comparison charts:
   - "CalibrateMe vs SM-2, BKT-only, and decay-based baselines"
   - "For miscalibrated learners, CalibrateMe shows significant retention advantages"
   - "For well-calibrated learners, performance is comparable — validating calibration as the key variable"

---

## Step 8: Advanced Analytics — Ablation (4:00 – 4:30)
**Tab:** Sim Lab → Advanced Analytics

1. Click "Advanced Analytics" then "Run Ablation"
2. Show the ablation table:
   - "30 seeds per condition with 95% CIs and Cohen's d effect sizes"
   - "Six conditions test each component: full system, no dual-process, no scaffolding, calibration-only, SM-2, BKT"
   - "This supports our three hypotheses: H1, H2, H3"

---

## Step 9: Dose-Response & Sensitivity (4:30 – 4:50)
**Tab:** Sim Lab → Advanced Analytics

Show the advanced visualizations:
- **δ Dose-Response**: "How scaffolding intensity affects outcomes across profiles"
- **Sensitivity Heatmap**: "Which parameters the system is robust or sensitive to"
- "All charts exportable as PNG/SVG for the IEEE paper"

---

## Step 10: Conclusion (4:50 – 5:00)

"CalibrateMe demonstrates that calibration-aware scheduling improves retention for miscalibrated learners while maintaining performance for well-calibrated ones. The system includes dual-process classification, adaptive scaffolding, and comprehensive statistical analysis — all reproducible via multi-seed Monte Carlo simulations."

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `d` | Toggle demo overlay |
| `→` / `Space` | Next step |
| `←` | Previous step |
| `Esc` | Close overlay |
