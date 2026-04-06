// =============================================================================
// Crammer Stress Test
// Stress-tests CalibrateMe vs. baselines on the `Crammer` profile — a learner
// with high overconfidence (β* = 0.30), fast forgetting (λ = 0.25), slow
// learning (α = 0.10), and noisy confidence. This is the adversarial case for
// any scheduler that trusts raw confidence signals.
//
// Run: npx tsx scripts/runCrammerStressTest.ts
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
  DEFAULT_SIMULATION_CONFIG,
  SimulationConfig,
  SchedulerType,
} from '../src/types';
import { createLearnerProfile } from '../src/profiles/learnerProfiles';
import { runSimulation } from '../src/simulation/simulationEngine';
import {
  computeStats,
  computeEffectSize,
  StatisticalResult,
  EffectSize,
} from '../src/simulation/statisticalAnalysis';
import {
  AblationCondition,
  DEFAULT_CONDITIONS,
} from '../src/simulation/ablationRunner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROFILE_NAME = 'Crammer';
const N_SEEDS = 30;

const BASE_CONFIG: SimulationConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 100,
  num_sessions: 30,
  items_per_session: 20,
};

const CONDITIONS: AblationCondition[] = DEFAULT_CONDITIONS;

const RESULTS_DIR = path.resolve(__dirname, '..', 'results');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

interface CrammerConditionSummary {
  condition: string;
  retention_1day: StatisticalResult;
  retention_7day: StatisticalResult;
  retention_30day: StatisticalResult;
  retention_decay_7_to_30: StatisticalResult; // ret7 - ret30 (memory leakage)
  final_ece: StatisticalResult;
  mean_ece_last3: StatisticalResult;
  time_to_mastery: StatisticalResult;
  scaffolds_per_session: StatisticalResult;
  overconfidence_gap: StatisticalResult; // mean_confidence - accuracy (final session)
  vs_sm2_retention7: EffectSize | null;
  vs_sm2_ece: EffectSize | null;
}

function summarizeSeeds(
  condition: string,
  seedRuns: ReturnType<typeof runSimulation>[],
  sm2Retention7?: number[],
  sm2Ece?: number[]
): CrammerConditionSummary {
  const ret1 = seedRuns.map(r => r.retention_1day);
  const ret7 = seedRuns.map(r => r.retention_7day);
  const ret30 = seedRuns.map(r => r.retention_30day);
  const decay = seedRuns.map(r => r.retention_7day - r.retention_30day);

  const finalEce = seedRuns.map(r => {
    const last = r.session_data[r.session_data.length - 1];
    return last ? last.ece : 0;
  });
  const meanEceLast3 = seedRuns.map(r => {
    const tail = r.session_data.slice(-3);
    if (tail.length === 0) return 0;
    return tail.reduce((s, d) => s + d.ece, 0) / tail.length;
  });

  const mastery = seedRuns.map(r => r.time_to_mastery);

  const scaffoldsPerSession = seedRuns.map(r => {
    const total = r.session_data.reduce((s, d) => s + d.scaffolds_delivered, 0);
    return total / Math.max(1, r.session_data.length);
  });

  // Overconfidence gap at final session: confidence − correctness proxy (from K*).
  const overconfGap = seedRuns.map(r => {
    const last = r.session_data[r.session_data.length - 1];
    if (!last) return 0;
    const acc = last.items_reviewed > 0 ? last.correct_count / last.items_reviewed : 0;
    return last.mean_confidence - acc;
  });

  const isSm2 = condition === 'SM-2 Baseline';
  return {
    condition,
    retention_1day: computeStats(ret1),
    retention_7day: computeStats(ret7),
    retention_30day: computeStats(ret30),
    retention_decay_7_to_30: computeStats(decay),
    final_ece: computeStats(finalEce),
    mean_ece_last3: computeStats(meanEceLast3),
    time_to_mastery: computeStats(mastery),
    scaffolds_per_session: computeStats(scaffoldsPerSession),
    overconfidence_gap: computeStats(overconfGap),
    vs_sm2_retention7: !isSm2 && sm2Retention7 ? computeEffectSize(ret7, sm2Retention7) : null,
    vs_sm2_ece: !isSm2 && sm2Ece ? computeEffectSize(sm2Ece, finalEce) : null, // lower ECE better
  };
}

function toCSV(rows: CrammerConditionSummary[]): string {
  const headers = [
    'profile', 'condition', 'n_seeds',
    'retention_1day_mean', 'retention_1day_sd', 'retention_1day_ci_lo', 'retention_1day_ci_hi',
    'retention_7day_mean', 'retention_7day_sd', 'retention_7day_ci_lo', 'retention_7day_ci_hi',
    'retention_30day_mean', 'retention_30day_sd',
    'retention_decay_7_to_30_mean', 'retention_decay_7_to_30_sd',
    'final_ece_mean', 'final_ece_sd',
    'mean_ece_last3_mean', 'mean_ece_last3_sd',
    'time_to_mastery_mean', 'time_to_mastery_sd',
    'scaffolds_per_session_mean', 'scaffolds_per_session_sd',
    'overconfidence_gap_mean', 'overconfidence_gap_sd',
    'cohens_d_retention_vs_sm2', 'effect_interpretation_retention',
    'cohens_d_ece_vs_sm2', 'effect_interpretation_ece',
  ];

  const lines = rows.map(r => [
    PROFILE_NAME, r.condition, N_SEEDS.toString(),
    r.retention_1day.mean.toFixed(6), r.retention_1day.sd.toFixed(6),
    r.retention_1day.ci95_lower.toFixed(6), r.retention_1day.ci95_upper.toFixed(6),
    r.retention_7day.mean.toFixed(6), r.retention_7day.sd.toFixed(6),
    r.retention_7day.ci95_lower.toFixed(6), r.retention_7day.ci95_upper.toFixed(6),
    r.retention_30day.mean.toFixed(6), r.retention_30day.sd.toFixed(6),
    r.retention_decay_7_to_30.mean.toFixed(6), r.retention_decay_7_to_30.sd.toFixed(6),
    r.final_ece.mean.toFixed(6), r.final_ece.sd.toFixed(6),
    r.mean_ece_last3.mean.toFixed(6), r.mean_ece_last3.sd.toFixed(6),
    r.time_to_mastery.mean.toFixed(2), r.time_to_mastery.sd.toFixed(2),
    r.scaffolds_per_session.mean.toFixed(4), r.scaffolds_per_session.sd.toFixed(4),
    r.overconfidence_gap.mean.toFixed(6), r.overconfidence_gap.sd.toFixed(6),
    r.vs_sm2_retention7 ? r.vs_sm2_retention7.cohens_d.toFixed(4) : 'N/A',
    r.vs_sm2_retention7 ? r.vs_sm2_retention7.interpretation : 'N/A',
    r.vs_sm2_ece ? r.vs_sm2_ece.cohens_d.toFixed(4) : 'N/A',
    r.vs_sm2_ece ? r.vs_sm2_ece.interpretation : 'N/A',
  ].join(','));

  return [headers.join(','), ...lines].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  ensureDir(RESULTS_DIR);

  console.log('\n========================================');
  console.log('CRAMMER STRESS TEST');
  console.log(`   Profile: ${PROFILE_NAME}`);
  console.log(`   ${CONDITIONS.length} conditions × ${N_SEEDS} seeds = ${CONDITIONS.length * N_SEEDS} simulations`);
  console.log('========================================');

  const start = Date.now();

  // Run all conditions across seeds
  const runsByCondition = new Map<string, ReturnType<typeof runSimulation>[]>();

  let completed = 0;
  const total = CONDITIONS.length * N_SEEDS;

  for (const condition of CONDITIONS) {
    const runs: ReturnType<typeof runSimulation>[] = [];

    for (let seed = 0; seed < N_SEEDS; seed++) {
      const profile = createLearnerProfile(PROFILE_NAME, BASE_CONFIG.num_items);
      const config: SimulationConfig = {
        ...BASE_CONFIG,
        ...condition.config,
        random_seed: seed + 1,
      };
      runs.push(runSimulation(profile, config));

      completed++;
      const pct = (completed / total) * 100;
      if (Math.floor(pct) % 10 === 0) {
        process.stdout.write(`\r  Crammer stress: ${pct.toFixed(0)}% — ${condition.name} seed ${seed + 1}    `);
      }
    }

    runsByCondition.set(condition.name, runs);
  }
  console.log('\r  Crammer stress: 100% — Complete                                     ');

  // SM-2 baselines for effect sizes
  const sm2Runs = runsByCondition.get('SM-2 Baseline') ?? [];
  const sm2Ret7 = sm2Runs.map(r => r.retention_7day);
  const sm2Ece = sm2Runs.map(r => {
    const last = r.session_data[r.session_data.length - 1];
    return last ? last.ece : 0;
  });

  const summaries: CrammerConditionSummary[] = CONDITIONS.map(c =>
    summarizeSeeds(c.name, runsByCondition.get(c.name)!, sm2Ret7, sm2Ece)
  );

  const csv = toCSV(summaries);
  const outPath = path.join(RESULTS_DIR, 'crammer_stress_test.csv');
  fs.writeFileSync(outPath, csv, 'utf-8');
  console.log(`\n  ✓ Wrote ${outPath} (${summaries.length + 1} rows)`);

  // Console summary of headline numbers
  console.log('\n  Headline results (7-day retention):');
  for (const s of summaries) {
    const d = s.vs_sm2_retention7 ? ` (d=${s.vs_sm2_retention7.cohens_d.toFixed(2)} ${s.vs_sm2_retention7.interpretation})` : '';
    console.log(`    ${s.condition.padEnd(22)} ret7=${s.retention_7day.mean.toFixed(3)}  ece=${s.final_ece.mean.toFixed(3)}  decay7→30=${s.retention_decay_7_to_30.mean.toFixed(3)}${d}`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n  Completed in ${elapsed}s (${total} simulations)\n`);
}

main();
