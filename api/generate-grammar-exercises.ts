import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { GenerateGrammarExercisesRequest, GenerateGrammarExercisesResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, count, difficulty, exerciseTypes, cefrLevel } = req.body as GenerateGrammarExercisesRequest;

    const difficultyValue = difficulty === 'easy' ? 0.25 : difficulty === 'medium' ? 0.50 : 0.80;
    const cefrNote = cefrLevel ? `Target CEFR level: ${cefrLevel}.` : '';

    const typeInstructions = exerciseTypes.map(t => {
      switch (t) {
        case 'multiple-choice':
          return 'multiple-choice: Provide a question with exactly 4 options and one correct answer.';
        case 'error_correction':
          return 'error_correction: Provide an incorrect sentence as the question and the corrected sentence as the answer. Options should include the incorrect sentence plus 3 corrected variations (only one fully correct).';
        case 'fill-blank-typing':
          return 'fill-blank-typing: Provide a sentence with a blank (use "___") and the correct word/phrase as the answer. No options needed.';
        case 'sentence-reorder':
          return 'sentence-reorder: Provide scrambled words as the question (separated by " / ") and the correctly ordered sentence as the answer. No options needed.';
        default:
          return '';
      }
    }).filter(Boolean).join('\n');

    const prompt = `Generate exactly ${count} English grammar exercises for French speakers on the topic: "${topic}". Difficulty: ${difficulty}. ${cefrNote}

EXERCISE TYPES TO GENERATE (distribute evenly):
${typeInstructions}

For each exercise, provide:
- question: The exercise prompt
- answer: The correct answer
- options: Array of 4 options (for multiple-choice/error_correction only; empty array for others)
- exerciseType: One of "${exerciseTypes.join('", "')}"
- difficulty: ${difficultyValue}
- explanation: 1-2 sentences explaining the grammar rule being tested
- frenchComparison: Why this is specifically difficult for French speakers (L1 interference)
- tags: 2-3 relevant tags (e.g., "present-tense", "articles", "B1")

IMPORTANT GUIDELINES:
- Focus on grammar patterns where French speakers make systematic errors
- Include scenarios relevant to everyday life
- For multiple-choice, make distractors plausible (common French-speaker errors)
- Return ONLY a valid JSON object with an "exercises" array

Return ONLY valid JSON: {"exercises": [...]}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an English grammar expert specializing in exercises for French speakers. Create clear, pedagogically sound exercises. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || '{"exercises": []}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result: GenerateGrammarExercisesResponse = JSON.parse(cleaned);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Grammar exercise generation error:', error);
    return res.status(500).json({ error: 'Failed to generate grammar exercises', detail: error.message });
  }
}
