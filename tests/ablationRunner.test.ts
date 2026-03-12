import {
  runAblationStudy,
  ablationToCSV,
  getProfileComparisons,
  getConditionComparisons,
  DEFAULT_CONDITIONS,
} from '../src/simulation/ablationRunner';
import { DEFAULT_SIMULATION_CONFIG } from '../src/types';

// Use minimal config for fast tests
const testConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  num_items: 10,
  num_sessions: 3,
  items_per_session: 5,
};

describe('Ablation Runner', () => {
  // Cache results since ablation is expensive
  let results: ReturnType<typeof runAblationStudy>;

  beforeAll(() => {
    results = runAblationStudy(
      2, // 2 seeds for speed
      testConfig,
      DEFAULT_CONDITIONS,
      ['Med-Over'] // single profile
    );
  });

  describe('runAblationStudy', () => {
    it('should run without errors', () => {
      expect(results).toBeDefined();
      expect(results.comparisons).toBeDefined();
      expect(results.comparisons.length).toBeGreaterThan(0);
    });

    it('should return results for all 6 conditions', () => {
      expect(results.conditions).toHaveLength(6);
      expect(results.conditions).toContain('Full CalibrateMe');
      expect(results.conditions).toContain('SM-2 Baseline');
      expect(results.conditions).toContain('BKT-Only');
    });

    it('should have correct number of comparisons (profiles × conditions)', () => {
      // 1 profile × 6 conditions = 6
      expect(results.comparisons).toHaveLength(6);
    });

    it('should include all required metric fields', () => {
      const comp = results.comparisons[0];
      expect(comp.retention_7day).toBeDefined();
      expect(comp.retention_7day.mean).toBeDefined();
      expect(comp.retention_7day.sd).toBeDefined();
      expect(comp.retention_7day.ci95_lower).toBeDefined();
      expect(comp.retention_7day.ci95_upper).toBeDefined();
      expect(comp.retention_7day.n).toBe(2);

      expect(comp.ece).toBeDefined();
      expect(comp.time_to_mastery).toBeDefined();
      expect(comp.review_efficiency).toBeDefined();
      expect(comp.retention_1day).toBeDefined();
      expect(comp.retention_30day).toBeDefined();
    });

    it('should compute effect sizes vs SM-2 for non-SM-2 conditions', () => {
      const fullCM = results.comparisons.find(c => c.condition === 'Full CalibrateMe');
      expect(fullCM).toBeDefined();
      expect(fullCM!.vs_sm2_retention).not.toBeNull();
      expect(fullCM!.vs_sm2_retention!.cohens_d).toBeDefined();
      expect(fullCM!.vs_sm2_retention!.interpretation).toBeDefined();
    });

    it('should NOT compute effect sizes for SM-2 vs itself', () => {
      const sm2 = results.comparisons.find(c => c.condition === 'SM-2 Baseline');
      expect(sm2).toBeDefined();
      expect(sm2!.vs_sm2_retention).toBeNull();
      expect(sm2!.vs_sm2_ece).toBeNull();
    });

    it('should produce valid retention values between 0 and 1', () => {
      for (const comp of results.comparisons) {
        expect(comp.retention_7day.mean).toBeGreaterThanOrEqual(0);
        expect(comp.retention_7day.mean).toBeLessThanOrEqual(1);
        expect(comp.retention_1day.mean).toBeGreaterThanOrEqual(0);
        expect(comp.retention_1day.mean).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('result consistency', () => {
    it('should produce results with same structure and condition ordering across runs', () => {
      const run1 = runAblationStudy(1, testConfig, DEFAULT_CONDITIONS, ['Med-Over']);
      const run2 = runAblationStudy(1, testConfig, DEFAULT_CONDITIONS, ['Med-Over']);

      expect(run1.comparisons.length).toBe(run2.comparisons.length);
      for (let i = 0; i < run1.comparisons.length; i++) {
        expect(run1.comparisons[i].condition).toBe(run2.comparisons[i].condition);
        expect(run1.comparisons[i].profile).toBe(run2.comparisons[i].profile);
        // Retention should be in same valid range
        expect(run1.comparisons[i].retention_7day.n).toBe(run2.comparisons[i].retention_7day.n);
      }
    });
  });

  describe('getProfileComparisons', () => {
    it('should filter by profile', () => {
      const profileComps = getProfileComparisons(results, 'Med-Over');
      expect(profileComps).toHaveLength(6); // 6 conditions
      profileComps.forEach(c => expect(c.profile).toBe('Med-Over'));
    });
  });

  describe('getConditionComparisons', () => {
    it('should filter by condition', () => {
      const condComps = getConditionComparisons(results, 'Full CalibrateMe');
      expect(condComps).toHaveLength(1); // 1 profile
      condComps.forEach(c => expect(c.condition).toBe('Full CalibrateMe'));
    });
  });

  describe('ablationToCSV', () => {
    it('should produce valid CSV with headers', () => {
      const csv = ablationToCSV(results);
      const lines = csv.split('\n');
      expect(lines.length).toBe(results.comparisons.length + 1); // header + data

      const headers = lines[0].split(',');
      expect(headers).toContain('Profile');
      expect(headers).toContain('Condition');
      expect(headers).toContain('Ret7d_Mean');
      expect(headers).toContain('CohenD_Ret_vs_SM2');
    });

    it('should have correct number of columns per row', () => {
      const csv = ablationToCSV(results);
      const lines = csv.split('\n');
      const headerCount = lines[0].split(',').length;
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].split(',').length).toBe(headerCount);
      }
    });
  });

  describe('progress callback', () => {
    it('should fire progress callback', () => {
      const progressValues: number[] = [];
      runAblationStudy(1, testConfig, DEFAULT_CONDITIONS.slice(0, 2), ['Med-Over'], (pct) => {
        progressValues.push(pct);
      });
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBeCloseTo(100, 0);
    });
  });
});
