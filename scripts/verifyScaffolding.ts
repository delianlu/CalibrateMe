// Verification trace for scaffolding effect on beta_star
import { createLearnerProfile } from '../src/profiles/learnerProfiles';
import { runSimulation } from '../src/simulation/simulationEngine';
import { SchedulerType, DEFAULT_SIMULATION_CONFIG } from '../src/types';
import { mean, std } from '../src/utils/statistics';

function traceProfile(profileName: string, seed: number) {
  const withResults = runSimulation(createLearnerProfile(profileName, DEFAULT_SIMULATION_CONFIG.num_items), {
    ...DEFAULT_SIMULATION_CONFIG,
    scheduler_type: SchedulerType.CALIBRATEME,
    enable_scaffolding: true,
    enable_dual_process: true,
    random_seed: seed,
  });
  const withoutResults = runSimulation(createLearnerProfile(profileName, DEFAULT_SIMULATION_CONFIG.num_items), {
    ...DEFAULT_SIMULATION_CONFIG,
    scheduler_type: SchedulerType.CALIBRATEME,
    enable_scaffolding: false,
    enable_dual_process: true,
    random_seed: seed,
  });
  console.log(`\n=== ${profileName} (seed=${seed}) ===`);
  console.log('session | beta_star_with | beta_star_without | diff | scaffolds_with');
  for (let i = 0; i < withResults.session_data.length; i++) {
    const w = withResults.session_data[i].beta_star_end ?? NaN;
    const wo = withoutResults.session_data[i].beta_star_end ?? NaN;
    const sc = withResults.session_data[i].scaffolds_delivered;
    console.log(`${i} | ${w.toFixed(6)} | ${wo.toFixed(6)} | ${(w - wo).toFixed(6)} | ${sc}`);
  }
}

function scaffoldsPerSession(profileName: string, nSeeds: number) {
  const perRun: number[] = [];
  for (let seed = 1; seed <= nSeeds; seed++) {
    const res = runSimulation(createLearnerProfile(profileName, DEFAULT_SIMULATION_CONFIG.num_items), {
      ...DEFAULT_SIMULATION_CONFIG,
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: true,
      enable_dual_process: true,
      random_seed: seed + 1,
    });
    const sessMean = mean(res.session_data.map(s => s.scaffolds_delivered));
    perRun.push(sessMean);
  }
  console.log(`\n${profileName}: scaffolds_per_session_mean=${mean(perRun).toFixed(4)}  sd=${std(perRun).toFixed(4)}  (n_seeds=${nSeeds})`);
}

traceProfile('Med-Under', 42);
scaffoldsPerSession('Med-Under', 30);
scaffoldsPerSession('High-Under', 30);
