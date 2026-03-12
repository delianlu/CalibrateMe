// =============================================================================
// Run All Analyses — Generates CSV/JSON for IEEE Final Report
// Run: npx tsx scripts/runAllAnalyses.ts
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { DEFAULT_SIMULATION_CONFIG, SimulationConfig } from '../src/types';
import { getCoreProfileNames } from '../src/profiles/learnerProfiles';
import {
  runAblationStudy,
  ablationToCSV,
  DEFAULT_CONDITIONS,
  AblationResults,
  AblationComparison,
} from '../src/simulation/ablationRunner';
import {
  runSensitivitySweep,
  DEFAULT_SWEEPS,
  SensitivityReport,
} from '../src/simulation/sensitivityAnalysis';
import {
  runDeltaSweep,
  DEFAULT_DELTAS,
  DeltaSweepReport,
  deltaSweepToCSV,
} from '../src/simulation/deltaSweep';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ABLATION_SEEDS = 30;
const SENSITIVITY_SEEDS = 10;
const DELTA_SEEDS = 15;

const BASE_CONFIG: SimulationConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 100,
  num_sessions: 30,
  items_per_session: 20,
};

const CORE_PROFILES = getCoreProfileNames();
const EXTENDED_PROFILES = [
  'Extreme-Over', 'Extreme-Under', 'Fast-Forget-Over',
  'Noisy-Confidence', 'HighAb-Extreme-Over', 'Minimal-Bias',
];
const SENSITIVITY_PROFILES = ['Med-Over', 'Med-Under', 'Med-Well'];

const RESULTS_DIR = path.resolve(__dirname, '..', 'results');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeCSV(filename: string, content: string): void {
  const filepath = path.join(RESULTS_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`  ✓ Wrote ${filepath} (${content.split('\n').length} rows)`);
}

function formatAblationCSV(results: AblationResults): string {
  const headers = [
    'profile', 'condition', 'metric', 'mean', 'sd',
    'ci95_lower', 'ci95_upper', 'n',
    'cohens_d_vs_sm2', 'effect_interpretation',
  ];

  const rows: string[] = [];
  const metrics: { key: keyof AblationComparison; label: string }[] = [
    { key: 'retention_7day', label: 'retention_7day' },
    { key: 'retention_1day', label: 'retention_1day' },
    { key: 'retention_30day', label: 'retention_30day' },
    { key: 'ece', label: 'final_ece' },
    { key: 'time_to_mastery', label: 'time_to_mastery' },
    { key: 'review_efficiency', label: 'review_efficiency' },
  ];

  for (const comp of results.comparisons) {
    for (const { key, label } of metrics) {
      const stat = comp[key] as { mean: number; sd: number; ci95_lower: number; ci95_upper: number; n: number };
      const effectRet = key === 'retention_7day' ? comp.vs_sm2_retention : null;
      const effectEce = key === 'ece' ? comp.vs_sm2_ece : null;
      const effect = effectRet ?? effectEce;

      rows.push([
        comp.profile,
        comp.condition,
        label,
        stat.mean.toFixed(6),
        stat.sd.toFixed(6),
        stat.ci95_lower.toFixed(6),
        stat.ci95_upper.toFixed(6),
        stat.n.toString(),
        effect ? effect.cohens_d.toFixed(4) : 'N/A',
        effect ? effect.interpretation : 'N/A',
      ].join(','));
    }
  }

  return [headers.join(','), ...rows].join('\n');
}

function formatSensitivityCSV(report: SensitivityReport): string {
  const headers = [
    'parameter_value', 'profile',
    'cm_retention_mean', 'cm_retention_ci_lower', 'cm_retention_ci_upper',
    'sm2_retention_mean', 'sm2_retention_ci_lower', 'sm2_retention_ci_upper',
    'advantage_mean', 'advantage_ci_lower', 'advantage_ci_upper',
  ];

  const rows = report.results.map(r => [
    r.parameterValue.toFixed(4),
    r.profile,
    r.cm_retention.mean.toFixed(6),
    r.cm_retention.ci95_lower.toFixed(6),
    r.cm_retention.ci95_upper.toFixed(6),
    r.sm2_retention.mean.toFixed(6),
    r.sm2_retention.ci95_lower.toFixed(6),
    r.sm2_retention.ci95_upper.toFixed(6),
    r.retention_advantage.mean.toFixed(6),
    r.retention_advantage.ci95_lower.toFixed(6),
    r.retention_advantage.ci95_upper.toFixed(6),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

function formatDeltaCSV(report: DeltaSweepReport): string {
  const headers = [
    'delta', 'profile',
    'final_ece_mean', 'final_ece_sd',
    'retention_7day_mean', 'retention_7day_sd',
    'time_to_mastery_mean', 'time_to_mastery_sd',
    'scaffold_count_mean', 'scaffold_count_sd',
  ];

  const rows = report.results.map(r => [
    r.delta.toFixed(4),
    r.profile,
    r.final_ece.mean.toFixed(6),
    r.final_ece.sd.toFixed(6),
    r.retention_7day.mean.toFixed(6),
    r.retention_7day.sd.toFixed(6),
    r.time_to_mastery.mean.toFixed(2),
    r.time_to_mastery.sd.toFixed(2),
    r.scaffold_count.mean.toFixed(2),
    r.scaffold_count.sd.toFixed(2),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const startTime = Date.now();
  ensureDir(RESULTS_DIR);

  let totalRuns = 0;

  // =========================================================================
  // 1. Ablation Study — Core Profiles
  // =========================================================================
  console.log('\n========================================');
  console.log('1. ABLATION STUDY — CORE PROFILES');
  console.log(`   ${CORE_PROFILES.length} profiles × ${DEFAULT_CONDITIONS.length} conditions × ${ABLATION_SEEDS} seeds`);
  console.log('========================================');

  const coreAblation = runAblationStudy(
    ABLATION_SEEDS,
    BASE_CONFIG,
    DEFAULT_CONDITIONS,
    CORE_PROFILES,
    (pct, msg) => {
      if (Math.floor(pct) % 10 === 0) {
        process.stdout.write(`\r  Ablation (core): ${pct.toFixed(0)}% — ${msg}   `);
      }
    }
  );
  console.log('\r  Ablation (core): 100% — Complete                              ');
  writeCSV('ablation_core_profiles.csv', formatAblationCSV(coreAblation));
  totalRuns += CORE_PROFILES.length * DEFAULT_CONDITIONS.length * ABLATION_SEEDS;

  // =========================================================================
  // 2. Ablation Study — Extended Profiles
  // =========================================================================
  console.log('\n========================================');
  console.log('2. ABLATION STUDY — EXTENDED PROFILES');
  console.log(`   ${EXTENDED_PROFILES.length} profiles × ${DEFAULT_CONDITIONS.length} conditions × ${ABLATION_SEEDS} seeds`);
  console.log('========================================');

  const extAblation = runAblationStudy(
    ABLATION_SEEDS,
    BASE_CONFIG,
    DEFAULT_CONDITIONS,
    EXTENDED_PROFILES,
    (pct, msg) => {
      if (Math.floor(pct) % 10 === 0) {
        process.stdout.write(`\r  Ablation (ext): ${pct.toFixed(0)}% — ${msg}   `);
      }
    }
  );
  console.log('\r  Ablation (ext): 100% — Complete                               ');
  writeCSV('ablation_extended_profiles.csv', formatAblationCSV(extAblation));
  totalRuns += EXTENDED_PROFILES.length * DEFAULT_CONDITIONS.length * ABLATION_SEEDS;

  // =========================================================================
  // 3. Sensitivity Analysis — 5 Parameter Sweeps
  // =========================================================================
  console.log('\n========================================');
  console.log('3. SENSITIVITY ANALYSIS');
  console.log(`   ${DEFAULT_SWEEPS.length} parameters × ${SENSITIVITY_PROFILES.length} profiles × ${SENSITIVITY_SEEDS} seeds`);
  console.log('========================================');

  const sensitivityReports: SensitivityReport[] = [];
  const paramFileMap: Record<string, string> = {
    lambda: 'sensitivity_lambda.csv',
    slip_probability: 'sensitivity_slip.csv',
    guess_probability: 'sensitivity_guess.csv',
    confidence_noise_std: 'sensitivity_noise.csv',
    beta_star: 'sensitivity_beta.csv',
  };

  for (const sweep of DEFAULT_SWEEPS) {
    console.log(`\n  Sweeping ${sweep.parameterName} (${sweep.values.length} values)...`);
    const report = runSensitivitySweep(
      sweep,
      SENSITIVITY_SEEDS,
      BASE_CONFIG,
      SENSITIVITY_PROFILES,
      (pct, msg) => {
        if (Math.floor(pct) % 20 === 0) {
          process.stdout.write(`\r    ${sweep.parameterName}: ${pct.toFixed(0)}%   `);
        }
      }
    );
    console.log(`\r    ${sweep.parameterName}: 100% — Complete            `);

    sensitivityReports.push(report);
    const filename = paramFileMap[sweep.parameterName] ?? `sensitivity_${sweep.parameterName}.csv`;
    writeCSV(filename, formatSensitivityCSV(report));
    totalRuns += sweep.values.length * SENSITIVITY_PROFILES.length * 2 * SENSITIVITY_SEEDS;
  }

  // =========================================================================
  // 4. δ Dose-Response Sweep
  // =========================================================================
  console.log('\n========================================');
  console.log('4. δ DOSE-RESPONSE SWEEP');
  console.log(`   ${DEFAULT_DELTAS.length} δ values × ${CORE_PROFILES.length} profiles × ${DELTA_SEEDS} seeds`);
  console.log('========================================');

  const deltaSweep = runDeltaSweep(
    DEFAULT_DELTAS,
    DELTA_SEEDS,
    BASE_CONFIG,
    CORE_PROFILES,
    (pct, msg) => {
      if (Math.floor(pct) % 10 === 0) {
        process.stdout.write(`\r  δ sweep: ${pct.toFixed(0)}% — ${msg}   `);
      }
    }
  );
  console.log('\r  δ sweep: 100% — Complete                                      ');
  writeCSV('delta_sweep.csv', formatDeltaCSV(deltaSweep));
  totalRuns += DEFAULT_DELTAS.length * CORE_PROFILES.length * DELTA_SEEDS;

  // =========================================================================
  // 5. Summary JSON
  // =========================================================================
  console.log('\n========================================');
  console.log('5. GENERATING SUMMARY');
  console.log('========================================');

  // Find best Cohen's d from core ablation
  let bestCohenD = 0;
  let bestCohenProfile = '';
  let bestCohenCondition = '';
  for (const comp of coreAblation.comparisons) {
    if (comp.vs_sm2_retention && Math.abs(comp.vs_sm2_retention.cohens_d) > Math.abs(bestCohenD)) {
      bestCohenD = comp.vs_sm2_retention.cohens_d;
      bestCohenProfile = comp.profile;
      bestCohenCondition = comp.condition;
    }
  }

  // Find strongest sensitivity parameter
  let strongestParam = '';
  let strongestAdvantage = 0;
  for (const report of sensitivityReports) {
    for (const result of report.results) {
      if (Math.abs(result.retention_advantage.mean) > Math.abs(strongestAdvantage)) {
        strongestAdvantage = result.retention_advantage.mean;
        strongestParam = `${report.parameterName}=${result.parameterValue}`;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const summary = {
    timestamp: new Date().toISOString(),
    total_runs: totalRuns,
    elapsed_seconds: parseFloat(elapsed),
    config: {
      ablation_seeds: ABLATION_SEEDS,
      sensitivity_seeds: SENSITIVITY_SEEDS,
      delta_seeds: DELTA_SEEDS,
      core_profiles: CORE_PROFILES,
      extended_profiles: EXTENDED_PROFILES,
      sensitivity_profiles: SENSITIVITY_PROFILES,
      conditions: DEFAULT_CONDITIONS.map(c => c.name),
      deltas: DEFAULT_DELTAS,
      base_config: {
        num_items: BASE_CONFIG.num_items,
        num_sessions: BASE_CONFIG.num_sessions,
        items_per_session: BASE_CONFIG.items_per_session,
      },
    },
    headlines: {
      best_cohens_d: {
        value: parseFloat(bestCohenD.toFixed(4)),
        profile: bestCohenProfile,
        condition: bestCohenCondition,
      },
      strongest_sensitivity: {
        parameter: strongestParam,
        advantage: parseFloat(strongestAdvantage.toFixed(4)),
      },
    },
    files_generated: [
      'ablation_core_profiles.csv',
      'ablation_extended_profiles.csv',
      'sensitivity_lambda.csv',
      'sensitivity_slip.csv',
      'sensitivity_guess.csv',
      'sensitivity_noise.csv',
      'sensitivity_beta.csv',
      'delta_sweep.csv',
      'summary.json',
    ],
  };

  const summaryPath = path.join(RESULTS_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`  ✓ Wrote ${summaryPath}`);

  // =========================================================================
  // Done
  // =========================================================================
  console.log('\n========================================');
  console.log(`COMPLETE — ${totalRuns} simulations in ${elapsed}s`);
  console.log(`Results saved to: ${RESULTS_DIR}/`);
  console.log('========================================\n');

  console.log('Files generated:');
  for (const file of summary.files_generated) {
    const filepath = path.join(RESULTS_DIR, file);
    if (fs.existsSync(filepath)) {
      const stat = fs.statSync(filepath);
      console.log(`  ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  }
}

main();
