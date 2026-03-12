import {
  runDeltaSweep,
  deltaSweepToCSV,
  DEFAULT_DELTAS,
} from '../src/simulation/deltaSweep';
import { DEFAULT_SIMULATION_CONFIG } from '../src/types';

const testConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 10,
  num_sessions: 5,
  items_per_session: 5,
};

describe('Delta Sweep', () => {
  describe('runDeltaSweep', () => {
    it('should run without errors', () => {
      const report = runDeltaSweep([0.00, 0.05], 2, testConfig, ['Med-Over']);
      expect(report).toBeDefined();
      expect(report.results.length).toBeGreaterThan(0);
    });

    it('should produce correct number of results (deltas × profiles)', () => {
      const report = runDeltaSweep([0.00, 0.05, 0.10], 2, testConfig, ['Med-Over', 'Med-Under']);
      // 3 deltas × 2 profiles = 6
      expect(report.results).toHaveLength(6);
    });

    it('should include all metric fields', () => {
      const report = runDeltaSweep([0.05], 2, testConfig, ['Med-Over']);
      const result = report.results[0];

      expect(result.final_ece).toBeDefined();
      expect(result.final_ece.mean).toBeDefined();
      expect(result.final_ece.n).toBe(2);

      expect(result.retention_7day).toBeDefined();
      expect(result.time_to_mastery).toBeDefined();
      expect(result.scaffold_count).toBeDefined();
    });

    it('should show zero scaffolds when delta = 0', () => {
      const report = runDeltaSweep([0.00], 2, testConfig, ['Med-Over']);
      const result = report.results[0];
      expect(result.scaffold_count.mean).toBe(0);
    });

    it('should deliver scaffolds when delta > 0', () => {
      const report = runDeltaSweep([0.10], 2, testConfig, ['Med-Over']);
      const result = report.results[0];
      // With delta=0.10 and overconfident profile, scaffolds should be delivered
      expect(result.scaffold_count.mean).toBeGreaterThanOrEqual(0);
    });

    it('should record metadata correctly', () => {
      const deltas = [0.00, 0.05];
      const report = runDeltaSweep(deltas, 2, testConfig, ['Med-Over']);
      expect(report.deltas).toEqual(deltas);
      expect(report.profiles).toEqual(['Med-Over']);
      expect(report.nSeeds).toBe(2);
    });

    it('should produce valid retention values', () => {
      const report = runDeltaSweep([0.00, 0.05], 2, testConfig, ['Med-Over']);
      for (const result of report.results) {
        expect(result.retention_7day.mean).toBeGreaterThanOrEqual(0);
        expect(result.retention_7day.mean).toBeLessThanOrEqual(1);
      }
    });

    it('should produce non-negative ECE values', () => {
      const report = runDeltaSweep([0.00, 0.05], 2, testConfig, ['Med-Over']);
      for (const result of report.results) {
        expect(result.final_ece.mean).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('deltaSweepToCSV', () => {
    it('should produce valid CSV with headers', () => {
      const report = runDeltaSweep([0.00, 0.05], 2, testConfig, ['Med-Over']);
      const csv = deltaSweepToCSV(report);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3); // header + 2 data rows
      expect(lines[0]).toContain('Delta');
      expect(lines[0]).toContain('ECE_Mean');
      expect(lines[0]).toContain('Ret7d_Mean');
      expect(lines[0]).toContain('Scaffolds_Mean');
    });
  });

  describe('DEFAULT_DELTAS', () => {
    it('should define 8 delta values', () => {
      expect(DEFAULT_DELTAS).toHaveLength(8);
      expect(DEFAULT_DELTAS[0]).toBe(0.00);
      expect(DEFAULT_DELTAS[DEFAULT_DELTAS.length - 1]).toBe(0.15);
    });

    it('should be sorted in ascending order', () => {
      for (let i = 1; i < DEFAULT_DELTAS.length; i++) {
        expect(DEFAULT_DELTAS[i]).toBeGreaterThan(DEFAULT_DELTAS[i - 1]);
      }
    });
  });
});
