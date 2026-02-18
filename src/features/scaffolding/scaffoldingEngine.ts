import { ScaffoldPrompt, ScaffoldState } from './types';
import { scaffoldPrompts } from './promptLibrary';
import { QuizResponse } from '../quiz/types';

export function createScaffoldState(): ScaffoldState {
  return {
    activePrompt: null,
    dismissedIds: new Set(),
    recentCorrect: 0,
    recentIncorrect: 0,
    recentOverconfident: 0,
    recentUnderconfident: 0,
    totalShown: 0,
  };
}

/**
 * Update scaffold state based on a new quiz response.
 * Returns updated state with potentially a new active prompt.
 */
export function processResponse(
  state: ScaffoldState,
  response: QuizResponse,
  totalResponses: number
): ScaffoldState {
  const next: ScaffoldState = { ...state, activePrompt: null };

  // Track streaks
  if (response.correctness) {
    next.recentCorrect += 1;
    next.recentIncorrect = 0;
  } else {
    next.recentIncorrect += 1;
    next.recentCorrect = 0;
  }

  // Track calibration mismatches
  if (!response.correctness && response.confidence > 60) {
    next.recentOverconfident += 1;
  }
  if (response.correctness && response.confidence < 40) {
    next.recentUnderconfident += 1;
  }

  // Find the best matching prompt
  let bestPrompt: ScaffoldPrompt | null = null;
  let bestScore = 0;

  for (const prompt of scaffoldPrompts) {
    if (state.dismissedIds.has(prompt.id)) continue;
    if (totalResponses < prompt.trigger.minResponses) continue;

    let triggered = false;
    let score = 0;

    switch (prompt.trigger.condition) {
      case 'overconfident':
        triggered = next.recentOverconfident >= prompt.trigger.threshold;
        score = next.recentOverconfident;
        break;
      case 'underconfident':
        triggered = next.recentUnderconfident >= prompt.trigger.threshold;
        score = next.recentUnderconfident;
        break;
      case 'streak-wrong':
        triggered = next.recentIncorrect >= prompt.trigger.threshold;
        score = next.recentIncorrect;
        break;
      case 'streak-correct':
        triggered = next.recentCorrect >= prompt.trigger.threshold;
        score = next.recentCorrect;
        break;
    }

    if (triggered && score > bestScore) {
      bestPrompt = prompt;
      bestScore = score;
    }
  }

  if (bestPrompt) {
    next.activePrompt = bestPrompt;
    next.totalShown += 1;
  }

  return next;
}

/**
 * Dismiss the current prompt (user clicked action button).
 * Resets the counter for the dismissed condition.
 */
export function dismissPrompt(state: ScaffoldState): ScaffoldState {
  const next = { ...state };
  if (state.activePrompt) {
    next.dismissedIds = new Set(state.dismissedIds);
    next.dismissedIds.add(state.activePrompt.id);

    // Reset the relevant counter so the same type doesn't re-trigger immediately
    switch (state.activePrompt.trigger.condition) {
      case 'overconfident':
        next.recentOverconfident = 0;
        break;
      case 'underconfident':
        next.recentUnderconfident = 0;
        break;
      case 'streak-wrong':
        next.recentIncorrect = 0;
        break;
      case 'streak-correct':
        next.recentCorrect = 0;
        break;
    }
  }
  next.activePrompt = null;
  return next;
}
