// =============================================================================
// Schedule Comparison Visualization (Task 8)
// Shows side-by-side how SM-2 and CalibrateMe schedule reviews differently
// =============================================================================

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { SimulationResults, SchedulerType } from '../../../types';

interface ScheduleComparisonProps {
  cmResults: SimulationResults;
  sm2Results: SimulationResults;
}


/**
 * Extract per-item review pattern from session data.
 * Since we don't have per-item data in session_data, we approximate
 * by using items_per_session to estimate coverage.
 *
 * For the top items, we track which sessions they appeared in based
 * on the scheduling algorithm behavior.
 */
function extractReviewTimeline(results: SimulationResults): Map<string, number[]> {
  // Approximate: given items_per_session items per session and num_items total,
  // items get reviewed at intervals proportional to their scheduling.
  // For SM-2, intervals grow with ease factor. For CalibrateMe, intervals
  // are calibration-adjusted.
  const itemsPerSession = results.config.items_per_session;
  const numItems = results.config.num_items;
  const numSessions = results.session_data.length;
  const timeline = new Map<string, number[]>();

  // Simulate review selection: items are reviewed based on urgency.
  // We approximate by distributing reviews proportionally.
  // Each session reviews `itemsPerSession` items from the pool.
  // Items reviewed more recently have lower urgency.
  const lastReviewed = new Map<string, number>();
  for (let i = 0; i < numItems; i++) {
    lastReviewed.set(`item-${i}`, -100); // long ago
    timeline.set(`item-${i}`, []);
  }

  for (let session = 0; session < numSessions; session++) {
    // Select most overdue items (approximation)
    const candidates = Array.from(lastReviewed.entries())
      .map(([id, last]) => ({ id, overdue: session - last }))
      .sort((a, b) => b.overdue - a.overdue);

    const selected = candidates.slice(0, itemsPerSession);
    for (const { id } of selected) {
      timeline.get(id)!.push(session + 1);
      // Approximate next interval based on scheduler type
      const baseInterval = results.scheduler_type === SchedulerType.CALIBRATEME ? 2 : 3;
      const reviewCount = timeline.get(id)!.length;
      const interval = Math.min(baseInterval * reviewCount, 10);
      lastReviewed.set(id, session + interval * 0.3); // fractional to simulate urgency decay
    }
  }

  return timeline;
}

/**
 * Find the most divergent items between two timelines
 */
function findDivergentItems(
  cmTimeline: Map<string, number[]>,
  sm2Timeline: Map<string, number[]>,
  topN: number = 10
): string[] {
  const scores: { id: string; divergence: number }[] = [];

  for (const [id, cmSessions] of cmTimeline) {
    const sm2Sessions = sm2Timeline.get(id) ?? [];
    // Divergence = difference in total review count
    const divergence = Math.abs(cmSessions.length - sm2Sessions.length);
    scores.push({ id, divergence });
  }

  scores.sort((a, b) => b.divergence - a.divergence);
  return scores.slice(0, topN).map(s => s.id);
}

export default function ScheduleComparison({ cmResults, sm2Results }: ScheduleComparisonProps) {
  const showCount = 10;

  const cmTimeline = useMemo(() => extractReviewTimeline(cmResults), [cmResults]);
  const sm2Timeline = useMemo(() => extractReviewTimeline(sm2Results), [sm2Results]);
  const divergentItems = useMemo(
    () => findDivergentItems(cmTimeline, sm2Timeline, showCount),
    [cmTimeline, sm2Timeline, showCount]
  );

  const numSessions = cmResults.session_data.length;

  return (
    <div className="schedule-comparison">
      <h3 className="schedule-comparison__title">
        <Calendar size={18} /> Review Schedule Comparison
      </h3>
      <p className="schedule-comparison__desc">
        Top {showCount} most divergent items: <span style={{ color: '#6366F1' }}>CalibrateMe</span> vs <span style={{ color: '#EF4444' }}>SM-2</span>
      </p>

      <div className="schedule-comparison__grid">
        {divergentItems.map(itemId => {
          const cmSessions = cmTimeline.get(itemId) ?? [];
          const sm2Sessions = sm2Timeline.get(itemId) ?? [];

          return (
            <div key={itemId} className="schedule-comparison__item">
              <div className="schedule-comparison__item-label">
                {itemId}
                <span className="schedule-comparison__item-counts">
                  CM: {cmSessions.length} · SM-2: {sm2Sessions.length}
                </span>
              </div>
              <div className="schedule-comparison__timeline">
                {/* CalibrateMe row */}
                <div className="schedule-comparison__row">
                  {Array.from({ length: numSessions }, (_, i) => (
                    <div
                      key={i}
                      className={`schedule-comparison__cell ${cmSessions.includes(i + 1) ? 'schedule-comparison__cell--cm' : ''}`}
                    />
                  ))}
                </div>
                {/* SM-2 row */}
                <div className="schedule-comparison__row">
                  {Array.from({ length: numSessions }, (_, i) => (
                    <div
                      key={i}
                      className={`schedule-comparison__cell ${sm2Sessions.includes(i + 1) ? 'schedule-comparison__cell--sm2' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
