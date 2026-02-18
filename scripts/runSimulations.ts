// =============================================================================
// Preliminary Simulation Runner
// Runs 9 profiles × 4 schedulers × 5 replications, outputs results as JSON/CSV
// =============================================================================

import { createLearnerProfile, getAllProfileNames } from '../src/profiles/learnerProfiles';
import { runSimulation } from '../src/simulation/simulationEngine';
import { SchedulerType, SimulationConfig, DEFAULT_SIMULATION_CONFIG, SimulationResults } from '../src/types';
import { mean, std, cohensD } from '../src/utils/statistics';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const NUM_REPLICATIONS = 5;
const SIM_CONFIG: SimulationConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 100,
  num_sessions: 30,
  items_per_session: 20,
  random_seed: 42,
};

const SCHEDULER_TYPES = [
  SchedulerType.CALIBRATEME,
  SchedulerType.SM2,
  SchedulerType.BKT_ONLY,
  SchedulerType.DECAY_BASED,
];

const PROFILE_NAMES = getAllProfileNames();

// ---------------------------------------------------------------------------
// Types for aggregated results
// ---------------------------------------------------------------------------
interface ProfileSchedulerSummary {
  profile: string;
  scheduler: string;
  retention_1day_mean: number;
  retention_1day_std: number;
  retention_7day_mean: number;
  retention_7day_std: number;
  retention_30day_mean: number;
  retention_30day_std: number;
  time_to_mastery_mean: number;
  time_to_mastery_std: number;
  review_efficiency_mean: number;
  final_ece_mean: number;
  final_brier_mean: number;
  final_K_star_mean: number;
}

// ---------------------------------------------------------------------------
// Run all simulations
// ---------------------------------------------------------------------------
function runAllSimulations(): Map<string, Map<string, SimulationResults[]>> {
  const allResults = new Map<string, Map<string, SimulationResults[]>>();
  const totalRuns = PROFILE_NAMES.length * SCHEDULER_TYPES.length * NUM_REPLICATIONS;
  let completed = 0;

  for (const profileName of PROFILE_NAMES) {
    const profileResults = new Map<string, SimulationResults[]>();

    for (const scheduler of SCHEDULER_TYPES) {
      const repResults: SimulationResults[] = [];

      for (let rep = 0; rep < NUM_REPLICATIONS; rep++) {
        const profile = createLearnerProfile(profileName, SIM_CONFIG.num_items);
        const config: SimulationConfig = {
          ...SIM_CONFIG,
          scheduler_type: scheduler,
          random_seed: 42 + rep * 1000,
        };

        const result = runSimulation(profile, config);
        repResults.push(result);

        completed++;
        const pct = ((completed / totalRuns) * 100).toFixed(1);
        process.stdout.write(`\r  [${pct}%] ${profileName} / ${scheduler} / rep ${rep + 1}`);
      }

      profileResults.set(scheduler, repResults);
    }

    allResults.set(profileName, profileResults);
  }

  console.log('\n');
  return allResults;
}

// ---------------------------------------------------------------------------
// Aggregate results
// ---------------------------------------------------------------------------
function aggregateResults(
  allResults: Map<string, Map<string, SimulationResults[]>>
): ProfileSchedulerSummary[] {
  const summaries: ProfileSchedulerSummary[] = [];

  for (const [profileName, schedulerResults] of allResults) {
    for (const [scheduler, results] of schedulerResults) {
      const ret1 = results.map(r => r.retention_1day);
      const ret7 = results.map(r => r.retention_7day);
      const ret30 = results.map(r => r.retention_30day);
      const mastery = results.map(r => r.time_to_mastery);
      const efficiency = results.map(r => r.review_efficiency);
      const finalEce = results.map(r => r.ece_trajectory[r.ece_trajectory.length - 1]);
      const finalBrier = results.map(r => r.brier_trajectory[r.brier_trajectory.length - 1]);
      const finalKStar = results.map(r => r.K_star_trajectory[r.K_star_trajectory.length - 1]);

      summaries.push({
        profile: profileName,
        scheduler,
        retention_1day_mean: mean(ret1),
        retention_1day_std: std(ret1),
        retention_7day_mean: mean(ret7),
        retention_7day_std: std(ret7),
        retention_30day_mean: mean(ret30),
        retention_30day_std: std(ret30),
        time_to_mastery_mean: mean(mastery),
        time_to_mastery_std: std(mastery),
        review_efficiency_mean: mean(efficiency),
        final_ece_mean: mean(finalEce),
        final_brier_mean: mean(finalBrier),
        final_K_star_mean: mean(finalKStar),
      });
    }
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// Hypothesis testing
// ---------------------------------------------------------------------------
function testHypotheses(
  allResults: Map<string, Map<string, SimulationResults[]>>
): void {
  console.log('=== HYPOTHESIS TESTING ===\n');

  // Helper: get improvement (CalibrateMe - SM2) for a calibration type
  function getImprovement(calibType: string): { values: number[]; effectSize: number } {
    const cmValues: number[] = [];
    const sm2Values: number[] = [];

    for (const [profileName, schedulerResults] of allResults) {
      if (profileName.includes(calibType)) {
        const cm = schedulerResults.get(SchedulerType.CALIBRATEME);
        const sm2 = schedulerResults.get(SchedulerType.SM2);
        if (cm && sm2) {
          cmValues.push(...cm.map(r => r.retention_7day));
          sm2Values.push(...sm2.map(r => r.retention_7day));
        }
      }
    }

    const improvement = cmValues.map((v, i) => v - sm2Values[i]);
    const effect = cohensD(cmValues, sm2Values);
    return { values: improvement, effectSize: effect };
  }

  const overResult = getImprovement('Over');
  const underResult = getImprovement('Under');
  const wellResult = getImprovement('Well');

  const overMean = mean(overResult.values);
  const underMean = mean(underResult.values);
  const wellMean = mean(wellResult.values);

  // H1: Overconfident show LARGEST improvement
  const h1 = overMean > underMean && overMean > wellMean;
  console.log(`H1: Overconfident learners show largest improvement`);
  console.log(`    Over: ${(overMean * 100).toFixed(2)}%  Under: ${(underMean * 100).toFixed(2)}%  Well: ${(wellMean * 100).toFixed(2)}%`);
  console.log(`    Effect size (Cohen's d): ${overResult.effectSize.toFixed(3)}`);
  console.log(`    Result: ${h1 ? 'SUPPORTED' : 'NOT SUPPORTED'}\n`);

  // H2: Underconfident show MODERATE improvement
  const h2 = underMean > wellMean && underMean < overMean;
  console.log(`H2: Underconfident learners show moderate improvement`);
  console.log(`    Effect size (Cohen's d): ${underResult.effectSize.toFixed(3)}`);
  console.log(`    Result: ${h2 ? 'SUPPORTED' : 'NOT SUPPORTED'}\n`);

  // H3: Well-calibrated show MINIMAL difference
  const h3 = Math.abs(wellMean) < 0.05;
  console.log(`H3: Well-calibrated learners show minimal difference`);
  console.log(`    Difference: ${(wellMean * 100).toFixed(2)}% (threshold: <5%)`);
  console.log(`    Effect size (Cohen's d): ${wellResult.effectSize.toFixed(3)}`);
  console.log(`    Result: ${h3 ? 'SUPPORTED' : 'NOT SUPPORTED'}\n`);
}

// ---------------------------------------------------------------------------
// Export trajectories for figures
// ---------------------------------------------------------------------------
function exportTrajectories(
  allResults: Map<string, Map<string, SimulationResults[]>>,
  outDir: string
): void {
  // Export K* trajectories for each profile (averaged across reps)
  const trajectoryData: Record<string, any>[] = [];

  for (let session = 0; session < SIM_CONFIG.num_sessions; session++) {
    const row: Record<string, any> = { session: session + 1 };

    for (const [profileName, schedulerResults] of allResults) {
      for (const [scheduler, results] of schedulerResults) {
        const kStarValues = results.map(r => r.K_star_trajectory[session]);
        const eceValues = results.map(r => r.ece_trajectory[session]);
        row[`${profileName}_${scheduler}_K_star`] = mean(kStarValues);
        row[`${profileName}_${scheduler}_ECE`] = mean(eceValues);
      }
    }

    trajectoryData.push(row);
  }

  // Write CSV
  const headers = Object.keys(trajectoryData[0]);
  const csv = [
    headers.join(','),
    ...trajectoryData.map(row => headers.map(h => {
      const val = row[h];
      return typeof val === 'number' ? val.toFixed(6) : val;
    }).join(',')),
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'trajectories.csv'), csv);
  console.log(`  Wrote trajectories.csv`);
}

// ---------------------------------------------------------------------------
// Print summary table
// ---------------------------------------------------------------------------
function printSummaryTable(summaries: ProfileSchedulerSummary[]): void {
  console.log('=== SUMMARY TABLE: Retention (7-day) by Profile × Scheduler ===\n');

  // Header
  const schedulerNames = ['CALIBRATEME', 'SM2', 'BKT_ONLY', 'DECAY_BASED'];
  const header = ['Profile', ...schedulerNames.map(s => s.padStart(14))].join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const profileName of PROFILE_NAMES) {
    const cells = [profileName.padEnd(12)];
    for (const sched of schedulerNames) {
      const s = summaries.find(s => s.profile === profileName && s.scheduler === sched);
      if (s) {
        cells.push(`${(s.retention_7day_mean * 100).toFixed(1)}%`.padStart(14));
      } else {
        cells.push('N/A'.padStart(14));
      }
    }
    console.log(cells.join(' | '));
  }
  console.log('');

  // Also print improvement table (CalibrateMe vs SM-2)
  console.log('=== IMPROVEMENT TABLE: CalibrateMe vs SM-2 (7-day Retention) ===\n');
  console.log(`${'Profile'.padEnd(12)} | ${'CM'.padStart(8)} | ${'SM-2'.padStart(8)} | ${'Δ'.padStart(8)} | ${'Mastery'.padStart(10)} | ${'ECE'.padStart(8)}`);
  console.log('-'.repeat(70));

  for (const profileName of PROFILE_NAMES) {
    const cm = summaries.find(s => s.profile === profileName && s.scheduler === 'CALIBRATEME');
    const sm2 = summaries.find(s => s.profile === profileName && s.scheduler === 'SM2');

    if (cm && sm2) {
      const delta = cm.retention_7day_mean - sm2.retention_7day_mean;
      console.log(
        `${profileName.padEnd(12)} | ` +
        `${(cm.retention_7day_mean * 100).toFixed(1)}%`.padStart(8) + ' | ' +
        `${(sm2.retention_7day_mean * 100).toFixed(1)}%`.padStart(8) + ' | ' +
        `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`.padStart(8) + ' | ' +
        `${cm.time_to_mastery_mean.toFixed(1)}`.padStart(10) + ' | ' +
        `${(cm.final_ece_mean * 100).toFixed(2)}%`.padStart(8)
      );
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  const outDir = path.resolve(__dirname, '..', 'results', 'preliminary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('============================================================');
  console.log('  CalibrateMe Preliminary Simulation');
  console.log(`  ${PROFILE_NAMES.length} profiles × ${SCHEDULER_TYPES.length} schedulers × ${NUM_REPLICATIONS} replications`);
  console.log(`  = ${PROFILE_NAMES.length * SCHEDULER_TYPES.length * NUM_REPLICATIONS} total simulations`);
  console.log('============================================================\n');

  // Run simulations
  console.log('Running simulations...');
  const startTime = Date.now();
  const allResults = runAllSimulations();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Completed in ${elapsed}s\n`);

  // Aggregate
  const summaries = aggregateResults(allResults);

  // Print tables
  printSummaryTable(summaries);

  // Test hypotheses
  testHypotheses(allResults);

  // Export CSV summary
  const csvHeaders = Object.keys(summaries[0]);
  const csvRows = summaries.map(s =>
    csvHeaders.map(h => {
      const val = (s as any)[h];
      return typeof val === 'number' ? val.toFixed(6) : val;
    }).join(',')
  );
  const summaryCSV = [csvHeaders.join(','), ...csvRows].join('\n');
  fs.writeFileSync(path.join(outDir, 'summary.csv'), summaryCSV);
  console.log(`Wrote summary.csv`);

  // Export trajectories
  exportTrajectories(allResults, outDir);

  // Export full results JSON (first replication only to save space)
  const jsonExport: Record<string, Record<string, any>> = {};
  for (const [profileName, schedulerResults] of allResults) {
    jsonExport[profileName] = {};
    for (const [scheduler, results] of schedulerResults) {
      jsonExport[profileName][scheduler] = {
        retention_1day: mean(results.map(r => r.retention_1day)),
        retention_7day: mean(results.map(r => r.retention_7day)),
        retention_30day: mean(results.map(r => r.retention_30day)),
        time_to_mastery: mean(results.map(r => r.time_to_mastery)),
        K_star_trajectory: results[0].K_star_trajectory,
        K_hat_trajectory: results[0].K_hat_trajectory,
        ece_trajectory: results[0].ece_trajectory,
        brier_trajectory: results[0].brier_trajectory,
        session_data: results[0].session_data,
      };
    }
  }
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(jsonExport, null, 2));
  console.log(`Wrote results.json`);

  console.log('\nDone! Results saved to results/preliminary/');
}

main();
