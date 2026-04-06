import { QUESTION_BANK } from '../src/features/minigame/questions';

describe('Minigame Questions Data Integrity', () => {
  it('should have exactly 60 questions', () => {
    expect(QUESTION_BANK.length).toBe(60);
  });

  it('every question should have a unique ID', () => {
    const ids = QUESTION_BANK.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every question should have required fields', () => {
    for (const q of QUESTION_BANK) {
      expect(q.id).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.question.length).toBeGreaterThan(5);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
      expect(q.category).toBeTruthy();
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
    }
  });

  it('every question should have a valid correctIndex (0-3)', () => {
    for (const q of QUESTION_BANK) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
    }
  });

  it('every question should have 4 distinct options', () => {
    for (const q of QUESTION_BANK) {
      const uniqueOptions = new Set(q.options);
      expect(uniqueOptions.size).toBe(4);
    }
  });

  describe('Difficulty Distribution', () => {
    it('should have easy questions', () => {
      const easy = QUESTION_BANK.filter(q => q.difficulty === 'easy');
      expect(easy.length).toBeGreaterThanOrEqual(10);
    });

    it('should have medium questions', () => {
      const medium = QUESTION_BANK.filter(q => q.difficulty === 'medium');
      expect(medium.length).toBeGreaterThanOrEqual(10);
    });

    it('should have hard questions', () => {
      const hard = QUESTION_BANK.filter(q => q.difficulty === 'hard');
      expect(hard.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Category Distribution', () => {
    it('should have questions across multiple categories', () => {
      const categories = new Set(QUESTION_BANK.map(q => q.category));
      expect(categories.size).toBeGreaterThanOrEqual(5);
    });

    it('should include science category', () => {
      const science = QUESTION_BANK.filter(q => q.category === 'science');
      expect(science.length).toBeGreaterThan(0);
    });

    it('should include geography category', () => {
      const geo = QUESTION_BANK.filter(q => q.category === 'geography');
      expect(geo.length).toBeGreaterThan(0);
    });

    it('should include history category', () => {
      const history = QUESTION_BANK.filter(q => q.category === 'history');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Answer Validation', () => {
    it('correctIndex should point to a valid option for every question', () => {
      for (const q of QUESTION_BANK) {
        expect(q.options[q.correctIndex]).toBeTruthy();
      }
    });

    it('no question should have empty option strings', () => {
      for (const q of QUESTION_BANK) {
        for (const opt of q.options) {
          expect(opt.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });
});
