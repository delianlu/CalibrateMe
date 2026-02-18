import { runSimulation } from '../src/simulation/simulationEngine';
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
  });
});
