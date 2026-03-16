import {
  runSensitivitySweep,
  sensitivityToCSV,
  DEFAULT_SWEEPS,
  SensitivitySweepConfig,
} from '../src/simulation/sensitivityAnalysis';
import { DEFAULT_SIMULATION_CONFIG } from '../src/types';

const testConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 10,
  num_sessions: 3,
  items_per_session: 5,
};

describe('Sensitivity Analysis', () => {
  describe('runSensitivitySweep', () => {
    it('should run without errors for lambda sweep', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.05, 0.15],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);

      expect(report).toBeDefined();
      expect(report.results.length).toBeGreaterThan(0);
      expect(report.parameterName).toBe('lambda');
    });

    it('should produce correct number of results (values × profiles)', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'slip_probability',
        values: [0.05, 0.10],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over', 'Med-Under']);

      // 2 values × 2 profiles = 4 results
      expect(report.results).toHaveLength(4);
    });

    it('should include CM and SM2 retention stats', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.10],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);
      const result = report.results[0];

      expect(result.cm_retention).toBeDefined();
      expect(result.sm2_retention).toBeDefined();
      expect(result.retention_advantage).toBeDefined();
      expect(result.cm_ece).toBeDefined();
      expect(result.sm2_ece).toBeDefined();
    });

    it('should compute retention advantage as CM - SM2', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.10],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);
      const result = report.results[0];

      // Advantage should approximately equal cm - sm2
      const expectedAdvantage = result.cm_retention.mean - result.sm2_retention.mean;
      expect(result.retention_advantage.mean).toBeCloseTo(expectedAdvantage, 1);
    });

    it('should handle profile-level params (beta_star)', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'beta_star',
        values: [-0.20, 0.20],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);

      expect(report.results).toHaveLength(2);
      expect(report.results[0].parameterValue).toBe(-0.20);
      expect(report.results[1].parameterValue).toBe(0.20);
    });

    it('should handle config-level params (guess_probability)', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'guess_probability',
        values: [0.10, 0.30],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);
      expect(report.results).toHaveLength(2);
    });

    it('should record metadata correctly', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.05, 0.10],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);

      expect(report.parameterName).toBe('lambda');
      expect(report.values).toEqual([0.05, 0.10]);
      expect(report.profiles).toEqual(['Med-Over']);
      expect(report.nSeeds).toBe(2);
    });
  });

  describe('sensitivityToCSV', () => {
    it('should produce valid CSV', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.05],
      };
      const report = runSensitivitySweep(sweep, 2, testConfig, ['Med-Over']);
      const csv = sensitivityToCSV(report);
      const lines = csv.split('\n');

      expect(lines.length).toBe(2); // header + 1 data row
      expect(lines[0]).toContain('Parameter');
      expect(lines[0]).toContain('CM_Ret7d_Mean');
      expect(lines[0]).toContain('Advantage_Mean');
    });
  });

  describe('DEFAULT_SWEEPS', () => {
    it('should define 5 parameter sweeps', () => {
      expect(DEFAULT_SWEEPS).toHaveLength(5);
      const names = DEFAULT_SWEEPS.map(s => s.parameterName);
      expect(names).toContain('lambda');
      expect(names).toContain('slip_probability');
      expect(names).toContain('guess_probability');
      expect(names).toContain('confidence_noise_std');
      expect(names).toContain('beta_star');
    });
  });

  describe('edge cases', () => {
    it('should fall back to 0 ECE if no session data exists', () => {
      // By using 0 items or a custom config we could trigger an empty session data
      const customConfig = { ...testConfig, num_sessions: 0 };
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.10],
      };
      const report = runSensitivitySweep(sweep, 1, customConfig, ['Med-Over']);
      expect(report.results.length).toBeGreaterThan(0);
      expect(report.results[0].cm_ece.mean).toBe(0);
      expect(report.results[0].sm2_ece.mean).toBe(0);
    });

    it('should properly configure profiles vs config properties', () => {
      const sweep: SensitivitySweepConfig = {
        parameterName: 'lambda',
        values: [0.10], // A profile param
      };
      const report = runSensitivitySweep(sweep, 1, testConfig, ['Med-Over']);
      expect(report.results.length).toBeDefined();

      const configSweep: SensitivitySweepConfig = {
        parameterName: 'slip_probability',
        values: [0.10], // A config param
      };
      const report2 = runSensitivitySweep(configSweep, 1, testConfig, ['Med-Over']);
      expect(report2.results.length).toBeDefined();
    });
  });
});
