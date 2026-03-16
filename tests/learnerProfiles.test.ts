import {
  createLearnerProfile,
  createItem,
  getAllProfileNames,
  getCoreProfileNames,
  createAllProfiles,
  CORE_PROFILE_NAMES,
} from '../src/profiles/learnerProfiles';
import { ItemType } from '../src/types';

describe('Learner Profiles', () => {
  describe('createLearnerProfile', () => {
    it('should create a valid Med-Over profile', () => {
      const profile = createLearnerProfile('Med-Over', 10);
      expect(profile.id).toBe('Med-Over');
      expect(profile.name).toBe('Med-Over');
      expect(profile.items.length).toBe(10);
      expect(profile.true_state.lambda).toBeDefined();
      expect(profile.true_state.beta_star).toBeGreaterThan(0); // Med-Over is overconfident
    });

    it('should throw an error for unknown profile', () => {
      expect(() => createLearnerProfile('Non-Existent', 10)).toThrow('Unknown profile');
    });

    it('should alternate item types (vocab/grammar)', () => {
      const profile = createLearnerProfile('Med-Well', 4);
      expect(profile.items.length).toBe(4);
      expect(profile.items[0].item_type).toBe(ItemType.VOCABULARY);
      expect(profile.items[1].item_type).toBe(ItemType.GRAMMAR);
      expect(profile.items[2].item_type).toBe(ItemType.VOCABULARY);
      expect(profile.items[3].item_type).toBe(ItemType.GRAMMAR);
    });
  });

  describe('createItem', () => {
    it('should create an item with correct defaults', () => {
      const item = createItem('test-1', 0.5);
      expect(item.id).toBe('test-1');
      expect(item.difficulty).toBe(0.5);
      expect(item.true_state.K_star).toBe(0.1);
      expect(item.item_type).toBeUndefined();
    });

    it('should create an item with specific K_star and type', () => {
      const item = createItem('test-2', 0.8, 0.4, ItemType.GRAMMAR);
      expect(item.true_state.K_star).toBe(0.4);
      expect(item.item_type).toBe(ItemType.GRAMMAR);
    });
  });

  describe('Names arrays and getters', () => {
    it('getAllProfileNames returns all keys from PROFILE_PARAMS', () => {
      const allNames = getAllProfileNames();
      expect(allNames.length).toBeGreaterThan(15);
      expect(allNames).toContain('Med-Over');
      expect(allNames).toContain('Crammer');
    });

    it('getCoreProfileNames returns only core 9 profiles', () => {
      const coreNames = getCoreProfileNames();
      expect(coreNames).toHaveLength(9);
      expect(coreNames).toEqual(CORE_PROFILE_NAMES);
    });
  });

  describe('createAllProfiles', () => {
    it('should create array of all available profiles', () => {
      const profiles = createAllProfiles(5);
      const allNames = getAllProfileNames();
      expect(profiles).toHaveLength(allNames.length);
      expect(profiles[0].items.length).toBe(5);
    });
  });
});
