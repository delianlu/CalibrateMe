// =============================================================================
// Tuned Simulation Runner
// Uses adjusted parameters for better scheduler differentiation
// Key change: fewer items (50) so 40% coverage per session,
// allowing learning to outpace forgetting
// =============================================================================

import { createLearnerProfile, getAllProfileNames, PROFILE_PARAMS } from '../src/profiles/learnerProfiles';
import { runSimulation } from '../src/simulation/simulationEngine';
import { SchedulerType, SimulationConfig, DEFAULT_SIMULATION_CONFIG, SimulationResults, LearnerProfile } from '../src/types';
import { mean, std, cohensD } from '../src/utils/statistics';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tuned config: fewer items = higher review coverage per session
const NUM_REPLICATIONS = 10;
const SIM_CONFIG: SimulationConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 50,           // 50 items (was 100)
  num_sessions: 30,
  items_per_session: 20,   // 40% coverage per session (was 20%)
  random_seed: 42,
};

const SCHEDULER_TYPES = [
  SchedulerType.CALIBRATEME,
  SchedulerType.SM2,
  SchedulerType.BKT_ONLY,
  SchedulerType.DECAY_BASED,
];

const PROFILE_NAMES = getAllProfileNames();

// Run all simulations
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
        process.stdout.write(`\r  [${pct}%] ${profileName} / ${scheduler} / rep ${rep + 1}    `);
      }

      profileResults.set(scheduler, repResults);
    }

    allResults.set(profileName, profileResults);
  }

  console.log('\n');
  return allResults;
}

// Print results
function printResults(allResults: Map<string, Map<string, SimulationResults[]>>): void {
  console.log('=== TUNED SIMULATION: 7-day Retention by Profile x Scheduler ===\n');

  const header = `${'Profile'.padEnd(12)} | ${'CalibrateMe'.padStart(12)} | ${'SM-2'.padStart(12)} | ${'BKT-Only'.padStart(12)} | ${'Decay'.padStart(12)} | ${'Δ (CM-SM2)'.padStart(12)}`;
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const profileName of PROFILE_NAMES) {
    const profileResults = allResults.get(profileName)!;
    const vals: Record<string, number> = {};
    for (const sched of SCHEDULER_TYPES) {
      const results = profileResults.get(sched)!;
      vals[sched] = mean(results.map(r => r.retention_7day));
    }
    const delta = vals[SchedulerType.CALIBRATEME] - vals[SchedulerType.SM2];
    console.log(
      `${profileName.padEnd(12)} | ` +
      `${(vals[SchedulerType.CALIBRATEME] * 100).toFixed(1)}%`.padStart(12) + ' | ' +
      `${(vals[SchedulerType.SM2] * 100).toFixed(1)}%`.padStart(12) + ' | ' +
      `${(vals[SchedulerType.BKT_ONLY] * 100).toFixed(1)}%`.padStart(12) + ' | ' +
      `${(vals[SchedulerType.DECAY_BASED] * 100).toFixed(1)}%`.padStart(12) + ' | ' +
      `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(2)}%`.padStart(12)
    );
  }

  // Knowledge trajectory summary
  console.log('\n=== FINAL K* (mean across items, session 30) ===\n');
  for (const profileName of PROFILE_NAMES) {
    const profileResults = allResults.get(profileName)!;
    const cmResults = profileResults.get(SchedulerType.CALIBRATEME)!;
    const sm2Results = profileResults.get(SchedulerType.SM2)!;
    const cmK = mean(cmResults.map(r => r.K_star_trajectory[r.K_star_trajectory.length - 1]));
    const sm2K = mean(sm2Results.map(r => r.K_star_trajectory[r.K_star_trajectory.length - 1]));
    console.log(`  ${profileName.padEnd(12)}: CM=${(cmK * 100).toFixed(1)}%  SM2=${(sm2K * 100).toFixed(1)}%  Δ=${((cmK - sm2K) * 100).toFixed(2)}%`);
  }

  // Mastery analysis
  console.log('\n=== TIME TO MASTERY (sessions) ===\n');
  for (const profileName of PROFILE_NAMES) {
    const profileResults = allResults.get(profileName)!;
    const cmResults = profileResults.get(SchedulerType.CALIBRATEME)!;
    const sm2Results = profileResults.get(SchedulerType.SM2)!;
    const cmMastery = mean(cmResults.map(r => r.time_to_mastery));
    const sm2Mastery = mean(sm2Results.map(r => r.time_to_mastery));
    console.log(`  ${profileName.padEnd(12)}: CM=${cmMastery.toFixed(1)}  SM2=${sm2Mastery.toFixed(1)}`);
  }

  // Hypothesis testing
  console.log('\n=== HYPOTHESIS TESTING ===\n');

  function getImprovement(calibType: string): { mean: number; effectSize: number } {
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
    return { mean: mean(cmValues) - mean(sm2Values), effectSize: cohensD(cmValues, sm2Values) };
  }

  const over = getImprovement('Over');
  const under = getImprovement('Under');
  const well = getImprovement('Well');

  console.log(`  Overconfident  improvement: ${(over.mean * 100).toFixed(2)}% (d=${over.effectSize.toFixed(3)})`);
  console.log(`  Underconfident improvement: ${(under.mean * 100).toFixed(2)}% (d=${under.effectSize.toFixed(3)})`);
  console.log(`  Well-calibrated improvement: ${(well.mean * 100).toFixed(2)}% (d=${well.effectSize.toFixed(3)})`);

  const h1 = over.mean > under.mean && over.mean > well.mean;
  const h2 = under.mean > well.mean && under.mean < over.mean;
  const h3 = Math.abs(well.mean) < 0.05;

  console.log(`\n  H1 (Over > all):   ${h1 ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
  console.log(`  H2 (Under moderate): ${h2 ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
  console.log(`  H3 (Well minimal):  ${h3 ? 'SUPPORTED' : 'NOT SUPPORTED'}`);

  // ECE trajectory (calibration improvement over time)
  console.log('\n=== ECE TRAJECTORY (Overconfident profiles, CalibrateMe) ===\n');
  for (const profileName of PROFILE_NAMES.filter(p => p.includes('Over'))) {
    const cmResults = allResults.get(profileName)!.get(SchedulerType.CALIBRATEME)!;
    const eceStart = mean(cmResults.map(r => r.ece_trajectory[0]));
    const eceMid = mean(cmResults.map(r => r.ece_trajectory[14]));
    const eceEnd = mean(cmResults.map(r => r.ece_trajectory[29]));
    console.log(`  ${profileName}: Start=${(eceStart * 100).toFixed(1)}%  Mid=${(eceMid * 100).toFixed(1)}%  End=${(eceEnd * 100).toFixed(1)}%`);
  }

  // Scaffolding analysis
  console.log('\n=== SCAFFOLDING ANALYSIS ===\n');
  for (const profileName of PROFILE_NAMES) {
    const cmResults = allResults.get(profileName)!.get(SchedulerType.CALIBRATEME)!;
    const totalScaffolds = mean(cmResults.map(r =>
      r.session_data.reduce((sum, s) => sum + s.scaffolds_delivered, 0)
    ));
    const params = PROFILE_PARAMS[profileName];
    console.log(`  ${profileName.padEnd(12)}: ${totalScaffolds.toFixed(1)} scaffolds  (β*=${params.beta_star >= 0 ? '+' : ''}${params.beta_star})`);
  }
}

// Export data for figures
function exportData(allResults: Map<string, Map<string, SimulationResults[]>>, outDir: string): void {
  // 1. Summary CSV
  const summaryRows: string[] = ['profile,scheduler,ret_1d,ret_7d,ret_30d,mastery,efficiency,final_ece,final_brier,final_Kstar'];
  for (const [profileName, schedulerResults] of allResults) {
    for (const [scheduler, results] of schedulerResults) {
      summaryRows.push([
        profileName,
        scheduler,
        mean(results.map(r => r.retention_1day)).toFixed(6),
        mean(results.map(r => r.retention_7day)).toFixed(6),
        mean(results.map(r => r.retention_30day)).toFixed(6),
        mean(results.map(r => r.time_to_mastery)).toFixed(2),
        mean(results.map(r => r.review_efficiency)).toFixed(4),
        mean(results.map(r => r.ece_trajectory[r.ece_trajectory.length - 1])).toFixed(6),
        mean(results.map(r => r.brier_trajectory[r.brier_trajectory.length - 1])).toFixed(6),
        mean(results.map(r => r.K_star_trajectory[r.K_star_trajectory.length - 1])).toFixed(6),
      ].join(','));
    }
  }
  fs.writeFileSync(path.join(outDir, 'tuned_summary.csv'), summaryRows.join('\n'));

  // 2. K* trajectory CSV for key profiles
  const keyProfiles = ['Med-Over', 'Med-Under', 'Med-Well', 'High-Over'];
  const trajHeaders = ['session'];
  for (const p of keyProfiles) {
    trajHeaders.push(`${p}_CM_Kstar`, `${p}_SM2_Kstar`, `${p}_CM_ECE`, `${p}_SM2_ECE`);
  }
  const trajRows: string[] = [trajHeaders.join(',')];
  for (let s = 0; s < SIM_CONFIG.num_sessions; s++) {
    const row: string[] = [`${s + 1}`];
    for (const p of keyProfiles) {
      const cm = allResults.get(p)!.get(SchedulerType.CALIBRATEME)!;
      const sm2 = allResults.get(p)!.get(SchedulerType.SM2)!;
      row.push(
        mean(cm.map(r => r.K_star_trajectory[s])).toFixed(6),
        mean(sm2.map(r => r.K_star_trajectory[s])).toFixed(6),
        mean(cm.map(r => r.ece_trajectory[s])).toFixed(6),
        mean(sm2.map(r => r.ece_trajectory[s])).toFixed(6),
      );
    }
    trajRows.push(row.join(','));
  }
  fs.writeFileSync(path.join(outDir, 'tuned_trajectories.csv'), trajRows.join('\n'));

  // 3. Full results JSON
  const jsonExport: Record<string, Record<string, any>> = {};
  for (const [profileName, schedulerResults] of allResults) {
    jsonExport[profileName] = {};
    for (const [scheduler, results] of schedulerResults) {
      jsonExport[profileName][scheduler] = {
        retention_1day: mean(results.map(r => r.retention_1day)),
        retention_7day: mean(results.map(r => r.retention_7day)),
        retention_30day: mean(results.map(r => r.retention_30day)),
        time_to_mastery: mean(results.map(r => r.time_to_mastery)),
        final_K_star: mean(results.map(r => r.K_star_trajectory[r.K_star_trajectory.length - 1])),
        K_star_trajectory: Array.from({ length: SIM_CONFIG.num_sessions }, (_, s) =>
          mean(results.map(r => r.K_star_trajectory[s]))
        ),
        K_hat_trajectory: Array.from({ length: SIM_CONFIG.num_sessions }, (_, s) =>
          mean(results.map(r => r.K_hat_trajectory[s]))
        ),
        ece_trajectory: Array.from({ length: SIM_CONFIG.num_sessions }, (_, s) =>
          mean(results.map(r => r.ece_trajectory[s]))
        ),
        brier_trajectory: Array.from({ length: SIM_CONFIG.num_sessions }, (_, s) =>
          mean(results.map(r => r.brier_trajectory[s]))
        ),
      };
    }
  }
  fs.writeFileSync(path.join(outDir, 'tuned_results.json'), JSON.stringify(jsonExport, null, 2));

  console.log(`\nExported: tuned_summary.csv, tuned_trajectories.csv, tuned_results.json`);
}

function main(): void {
  const outDir = path.resolve(__dirname, '..', 'results', 'preliminary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('============================================================');
  console.log('  CalibrateMe TUNED Simulation');
  console.log(`  ${PROFILE_NAMES.length} profiles × ${SCHEDULER_TYPES.length} schedulers × ${NUM_REPLICATIONS} reps`);
  console.log(`  Config: ${SIM_CONFIG.num_items} items, ${SIM_CONFIG.items_per_session}/session, ${SIM_CONFIG.num_sessions} sessions`);
  console.log('============================================================\n');

  console.log('Running simulations...');
  const startTime = Date.now();
  const allResults = runAllSimulations();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Completed in ${elapsed}s`);

  printResults(allResults);
  exportData(allResults, outDir);

  console.log('\nDone!');
}

main();
