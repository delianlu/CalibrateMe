import { ScaffoldPrompt } from './types';

export const scaffoldPrompts: ScaffoldPrompt[] = [
  // ── Overconfidence prompts ─────────────────────────────────────────
  {
    id: 'reflect-overconfident-mild',
    type: 'reflection',
    trigger: { condition: 'overconfident', threshold: 2, minResponses: 5 },
    content: {
      title: 'Reflection Moment',
      message:
        "You've been confident on a few items you got wrong. Before rating confidence, try to mentally recall the answer first.",
      action: 'Got it',
    },
    timing: 'before-answer',
  },
  {
    id: 'reflect-overconfident-moderate',
    type: 'reflection',
    trigger: { condition: 'overconfident', threshold: 3, minResponses: 8 },
    content: {
      title: 'Check Your Thinking',
      message:
        "Ask yourself: 'Can I explain why this is correct?' If not, consider lowering your confidence rating.",
      action: 'I\'ll try',
    },
    timing: 'before-answer',
  },
  {
    id: 'reflect-overconfident-severe',
    type: 'strategy',
    trigger: { condition: 'overconfident', threshold: 5, minResponses: 10 },
    content: {
      title: 'Calibration Strategy',
      message:
        "There's a pattern of high confidence on incorrect answers. Try the 'teach-back' method: before rating confidence, imagine explaining the answer to someone. If you can't, lower your confidence.",
      action: 'Will do',
    },
    timing: 'before-answer',
  },

  // ── Underconfidence prompts ────────────────────────────────────────
  {
    id: 'encourage-underconfident-mild',
    type: 'encouragement',
    trigger: { condition: 'underconfident', threshold: 2, minResponses: 5 },
    content: {
      title: 'You Know This!',
      message:
        "You've been getting items right even when you felt unsure. Trust your knowledge a bit more!",
      action: 'Thanks!',
    },
    timing: 'after-answer',
  },
  {
    id: 'encourage-underconfident-moderate',
    type: 'encouragement',
    trigger: { condition: 'underconfident', threshold: 4, minResponses: 8 },
    content: {
      title: 'Your Instincts Are Good',
      message:
        "Your accuracy is consistently higher than your confidence suggests. When you have a gut feeling, give yourself more credit.",
      action: 'I\'ll try',
    },
    timing: 'after-answer',
  },

  // ── Streak prompts ─────────────────────────────────────────────────
  {
    id: 'streak-wrong',
    type: 'strategy',
    trigger: { condition: 'streak-wrong', threshold: 3, minResponses: 3 },
    content: {
      title: 'Take a Breath',
      message:
        "A few misses in a row — that's normal! Try slowing down and reading each word carefully before responding.",
      action: 'OK',
    },
    timing: 'before-answer',
  },
  {
    id: 'streak-correct',
    type: 'encouragement',
    trigger: { condition: 'streak-correct', threshold: 5, minResponses: 5 },
    content: {
      title: 'Great Streak!',
      message:
        "You're on a roll — 5 correct in a row! Keep it up and make sure your confidence ratings match this performance.",
      action: 'Nice!',
    },
    timing: 'after-answer',
  },
];
