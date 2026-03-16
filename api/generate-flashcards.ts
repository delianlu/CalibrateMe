import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { FlashcardRequest, GeneratedFlashcard } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, count, difficulty } = req.body as FlashcardRequest;

    const difficultyValue = difficulty === 'easy' ? 0.17 : difficulty === 'medium' ? 0.50 : 0.83;

    const prompt = `Generate exactly ${count} English vocabulary flashcards for French speakers on the topic: "${topic}". Difficulty level: ${difficulty}.

For each word, provide:
- word: the English word
- translation: the French translation
- difficulty: ${difficultyValue}
- tags: 2-3 relevant tags (e.g., "noun", "food", "academic")
- exampleSentence: a simple sentence using the word in context
- mnemonic: a memory trick connecting the French and English words (use cognates, sound-alikes, or vivid imagery)

IMPORTANT: Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the JSON array.

Example format:
[{"word": "knowledge", "translation": "connaissance", "difficulty": 0.50, "tags": ["noun", "academic"], "exampleSentence": "Knowledge is power.", "mnemonic": "CONNAISsance → to KNOW is to have COGNIZANCE"}]`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a language learning expert specializing in French-to-English vocabulary. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const flashcards: GeneratedFlashcard[] = JSON.parse(cleaned);

    return res.status(200).json({ flashcards });
  } catch (error: any) {
    console.error('Flashcard generation error:', error);
    return res.status(500).json({ error: 'Failed to generate flashcards', detail: error.message });
  }
}
