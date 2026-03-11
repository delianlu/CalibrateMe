import { TriviQuestion } from './types';

/**
 * 30 general-knowledge trivia questions designed for calibration training.
 *
 * Design principles:
 * - Mix of easy (10), medium (10), hard (10) across 6 categories
 * - Some "trick" questions where the obvious answer is wrong (tests overconfidence)
 * - Some questions where most people know the answer but feel uncertain (tests underconfidence)
 * - Varied difficulty so users naturally give different confidence levels
 */
export const QUESTION_BANK: TriviQuestion[] = [
  // ─── Easy (10) ────────────────────────────────────────────────────
  {
    id: 'e1',
    question: 'What is the chemical symbol for water?',
    options: ['H2O', 'CO2', 'NaCl', 'O2'],
    correctIndex: 0,
    category: 'science',
    difficulty: 'easy',
  },
  {
    id: 'e2',
    question: 'Which continent is Brazil located on?',
    options: ['Africa', 'South America', 'Europe', 'Asia'],
    correctIndex: 1,
    category: 'geography',
    difficulty: 'easy',
  },
  {
    id: 'e3',
    question: 'How many days are in a leap year?',
    options: ['364', '365', '366', '367'],
    correctIndex: 2,
    category: 'math',
    difficulty: 'easy',
  },
  {
    id: 'e4',
    question: 'What gas do plants absorb from the atmosphere during photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
    correctIndex: 2,
    category: 'science',
    difficulty: 'easy',
  },
  {
    id: 'e5',
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Earth', 'Mars', 'Mercury'],
    correctIndex: 3,
    category: 'science',
    difficulty: 'easy',
  },
  {
    id: 'e6',
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctIndex: 3,
    category: 'geography',
    difficulty: 'easy',
  },
  {
    id: 'e7',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctIndex: 2,
    category: 'history',
    difficulty: 'easy',
  },
  {
    id: 'e8',
    question: 'What is the square root of 144?',
    options: ['10', '11', '12', '14'],
    correctIndex: 2,
    category: 'math',
    difficulty: 'easy',
  },
  {
    id: 'e9',
    question: 'Which animal is known as the "King of the Jungle"?',
    options: ['Tiger', 'Elephant', 'Lion', 'Gorilla'],
    correctIndex: 2,
    category: 'nature',
    difficulty: 'easy',
  },
  {
    id: 'e10',
    question: 'How many letters are in the English alphabet?',
    options: ['24', '25', '26', '27'],
    correctIndex: 2,
    category: 'language',
    difficulty: 'easy',
  },

  // ─── Medium (10) ──────────────────────────────────────────────────
  {
    id: 'm1',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctIndex: 2,
    category: 'geography',
    difficulty: 'medium',
  },
  {
    id: 'm2',
    question: 'Which element has the atomic number 79?',
    options: ['Silver', 'Platinum', 'Gold', 'Copper'],
    correctIndex: 2,
    category: 'science',
    difficulty: 'medium',
  },
  {
    id: 'm3',
    question: 'The Great Wall of China was primarily built to protect against invasions from which direction?',
    options: ['South', 'East', 'West', 'North'],
    correctIndex: 3,
    category: 'history',
    difficulty: 'medium',
  },
  {
    id: 'm4',
    question: 'What is the value of pi rounded to two decimal places?',
    options: ['3.12', '3.14', '3.16', '3.18'],
    correctIndex: 1,
    category: 'math',
    difficulty: 'medium',
  },
  {
    id: 'm5',
    question: 'Which language has the most native speakers worldwide?',
    options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'],
    correctIndex: 2,
    category: 'language',
    difficulty: 'medium',
  },
  {
    id: 'm6',
    question: 'How many hearts does an octopus have?',
    options: ['1', '2', '3', '4'],
    correctIndex: 2,
    category: 'nature',
    difficulty: 'medium',
  },
  {
    id: 'm7',
    question: 'Which planet has the most moons in our solar system?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correctIndex: 1,
    category: 'science',
    difficulty: 'medium',
  },
  {
    id: 'm8',
    question: 'In what year was the United Nations founded?',
    options: ['1942', '1945', '1948', '1950'],
    correctIndex: 1,
    category: 'history',
    difficulty: 'medium',
  },
  {
    id: 'm9',
    question: 'What is the longest river in Africa?',
    options: ['Congo', 'Niger', 'Zambezi', 'Nile'],
    correctIndex: 3,
    category: 'geography',
    difficulty: 'medium',
  },
  {
    id: 'm10',
    question: 'How many bones does an adult human body have?',
    options: ['186', '196', '206', '216'],
    correctIndex: 2,
    category: 'science',
    difficulty: 'medium',
  },

  // ─── Hard (10) — includes several "trick" questions ───────────────
  {
    id: 'h1',
    question: 'Which country has the longest coastline in the world?',
    options: ['Australia', 'Russia', 'Indonesia', 'Canada'],
    correctIndex: 3,
    category: 'geography',
    difficulty: 'hard',
  },
  {
    id: 'h2',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Titanium', 'Diamond', 'Tungsten', 'Quartz'],
    correctIndex: 1,
    category: 'science',
    difficulty: 'hard',
  },
  {
    id: 'h3',
    question: 'The Hundred Years\' War lasted approximately how many years?',
    options: ['100', '106', '116', '126'],
    correctIndex: 2,
    category: 'history',
    difficulty: 'hard',
  },
  {
    id: 'h4',
    question: 'What percentage of the Earth\'s water is fresh water?',
    options: ['About 3%', 'About 10%', 'About 20%', 'About 30%'],
    correctIndex: 0,
    category: 'science',
    difficulty: 'hard',
  },
  {
    id: 'h5',
    question: 'Which of these animals sleeps the most hours per day?',
    options: ['Cat', 'Sloth', 'Koala', 'Python'],
    correctIndex: 2,
    category: 'nature',
    difficulty: 'hard',
  },
  {
    id: 'h6',
    question: 'What is the smallest country in the world by area?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correctIndex: 1,
    category: 'geography',
    difficulty: 'hard',
  },
  {
    id: 'h7',
    question: 'In mathematics, what is the sum of all interior angles of a hexagon?',
    options: ['540 degrees', '600 degrees', '720 degrees', '900 degrees'],
    correctIndex: 2,
    category: 'math',
    difficulty: 'hard',
  },
  {
    id: 'h8',
    question: 'Which language is "Esperanto" most closely based on?',
    options: ['Latin and Romance languages', 'Germanic languages', 'Slavic languages', 'Greek'],
    correctIndex: 0,
    category: 'language',
    difficulty: 'hard',
  },
  {
    id: 'h9',
    question: 'What is the most abundant gas in Earth\'s atmosphere?',
    options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'],
    correctIndex: 2,
    category: 'science',
    difficulty: 'hard',
  },
  {
    id: 'h10',
    question: 'The Panama Canal connects the Atlantic Ocean to which other ocean?',
    options: ['Indian Ocean', 'Pacific Ocean', 'Arctic Ocean', 'Southern Ocean'],
    correctIndex: 1,
    category: 'geography',
    difficulty: 'hard',
  },
];

/**
 * Randomly select `count` questions from the question bank,
 * using a Fisher-Yates shuffle for uniform randomness.
 */
export function pickRandomQuestions(count: number = 10): TriviQuestion[] {
  const pool = [...QUESTION_BANK];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
