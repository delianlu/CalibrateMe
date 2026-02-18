// =============================================================================
// Statistical Utilities
// =============================================================================

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate variance of an array
 */
export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

/**
 * Calculate standard deviation of an array
 */
export function std(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Online mean and variance calculator (Welford's algorithm)
 */
export class OnlineStatistics {
  private n: number = 0;
  private mean_: number = 0;
  private M2: number = 0;

  update(value: number): void {
    this.n++;
    const delta = value - this.mean_;
    this.mean_ += delta / this.n;
    const delta2 = value - this.mean_;
    this.M2 += delta * delta2;
  }

  get count(): number {
    return this.n;
  }

  get mean(): number {
    return this.mean_;
  }

  get variance(): number {
    return this.n < 2 ? 0 : this.M2 / (this.n - 1);
  }

  get std(): number {
    return Math.sqrt(this.variance);
  }

  reset(): void {
    this.n = 0;
    this.mean_ = 0;
    this.M2 = 0;
  }
}

/**
 * Calculate z-score
 */
export function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}

/**
 * Calculate Cohen's d effect size
 */
export function cohensD(group1: number[], group2: number[]): number {
  const m1 = mean(group1);
  const m2 = mean(group2);
  const s1 = std(group1);
  const s2 = std(group2);
  const n1 = group1.length;
  const n2 = group2.length;

  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / (n1 + n2 - 2)
  );

  return pooledStd === 0 ? 0 : (m1 - m2) / pooledStd;
}
