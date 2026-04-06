import { essentialEnglish } from '../src/data/vocabularyPacks/essential-english';
import { academicEnglish } from '../src/data/vocabularyPacks/academic-english';
import { businessEnglish } from '../src/data/vocabularyPacks/business-english';
import { falseFriends } from '../src/data/vocabularyPacks/false-friends';

const ALL_PACKS = [
  { name: 'Essential English', pack: essentialEnglish },
  { name: 'Academic English', pack: academicEnglish },
  { name: 'Business English', pack: businessEnglish },
  { name: 'False Friends', pack: falseFriends },
];

describe('Vocabulary Packs Data Integrity', () => {
  for (const { name, pack } of ALL_PACKS) {
    describe(name, () => {
      it('should have a non-empty id', () => {
        expect(pack.id).toBeTruthy();
        expect(typeof pack.id).toBe('string');
      });

      it('should have a name', () => {
        expect(pack.name).toBeTruthy();
        expect(typeof pack.name).toBe('string');
      });

      it('should have items', () => {
        expect(pack.items.length).toBeGreaterThan(0);
      });

      it('should have at least 10 items', () => {
        expect(pack.items.length).toBeGreaterThanOrEqual(10);
      });

      it('every item should have a unique ID', () => {
        const ids = pack.items.map(i => i.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it('every item should have a word and translation', () => {
        for (const item of pack.items) {
          expect(item.word).toBeTruthy();
          expect(item.translation).toBeTruthy();
        }
      });

      it('every item should have difficulty in [0, 1]', () => {
        for (const item of pack.items) {
          expect(item.difficulty).toBeGreaterThanOrEqual(0);
          expect(item.difficulty).toBeLessThanOrEqual(1);
        }
      });

      it('every item should have at least one tag', () => {
        for (const item of pack.items) {
          expect(item.tags.length).toBeGreaterThanOrEqual(1);
        }
      });

      it('should have a difficulty distribution (not all the same)', () => {
        const diffs = new Set(pack.items.map(i => i.difficulty));
        expect(diffs.size).toBeGreaterThan(1);
      });
    });
  }

  describe('Cross-pack integrity', () => {
    it('all packs should have distinct IDs', () => {
      const packIds = ALL_PACKS.map(p => p.pack.id);
      expect(new Set(packIds).size).toBe(packIds.length);
    });

    it('all item IDs should be unique across all packs', () => {
      const allIds = ALL_PACKS.flatMap(p => p.pack.items.map(i => i.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('total items across all packs should be >= 100', () => {
      const total = ALL_PACKS.reduce((sum, p) => sum + p.pack.items.length, 0);
      expect(total).toBeGreaterThanOrEqual(100);
    });
  });
});
