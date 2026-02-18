// =============================================================================
// SRL Scaffolding Types
// =============================================================================

export interface ScaffoldPrompt {
  id: string;
  type: 'reflection' | 'encouragement' | 'strategy';
  trigger: ScaffoldTrigger;
  content: {
    title: string;
    message: string;
    action: string;
  };
  timing: 'before-answer' | 'after-answer' | 'end-of-session';
}

export interface ScaffoldTrigger {
  condition: 'overconfident' | 'underconfident' | 'streak-wrong' | 'streak-correct';
  threshold: number;
  minResponses: number;
}

export interface ScaffoldState {
  activePrompt: ScaffoldPrompt | null;
  dismissedIds: Set<string>;
  recentCorrect: number;
  recentIncorrect: number;
  recentOverconfident: number;  // high conf + wrong
  recentUnderconfident: number; // low conf + correct
  totalShown: number;
}
