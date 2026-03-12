// =============================================================================
// Run Threshold Sensitivity Analysis
// Run: npx tsx scripts/runThresholdSensitivity.ts
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { DEFAULT_SIMULATION_CONFIG, SimulationConfig, SchedulerType } from '../src/types';
import { createLearnerProfile, getCoreProfileNames } from '../src/profiles/learnerProfiles';
import { runSimulation } from '../src/simulation/simulationEngine';
import {
  runThresholdSensitivity, thresholdSensitivityToCSV,
  DEFAULT_THRESHOLD_SWEEPS, ProfileSimData,
} from '../src/simulation/thresholdSensitivity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_DIR = path.resolve(__dirname, '..', 'results');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main(): void {
  const startTime = Date.now();
  ensureDir(RESULTS_DIR);

  console.log('\n========================================');
  console.log('THRESHOLD SENSITIVITY ANALYSIS');
  console.log('========================================\n');

  const profileNames = getCoreProfileNames();
  const baseConfig: SimulationConfig = {
    ...DEFAULT_SIMULATION_CONFIG,
    num_items: 100, num_sessions: 30, items_per_session: 20,
    scheduler_type: SchedulerType.CALIBRATEME,
    enable_scaffolding: true, enable_dual_process: true, random_seed: 1,
  };

  console.log(`Generating representative simulations for ${profileNames.length} profiles...`);
  const profileData: ProfileSimData[] = [];
  for (const name of profileNames) {
    const profile = createLearnerProfile(name, baseConfig.num_items);
    const results = runSimulation(profile, baseConfig);
    profileData.push({ profileName: name, results, params: profile.params });
    process.stdout.write(`  ✓ ${name}\n`);
  }

  const totalVariations = DEFAULT_THRESHOLD_SWEEPS.reduce((s, sw) => s + sw.values.length, 0);
  console.log(`\nRunning ${totalVariations} threshold variations × ${profileNames.length} profiles...`);

  const report = runThresholdSensitivity(profileData, DEFAULT_THRESHOLD_SWEEPS);

  const csv = thresholdSensitivityToCSV(report);
  const csvPath = path.join(RESULTS_DIR, 'threshold_sensitivity.csv');
  fs.writeFileSync(csvPath, csv, 'utf-8');
  console.log(`\n  ✓ Wrote ${csvPath} (${csv.split('\n').length} rows)`);

  const changedResults = report.results.filter(r => r.headline_changes.length > 0);
  const robustPct = ((report.robustConclusions / report.totalConclusions) * 100).toFixed(1);

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`  Total conclusion checks: ${report.totalConclusions}`);
  console.log(`  Robust (unchanged):      ${report.robustConclusions} (${robustPct}%)`);
  console.log(`  Changed:                 ${report.totalConclusions - report.robustConclusions}`);
  console.log(`  Variations with changes: ${changedResults.length} of ${report.results.length}`);

  console.log('\n  Per-parameter sensitivity:');
  for (const sweep of DEFAULT_THRESHOLD_SWEEPS) {
    const paramResults = report.results.filter(r => r.parameter === sweep.parameter);
    const paramChanges = paramResults.filter(r => r.headline_changes.length > 0);
    const pct = paramResults.length > 0 ? ((paramChanges.length / paramResults.length) * 100).toFixed(0) : '0';
    console.log(`    ${sweep.parameter}: ${paramChanges.length}/${paramResults.length} variations caused changes (${pct}%)`);
  }

  console.log(`\nCompleted in ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
}

main();
