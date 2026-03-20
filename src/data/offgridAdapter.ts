/**
 * Adapter to convert OffGrid practice activities into CalibrateMe QuizItems.
 */
import { QuizItem } from '../features/quiz/types';
import offgridData from '../../offgrid-practice-export.json';

interface OffGridActivity {
  id: string;
  type: 'multiple-choice' | 'error_correction';
  question: string;
  answer: string;
  options: string[];
  difficulty: number;
  category: string;
  moduleId: string;
  tags: string[];
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  sourceLanguage: string;
  targetLanguage: string;
  feedback: string;
  correction: string | null;
  frenchComparison?: {
    frenchStructure: string;
    englishStructure: string;
    whyDifficult: string;
    visualHighlighting?: { incorrect: string; correct: string };
  };
  scenario?: {
    name: string;
    icon: string;
    context: string;
    characters: string[];
  };
  falseCognate?: {
    englishWord: string;
    frenchWord: string;
    frenchMeaning: string;
    englishMeaning: string;
    commonMistake: string;
    memoryTrick: string;
  };
}

function adaptActivity(activity: OffGridActivity): QuizItem {
  return {
    id: activity.id,
    // For grammar exercises, word = question prompt, translation = correct answer
    word: activity.question,
    translation: activity.answer,
    difficulty: activity.difficulty,
    tags: activity.tags,
    cefrLevel: activity.cefrLevel,
    // Grammar-specific fields
    itemType: activity.type,
    question: activity.question,
    answer: activity.answer,
    options: activity.options,
    feedback: activity.feedback,
    correction: activity.correction,
    category: activity.category,
    moduleId: activity.moduleId,
    frenchComparison: activity.frenchComparison,
    scenario: activity.scenario,
    falseCognate: activity.falseCognate,
  };
}

export function getOffGridActivities(): QuizItem[] {
  const data = offgridData as { activities: OffGridActivity[] };
  return data.activities.map(adaptActivity);
}

export function getOffGridActivitiesByModule(moduleId: string): QuizItem[] {
  return getOffGridActivities().filter(item => item.moduleId === moduleId);
}

export const OFFGRID_MODULES = [
  { id: 'tense-form', name: 'Tense & Form', count: 50 },
  { id: 'subject-verb-agreement', name: 'Subject-Verb Agreement', count: 40 },
  { id: 'articles', name: 'Articles', count: 20 },
  { id: 'plurality', name: 'Plurality', count: 20 },
  { id: 'word-order', name: 'Word Order', count: 30 },
  { id: 'cameroonian-scenarios', name: 'Cameroonian Scenarios', count: 69 },
  { id: 'prepositions', name: 'Prepositions', count: 30 },
  { id: 'false-cognates', name: 'False Cognates', count: 50 },
  { id: 'auxiliaries', name: 'Auxiliaries', count: 20 },
] as const;
