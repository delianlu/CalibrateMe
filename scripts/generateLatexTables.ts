// =============================================================================
// Generate LaTeX Tables from CSV Results
// Run: npx tsx scripts/generateLatexTables.ts
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.resolve(__dirname, '..', 'results');
const LATEX_DIR = path.join(RESULTS_DIR, 'latex');

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

interface CSVRow {
  [key: string]: string;
}

function parseCSV(filepath: string): CSVRow[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: CSVRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function fmtPct(value: string, decimals: number = 1): string {
  return (parseFloat(value) * 100).toFixed(decimals);
}

function fmtCI(mean: string, ciUpper: string, decimals: number = 1): string {
  const m = parseFloat(mean) * 100;
  const u = parseFloat(ciUpper) * 100;
  const halfWidth = Math.abs(u - m);
  return `${m.toFixed(decimals)} $\\pm$ ${halfWidth.toFixed(decimals)}`;
}

function fmtRaw(value: string, decimals: number = 1): string {
  return parseFloat(value).toFixed(decimals);
}

function fmtRawCI(mean: string, ciUpper: string, decimals: number = 1): string {
  const m = parseFloat(mean);
  const u = parseFloat(ciUpper);
  const halfWidth = Math.abs(u - m);
  return `${m.toFixed(decimals)} $\\pm$ ${halfWidth.toFixed(decimals)}`;
}

// ---------------------------------------------------------------------------
// Table 1: Ablation Results (Core Profiles)
// ---------------------------------------------------------------------------

function generateAblationTable(): string {
  const rows = parseCSV(path.join(RESULTS_DIR, 'ablation_core_profiles.csv'));

  // Filter to retention_7day metric
  const retRows = rows.filter(r => r.metric === 'retention_7day');

  // Profile groupings for hypotheses
  const hypotheses: { label: string; profiles: string[] }[] = [
    { label: 'H1: Overconfident', profiles: ['Low-Over', 'Med-Over', 'High-Over'] },
    { label: 'H2: Underconfident', profiles: ['Low-Under', 'Med-Under', 'High-Under'] },
    { label: 'H3: Well-calibrated', profiles: ['Low-Well', 'Med-Well', 'High-Well'] },
  ];

  const conditions = ['Full CalibrateMe', 'No Dual-Process', 'No Scaffolding', 'Calibration Only', 'SM-2 Baseline'];

  // Build lookup: profile -> condition -> row
  const lookup = new Map<string, Map<string, CSVRow>>();
  for (const r of retRows) {
    if (!lookup.has(r.profile)) lookup.set(r.profile, new Map());
    lookup.get(r.profile)!.set(r.condition, r);
  }

  // Collect Cohen's d for Full CM footnote
  const cohenDValues: string[] = [];

  let tex = `\\begin{table}[t]
\\centering
\\scriptsize
\\setlength{\\tabcolsep}{2.5pt}
\\caption{Ablation Study: 7-Day Retention (\\% Mean $\\pm$ 95\\% CI Half-Width) and Effect Size vs.\\ SM-2}
\\label{tab:ablation}
\\begin{tabular}{lccccc}
\\toprule
\\textbf{Profile} & \\textbf{Full CM} & \\textbf{No DP} & \\textbf{No Scaff.} & \\textbf{Cal. Only} & \\textbf{SM-2} \\\\
\\midrule\n`;

  for (const hyp of hypotheses) {
    tex += `\\multicolumn{6}{l}{\\textit{${hyp.label}}} \\\\\n`;

    for (const profile of hyp.profiles) {
      const pMap = lookup.get(profile);
      if (!pMap) continue;

      const cells = conditions.map(cond => {
        const r = pMap.get(cond);
        if (!r) return '--';
        return fmtCI(r.mean, r.ci95_upper);
      });

      // Collect Cohen's d for Full CM
      const fullCM = pMap.get('Full CalibrateMe');
      if (fullCM && fullCM.cohens_d_vs_sm2 !== 'N/A') {
        cohenDValues.push(`${profile}: $d$=${fmtRaw(fullCM.cohens_d_vs_sm2, 2)}`);
      }

      tex += `${profile} & ${cells.join(' & ')} \\\\\n`;
    }

    tex += '\\midrule\n';
  }

  // Remove last midrule and add bottomrule
  tex = tex.replace(/\\midrule\n$/, '\\bottomrule\n');

  tex += `\\end{tabular}
\\\\[4pt]
{\\tiny Cohen's $d$ (Full CM vs.\\ SM-2): ${cohenDValues.join('; ')}}
\\end{table}\n`;

  return tex;
}

// ---------------------------------------------------------------------------
// Table 2: Sensitivity Summary
// ---------------------------------------------------------------------------

function generateSensitivityTable(): string {
  const paramFiles: { name: string; symbol: string; file: string }[] = [
    { name: 'Forgetting rate', symbol: '\\lambda', file: 'sensitivity_lambda.csv' },
    { name: 'Slip probability', symbol: 'p_s', file: 'sensitivity_slip.csv' },
    { name: 'Guess probability', symbol: 'p_g', file: 'sensitivity_guess.csv' },
    { name: 'Confidence noise', symbol: '\\sigma_c', file: 'sensitivity_noise.csv' },
    { name: 'Calibration bias', symbol: '\\beta^*', file: 'sensitivity_beta.csv' },
  ];

  let tex = `\\begin{table}[t]
\\centering
\\scriptsize
\\setlength{\\tabcolsep}{3pt}
\\caption{Sensitivity Analysis: Parameter Ranges Where CalibrateMe Maintains Positive Retention Advantage}
\\label{tab:sensitivity}
\\begin{tabular}{lccc}
\\toprule
\\textbf{Parameter} & \\textbf{Sweep Range} & \\textbf{Robust Range} & \\textbf{Peak Advantage} \\\\
\\midrule\n`;

  for (const param of paramFiles) {
    const filepath = path.join(RESULTS_DIR, param.file);
    if (!fs.existsSync(filepath)) continue;

    const rows = parseCSV(filepath);

    // Use Med-Over as representative profile
    const medOverRows = rows.filter(r => r.profile === 'Med-Over');
    if (medOverRows.length === 0) continue;

    // Get sweep range
    const values = medOverRows.map(r => parseFloat(r.parameter_value));
    const sweepRange = `${Math.min(...values).toFixed(2)}--${Math.max(...values).toFixed(2)}`;

    // Robust range: advantage CI lower > 0
    const robustValues = medOverRows
      .filter(r => parseFloat(r.advantage_ci_lower) > 0)
      .map(r => parseFloat(r.parameter_value));

    let robustRange = '--';
    if (robustValues.length > 0) {
      robustRange = `${Math.min(...robustValues).toFixed(2)}--${Math.max(...robustValues).toFixed(2)}`;
    }

    // Peak advantage
    let peakAdv = 0;
    let peakVal = 0;
    for (const r of medOverRows) {
      const adv = parseFloat(r.advantage_mean);
      if (adv > peakAdv) {
        peakAdv = adv;
        peakVal = parseFloat(r.parameter_value);
      }
    }

    const peakStr = `+${(peakAdv * 100).toFixed(1)}\\% at $${param.symbol}$=${peakVal.toFixed(2)}`;

    tex += `${param.name} ($${param.symbol}$) & ${sweepRange} & ${robustRange} & ${peakStr} \\\\\n`;
  }

  tex += `\\bottomrule
\\end{tabular}
\\end{table}\n`;

  return tex;
}

// ---------------------------------------------------------------------------
// Table 3: δ Dose-Response Summary
// ---------------------------------------------------------------------------

function generateDeltaTable(): string {
  const rows = parseCSV(path.join(RESULTS_DIR, 'delta_sweep.csv'));

  // Average across overconfident profiles: Low-Over, Med-Over, High-Over
  const overProfiles = ['Low-Over', 'Med-Over', 'High-Over'];
  const deltas = [...new Set(rows.map(r => r.delta))].sort((a, b) => parseFloat(a) - parseFloat(b));

  let tex = `\\begin{table}[t]
\\centering
\\scriptsize
\\setlength{\\tabcolsep}{3pt}
\\caption{Scaffolding Dose-Response: ECE and Retention by $\\delta$ (Overconfident Profiles, Averaged)}
\\label{tab:delta}
\\begin{tabular}{ccccc}
\\toprule
$\\delta$ & \\textbf{ECE (\\%)} & \\textbf{Ret. (\\%)} & \\textbf{Mastery (sess.)} & \\textbf{Scaffolds} \\\\
\\midrule\n`;

  for (const delta of deltas) {
    const deltaRows = rows.filter(r => r.delta === delta && overProfiles.includes(r.profile));
    if (deltaRows.length === 0) continue;

    // Average across profiles
    const avgECE = deltaRows.reduce((s, r) => s + parseFloat(r.final_ece_mean), 0) / deltaRows.length;
    const avgECEsd = deltaRows.reduce((s, r) => s + parseFloat(r.final_ece_sd), 0) / deltaRows.length;
    const avgRet = deltaRows.reduce((s, r) => s + parseFloat(r.retention_7day_mean), 0) / deltaRows.length;
    const avgRetsd = deltaRows.reduce((s, r) => s + parseFloat(r.retention_7day_sd), 0) / deltaRows.length;
    const avgMast = deltaRows.reduce((s, r) => s + parseFloat(r.time_to_mastery_mean), 0) / deltaRows.length;
    const avgMastsd = deltaRows.reduce((s, r) => s + parseFloat(r.time_to_mastery_sd), 0) / deltaRows.length;
    const avgScaff = deltaRows.reduce((s, r) => s + parseFloat(r.scaffold_count_mean), 0) / deltaRows.length;
    const avgScaffsd = deltaRows.reduce((s, r) => s + parseFloat(r.scaffold_count_sd), 0) / deltaRows.length;

    const d = parseFloat(delta).toFixed(2);
    const ece = `${(avgECE * 100).toFixed(1)} $\\pm$ ${(avgECEsd * 100).toFixed(1)}`;
    const ret = `${(avgRet * 100).toFixed(1)} $\\pm$ ${(avgRetsd * 100).toFixed(1)}`;
    const mast = `${avgMast.toFixed(1)} $\\pm$ ${avgMastsd.toFixed(1)}`;
    const scaff = `${avgScaff.toFixed(1)} $\\pm$ ${avgScaffsd.toFixed(1)}`;

    tex += `${d} & ${ece} & ${ret} & ${mast} & ${scaff} \\\\\n`;
  }

  tex += `\\bottomrule
\\end{tabular}
\\end{table}\n`;

  return tex;
}

// ---------------------------------------------------------------------------
// Table 4: Extended Profiles Results
// ---------------------------------------------------------------------------

function generateExtendedTable(): string {
  const rows = parseCSV(path.join(RESULTS_DIR, 'ablation_extended_profiles.csv'));

  // Filter to retention_7day, Full CM and SM-2 only
  const retRows = rows.filter(r =>
    r.metric === 'retention_7day' &&
    (r.condition === 'Full CalibrateMe' || r.condition === 'SM-2 Baseline')
  );

  const profiles = ['Extreme-Over', 'Extreme-Under', 'Fast-Forget-Over', 'Noisy-Confidence', 'HighAb-Extreme-Over', 'Minimal-Bias'];

  // Build lookup
  const lookup = new Map<string, Map<string, CSVRow>>();
  for (const r of retRows) {
    if (!lookup.has(r.profile)) lookup.set(r.profile, new Map());
    lookup.get(r.profile)!.set(r.condition, r);
  }

  let tex = `\\begin{table}[t]
\\centering
\\scriptsize
\\setlength{\\tabcolsep}{3pt}
\\caption{Extended Profiles: 7-Day Retention (\\%) for Full CalibrateMe vs.\\ SM-2}
\\label{tab:extended}
\\begin{tabular}{lccc}
\\toprule
\\textbf{Profile} & \\textbf{Full CM} & \\textbf{SM-2} & \\textbf{Cohen's $d$} \\\\
\\midrule\n`;

  for (const profile of profiles) {
    const pMap = lookup.get(profile);
    if (!pMap) continue;

    const cm = pMap.get('Full CalibrateMe');
    const sm2 = pMap.get('SM-2 Baseline');
    if (!cm || !sm2) continue;

    const cmStr = fmtCI(cm.mean, cm.ci95_upper);
    const sm2Str = fmtCI(sm2.mean, sm2.ci95_upper);
    const dStr = cm.cohens_d_vs_sm2 !== 'N/A'
      ? `${fmtRaw(cm.cohens_d_vs_sm2, 2)} (${cm.effect_interpretation})`
      : '--';

    tex += `${profile} & ${cmStr} & ${sm2Str} & ${dStr} \\\\\n`;
  }

  tex += `\\bottomrule
\\end{tabular}
\\end{table}\n`;

  return tex;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  ensureDir(LATEX_DIR);

  const tables: { name: string; file: string; gen: () => string }[] = [
    { name: 'Ablation (Core)', file: 'table_ablation.tex', gen: generateAblationTable },
    { name: 'Sensitivity', file: 'table_sensitivity.tex', gen: generateSensitivityTable },
    { name: 'δ Dose-Response', file: 'table_delta.tex', gen: generateDeltaTable },
    { name: 'Extended Profiles', file: 'table_extended.tex', gen: generateExtendedTable },
  ];

  console.log('Generating LaTeX tables from CSV results...\n');

  for (const table of tables) {
    const tex = table.gen();
    const filepath = path.join(LATEX_DIR, table.file);
    fs.writeFileSync(filepath, tex, 'utf-8');
    console.log(`  ✓ ${table.name} → ${filepath}`);
  }

  console.log(`\nDone. ${tables.length} .tex files written to ${LATEX_DIR}/`);
}

main();
