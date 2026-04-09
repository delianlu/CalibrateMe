// =============================================================================
// Reliability Diagram Data Generator
// Runs a single-seed Med-Under simulation under two scheduling conditions
// (SM-2 Baseline and Full CalibrateMe), bins the full response history via the
// canonical scoringModule.binResponses, and writes a Markdown table per
// condition to docs/report_reliability_data.md for the final report.
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { createLearnerProfile } from '../src/profiles/learnerProfiles';
import { runSimulation } from '../src/simulation/simulationEngine';
import { binResponses } from '../src/calibration/scoringModule';
import {
  SchedulerType,
  SimulationConfig,
  DEFAULT_SIMULATION_CONFIG,
  ProcessedResponse,
} from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_BINS = 10;
const SEED = 42;
const PROFILE_NAME = 'Med-Under';

interface Condition {
  name: string;
  config: SimulationConfig;
}

const conditions: Condition[] = [
  {
    name: 'SM-2 Baseline',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      scheduler_type: SchedulerType.SM2,
      random_seed: SEED,
    },
  },
  {
    name: 'Full CalibrateMe',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      scheduler_type: SchedulerType.CALIBRATEME,
      enable_scaffolding: true,
      enable_dual_process: true,
      random_seed: SEED,
    },
  },
];

function formatNumber(x: number, digits: number = 4): string {
  return x.toFixed(digits);
}

/**
 * Build a Markdown reliability-diagram table for a single condition.
 * Emits exactly `NUM_BINS` rows, including empty bins (count = 0, NA values).
 */
function buildReliabilityTable(
  responses: ProcessedResponse[],
  numBins: number = NUM_BINS
): string {
  // Use the same binning function as the analytics pipeline.
  const bins = binResponses(responses, numBins);
  const binWidth = 1 / numBins;

  // Index bins by their start value for fast lookup (bin_start = i * binWidth).
  const binByIndex = new Map<number, (typeof bins)[number]>();
  for (const b of bins) {
    const idx = Math.round(b.bin_start / binWidth);
    binByIndex.set(idx, b);
  }

  const header =
    '| bin_index | bin_start | bin_end | count | mean_confidence | mean_accuracy |';
  const separator =
    '| --- | --- | --- | --- | --- | --- |';

  const rows: string[] = [header, separator];
  for (let i = 0; i < numBins; i++) {
    const binStart = i * binWidth;
    const binEnd = (i + 1) * binWidth;
    const bin = binByIndex.get(i);
    if (bin) {
      rows.push(
        `| ${i} | ${formatNumber(binStart, 1)} | ${formatNumber(binEnd, 1)} | ${bin.count} | ${formatNumber(bin.mean_confidence)} | ${formatNumber(bin.mean_accuracy)} |`
      );
    } else {
      rows.push(
        `| ${i} | ${formatNumber(binStart, 1)} | ${formatNumber(binEnd, 1)} | 0 | NA | NA |`
      );
    }
  }
  return rows.join('\n');
}

function main(): void {
  const sections: string[] = [];

  for (const condition of conditions) {
    // Fresh profile for each condition to avoid cross-condition mutation leakage.
    const profile = createLearnerProfile(PROFILE_NAME, condition.config.num_items);
    const results = runSimulation(profile, condition.config);
    const responses = results.all_responses ?? [];

    const table = buildReliabilityTable(responses, NUM_BINS);
    sections.push(`## ${condition.name}\n\n${table}\n`);
  }

  const output = sections.join('\n');

  const outPath = path.resolve(__dirname, '..', 'docs', 'report_reliability_data.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output);
  console.log(`Wrote ${outPath}`);
}

main();
