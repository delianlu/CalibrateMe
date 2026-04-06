import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { PronunciationGuideRequest, PronunciationGuideResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as PronunciationGuideRequest;

    const words = data.words.slice(0, 20);
    const wordList = words.map(w => `${w.word} (French: ${w.translation})`).join('\n');

    const prompt = `Generate pronunciation guides for these English words, specifically for French speakers. Focus on sounds that French speakers find difficult.

WORDS:
${wordList}

For each word, provide:
- word: the English word
- ipa: IPA transcription (e.g., /ˈnɒl.ɪdʒ/)
- phonetic: simplified phonetic spelling for French speakers (e.g., "NOL-ij")
- tips: specific pronunciation advice focusing on sounds that differ from French (e.g., "th" sounds, vowel differences, stress patterns, silent letters)
- commonErrors: what French speakers typically say wrong and why (L1 interference)
- audioDescription: describe how to physically produce the difficult sounds (tongue placement, lip shape, airflow)

KEY FRENCH-ENGLISH PRONUNCIATION CHALLENGES TO ADDRESS:
- "th" sounds (/θ/ and /ð/) — French has no equivalent
- "h" aspiration — French "h" is silent
- Vowel length distinctions (ship vs sheep)
- Word stress patterns (French has even stress; English has variable stress)
- "r" sound differences (French uvular vs English approximant)
- Silent letters that differ between languages
- Diphthongs not present in French

Return ONLY valid JSON: {"entries": [...]}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a phonetics expert specializing in French-to-English pronunciation. Provide accurate IPA transcriptions and practical pronunciation guidance. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content || '{"entries": []}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const guide: PronunciationGuideResponse = JSON.parse(cleaned);

    return res.status(200).json(guide);
  } catch (error: any) {
    console.error('Pronunciation guide error:', error);
    return res.status(500).json({ error: 'Failed to generate pronunciation guide', detail: error.message });
  }
}
