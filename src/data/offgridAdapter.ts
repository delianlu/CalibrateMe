/**
 * Adapter to convert OffGrid practice activities into CalibrateMe QuizItems.
 */
import { QuizItem } from '../features/quiz/types';
import offgridData from '../../offgrid-practice-export.json';

interface OffGridActivity {
  id: string;
  type: 'multiple-choice' | 'error_correction' | 'sentence-reorder' | 'fill-blank-typing';
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
  acceptableAnswers?: string[];
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
    acceptableAnswers: activity.acceptableAnswers,
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
  { id: 'tense-form', name: 'Tense & Form', count: 70 },
  { id: 'subject-verb-agreement', name: 'Subject-Verb Agreement', count: 50 },
  { id: 'articles', name: 'Articles', count: 40 },
  { id: 'plurality', name: 'Plurality', count: 30 },
  { id: 'word-order', name: 'Word Order', count: 40 },
  { id: 'cameroonian-scenarios', name: 'Cameroonian Scenarios', count: 69 },
  { id: 'prepositions', name: 'Prepositions', count: 50 },
  { id: 'false-cognates', name: 'False Cognates', count: 50 },
  { id: 'auxiliaries', name: 'Auxiliaries', count: 35 },
  { id: 'conditionals', name: 'Conditionals', count: 30 },
  { id: 'passive-voice', name: 'Passive Voice', count: 25 },
  { id: 'reported-speech', name: 'Reported Speech', count: 20 },
  { id: 'sentence-reorder', name: 'Sentence Reorder', count: 25 },
  { id: 'fill-blank-typing', name: 'Fill in the Blank', count: 25 },
] as const;
