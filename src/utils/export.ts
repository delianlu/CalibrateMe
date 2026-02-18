// =============================================================================
// Export Utilities
// =============================================================================

import { SimulationResults } from '../types';

/**
 * Export simulation results to CSV format
 */
export function exportToCSV(results: SimulationResults): string {
  const headers = [
    'session',
    'items_reviewed',
    'correct_count',
    'accuracy',
    'mean_confidence',
    'mean_rt',
    'type1_count',
    'type2_count',
    'scaffolds',
    'mean_K_star',
    'mean_K_hat',
    'ece',
    'brier',
  ];

  const rows = results.session_data.map(s => [
    s.session_number + 1,
    s.items_reviewed,
    s.correct_count,
    (s.correct_count / s.items_reviewed).toFixed(4),
    s.mean_confidence.toFixed(4),
    s.mean_rt.toFixed(2),
    s.type1_count,
    s.type2_count,
    s.scaffolds_delivered,
    s.mean_K_star.toFixed(4),
    s.mean_K_hat.toFixed(4),
    s.ece.toFixed(4),
    s.brier.toFixed(4),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export simulation results to JSON format
 */
export function exportToJSON(results: SimulationResults): string {
  return JSON.stringify(results, null, 2);
}

/**
 * Download file in browser
 */
export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export results as CSV download
 */
export function downloadCSV(results: SimulationResults, filename: string = 'results.csv'): void {
  downloadFile(exportToCSV(results), filename, 'text/csv');
}

/**
 * Export results as JSON download
 */
export function downloadJSON(results: SimulationResults, filename: string = 'results.json'): void {
  downloadFile(exportToJSON(results), filename, 'application/json');
}
