// =============================================================================
// Random Number Generation Utilities
// =============================================================================

/**
 * Seeded random number generator for reproducibility
 * Uses a simple linear congruential generator
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  /**
   * Generate a random number in [0, 1)
   */
  random(): number {
    // LCG parameters (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Generate a random number in [min, max)
   */
  randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /**
   * Generate a random integer in [min, max]
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }

  /**
   * Generate a random number from standard normal distribution
   * Using Box-Muller transform
   */
  randomNormal(mean: number = 0, std: number = 1): number {
    const u1 = this.random();
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }

  /**
   * Generate a random boolean with given probability
   */
  randomBoolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }

  /**
   * Shuffle an array in place
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Reset the seed
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }
}

// Global random instance (can be seeded for reproducibility)
export const globalRandom = new SeededRandom();

/**
 * Clip a value to [min, max]
 */
export function clip(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
