import { runSimulation, runSimulationAsync, runExperiment, runFeatureRemovalTests } from '../src/simulation/simulationEngine';
import { createLearnerProfile } from '../src/profiles/learnerProfiles';
import { DEFAULT_SIMULATION_CONFIG, SchedulerType } from '../src/types';

describe('Simulation Engine', () => {
  // Use fewer items and sessions for faster tests
  const testConfig = {
    ...DEFAULT_SIMULATION_CONFIG,
    num_items: 20,
    num_sessions: 5,
    items_per_session: 10,
    random_seed: 42,
  };

  describe('runSimulation', () => {
    it('should run without error for Med-Over profile', () => {
      const profile = createLearnerProfile('Med-Over', testConfig.num_items);
      const results = runSimulation(profile, testConfig);

      expect(results).toBeDefined();
      expect(results.profile_id).toBe('Med-Over');
      expect(results.session_data).toHaveLength(testConfig.num_sessions);
    });

    it('should produce increasing K* trajectory for learning', () => {
      const profile = createLearnerProfile('High-Well', testConfig.num_items);
      const results = runSimulation(profile, testConfig);

      // K* should generally increase over sessions
      const first = results.K_star_trajectory[0];
      const last = results.K_star_trajectory[results.K_star_trajectory.length - 1];
      expect(last).toBeGreaterThan(first);
    });

    it('should work with all scheduler types', () => {
      const schedulers = [
        SchedulerType.CALIBRATEME,
        SchedulerType.SM2,
        SchedulerType.BKT_ONLY,
        SchedulerType.DECAY_BASED,
      ];

      for (const scheduler of schedulers) {
        const profile = createLearnerProfile('Med-Over', testConfig.num_items);
        const config = { ...testConfig, scheduler_type: scheduler };
        const results = runSimulation(profile, config);

        expect(results).toBeDefined();
        expect(results.scheduler_type).toBe(scheduler);
        expect(results.retention_1day).toBeGreaterThanOrEqual(0);
        expect(results.retention_1day).toBeLessThanOrEqual(1);
      }
    });

    it('should apply scaffolding effects for CalibrateMe', () => {
      const profile = createLearnerProfile('Med-Over', testConfig.num_items);
      const config = {
        ...testConfig,
        scheduler_type: SchedulerType.CALIBRATEME,
        enable_scaffolding: true,
        num_sessions: 15,
      };
      const results = runSimulation(profile, config);

      // At least some scaffolds should be delivered
      const totalScaffolds = results.session_data.reduce(
        (sum, s) => sum + s.scaffolds_delivered,
        0
      );
      expect(totalScaffolds).toBeGreaterThan(0);
    });

    it('should produce valid metrics', () => {
      const profile = createLearnerProfile('Med-Over', testConfig.num_items);
      const results = runSimulation(profile, testConfig);

      // Retention should be between 0 and 1
      expect(results.retention_1day).toBeGreaterThanOrEqual(0);
      expect(results.retention_1day).toBeLessThanOrEqual(1);
      expect(results.retention_7day).toBeGreaterThanOrEqual(0);
      expect(results.retention_30day).toBeGreaterThanOrEqual(0);

      // ECE trajectory should have entries
      expect(results.ece_trajectory).toHaveLength(testConfig.num_sessions);

      // All ECE values should be non-negative
      results.ece_trajectory.forEach(ece => {
        expect(ece).toBeGreaterThanOrEqual(0);
      });
    });

    it('should support callbacks during runSimulation', () => {
      const profile = createLearnerProfile('Med-Over', testConfig.num_items);
      const progressVals: number[] = [];
      runSimulation(profile, testConfig, (p) => progressVals.push(p));
      expect(progressVals.length).toBeGreaterThan(0);
      expect(progressVals[progressVals.length - 1]).toBe(100);
    });
  });

  describe('runSimulationAsync', () => {
    it('should run asynchronously and return results', async () => {
      const profile = createLearnerProfile('Med-Over', testConfig.num_items);
      const results = await runSimulationAsync(profile, testConfig);
      expect(results.profile_id).toBe('Med-Over');
    });
  });

  describe('runExperiment', () => {
    it('should run for multiple schedulers and profiles', () => {
      const p1 = createLearnerProfile('Med-Over', 5);
      const schedulers = [SchedulerType.CALIBRATEME, SchedulerType.SM2];
      const config = { ...testConfig, num_sessions: 2, items_per_session: 3 };

      const resultMap = runExperiment([p1], schedulers, config, 1);
      
      expect(resultMap.has('Med-Over')).toBe(true);
      const profileResults = resultMap.get('Med-Over')!;
      
      expect(profileResults.has(SchedulerType.CALIBRATEME)).toBe(true);
      expect(profileResults.has(SchedulerType.SM2)).toBe(true);
      
      const cmResults = profileResults.get(SchedulerType.CALIBRATEME)!;
      expect(cmResults).toHaveLength(1); // 1 rep
    });
  });

  describe('runFeatureRemovalTests', () => {
    it('should run all conditions for feature ablation', () => {
      const profile = createLearnerProfile('Med-Over', 5);
      const config = { ...testConfig, num_sessions: 2, items_per_session: 3 };
      
      const resultMap = runFeatureRemovalTests(profile, config, 1);
      
      expect(resultMap.has('Full CalibrateMe')).toBe(true);
      expect(resultMap.has('SM-2 Baseline')).toBe(true);
      expect(resultMap.get('Full CalibrateMe')!).toHaveLength(1);
    });
  });
});
