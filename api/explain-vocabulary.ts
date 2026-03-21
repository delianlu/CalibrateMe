import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL } from './_groqClient';
import type { VocabularyExplainRequest, VocabularyExplainResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as VocabularyExplainRequest;

    const prompt = `A French speaker learning English needs help understanding this vocabulary word they got wrong or are struggling with.

WORD: ${data.word}
FRENCH TRANSLATION: ${data.translation}
USER'S CONFIDENCE: ${data.userConfidence}%
${data.context ? `CONTEXT: ${data.context}` : ''}
${data.tags?.length ? `TAGS: ${data.tags.join(', ')}` : ''}

Provide:
1. explanation: 2-3 sentences explaining the word's meaning, nuances, and when to use it. Use simple English for intermediate learners.
2. etymology: Brief word origin that helps understand and remember the meaning (Latin/Greek/French roots are especially useful for French speakers).
3. usageNotes: Common collocations, register (formal/informal), and contexts where this word is used.
4. mnemonic: A vivid memory trick connecting the French and English words (use cognates, sound-alikes, or imagery).
5. commonConfusions: Words that French speakers often confuse with this one (faux amis, similar-sounding words, etc.).
6. exampleSentences: 3 clear example sentences showing the word used in different contexts.

${data.userConfidence > 70 ? 'NOTE: The user was highly confident but got this wrong. Address this overconfidence — the word seems familiar but has subtle differences from what they assumed.' : ''}
${data.userConfidence < 30 ? 'NOTE: The user had very low confidence. Be encouraging — help them see patterns and connections that make this word learnable.' : ''}

Return ONLY valid JSON: {"explanation": "...", "etymology": "...", "usageNotes": "...", "mnemonic": "...", "commonConfusions": "...", "exampleSentences": ["...", "...", "..."]}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a vocabulary expert specializing in French-to-English language learning. Be clear, supportive, and specific. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const explanation: VocabularyExplainResponse = JSON.parse(cleaned);

    return res.status(200).json(explanation);
  } catch (error: any) {
    console.error('Vocabulary explainer error:', error);
    return res.status(500).json({ error: 'Failed to explain vocabulary', detail: error.message });
  }
}
