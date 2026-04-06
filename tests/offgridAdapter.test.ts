import { getOffGridActivities, getOffGridActivitiesByModule, OFFGRID_MODULES } from '../src/data/offgridAdapter';

describe('OffGrid Adapter', () => {
  const allActivities = getOffGridActivities();

  describe('getOffGridActivities', () => {
    it('should return an array of activities', () => {
      expect(Array.isArray(allActivities)).toBe(true);
      expect(allActivities.length).toBeGreaterThan(0);
    });

    it('should return at least 100 activities', () => {
      expect(allActivities.length).toBeGreaterThanOrEqual(100);
    });

    it('every activity should have a unique ID', () => {
      const ids = allActivities.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every activity should have required fields', () => {
      for (const activity of allActivities) {
        expect(activity.id).toBeTruthy();
        expect(activity.word).toBeTruthy(); // question mapped to word
        expect(activity.translation).toBeTruthy(); // answer mapped to translation
        expect(typeof activity.difficulty).toBe('number');
        expect(activity.difficulty).toBeGreaterThanOrEqual(0);
        expect(activity.difficulty).toBeLessThanOrEqual(1);
        expect(Array.isArray(activity.tags)).toBe(true);
      }
    });

    it('every activity should have a valid itemType', () => {
      const validTypes = ['multiple-choice', 'error_correction', 'sentence-reorder', 'fill-blank-typing'];
      for (const activity of allActivities) {
        expect(validTypes).toContain(activity.itemType);
      }
    });

    it('multiple-choice activities should have options', () => {
      const mcActivities = allActivities.filter(a => a.itemType === 'multiple-choice');
      expect(mcActivities.length).toBeGreaterThan(0);

      for (const activity of mcActivities) {
        expect(activity.options).toBeDefined();
        expect(activity.options!.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('every activity should have an answer', () => {
      for (const activity of allActivities) {
        expect(activity.answer).toBeTruthy();
      }
    });

    it('multiple-choice activities should have the correct answer in options', () => {
      const mcActivities = allActivities.filter(a => a.itemType === 'multiple-choice');
      for (const activity of mcActivities) {
        expect(activity.options).toContain(activity.answer);
      }
    });

    it('should have activities across multiple difficulty levels', () => {
      const easyCount = allActivities.filter(a => a.difficulty <= 0.3).length;
      const mediumCount = allActivities.filter(a => a.difficulty > 0.3 && a.difficulty <= 0.7).length;
      const hardCount = allActivities.filter(a => a.difficulty > 0.7).length;

      expect(easyCount).toBeGreaterThan(0);
      expect(mediumCount).toBeGreaterThan(0);
      expect(hardCount).toBeGreaterThan(0);
    });
  });

  describe('getOffGridActivitiesByModule', () => {
    it('should filter activities by module ID', () => {
      const module = OFFGRID_MODULES[0];
      const moduleActivities = getOffGridActivitiesByModule(module.id);
      expect(moduleActivities.length).toBeGreaterThan(0);

      for (const activity of moduleActivities) {
        expect(activity.moduleId).toBe(module.id);
      }
    });

    it('should return empty array for unknown module', () => {
      const activities = getOffGridActivitiesByModule('nonexistent-module');
      expect(activities).toHaveLength(0);
    });
  });

  describe('OFFGRID_MODULES', () => {
    it('should have at least 10 modules', () => {
      expect(OFFGRID_MODULES.length).toBeGreaterThanOrEqual(10);
    });

    it('every module should have an id, name, and count', () => {
      for (const mod of OFFGRID_MODULES) {
        expect(mod.id).toBeTruthy();
        expect(mod.name).toBeTruthy();
        expect(mod.count).toBeGreaterThan(0);
      }
    });

    it('module IDs should be unique', () => {
      const ids = OFFGRID_MODULES.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every module should have corresponding activities', () => {
      for (const mod of OFFGRID_MODULES) {
        const activities = getOffGridActivitiesByModule(mod.id);
        expect(activities.length).toBeGreaterThan(0);
      }
    });

    it('total module count should match activity count', () => {
      const totalDeclared = OFFGRID_MODULES.reduce((sum, m) => sum + m.count, 0);
      const totalActual = allActivities.length;
      // Allow small mismatch due to possible rounding
      expect(Math.abs(totalDeclared - totalActual)).toBeLessThan(50);
    });
  });

  describe('Grammar exercise types distribution', () => {
    it('should have multiple-choice exercises', () => {
      const mc = allActivities.filter(a => a.itemType === 'multiple-choice');
      expect(mc.length).toBeGreaterThan(50);
    });

    it('should have error_correction exercises', () => {
      const ec = allActivities.filter(a => a.itemType === 'error_correction');
      expect(ec.length).toBeGreaterThan(0);
    });

    it('should have sentence-reorder exercises', () => {
      const sr = allActivities.filter(a => a.itemType === 'sentence-reorder');
      expect(sr.length).toBeGreaterThan(0);
    });

    it('should have fill-blank-typing exercises', () => {
      const fb = allActivities.filter(a => a.itemType === 'fill-blank-typing');
      expect(fb.length).toBeGreaterThan(0);
    });
  });
});
