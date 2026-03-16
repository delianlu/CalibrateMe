import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL } from './_groqClient';
import type { GrammarExplainRequest, GrammarExplainResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as GrammarExplainRequest;

    const prompt = `A French speaker learning English got this grammar question wrong. Explain the grammar rule in a clear, helpful way.

QUESTION: ${data.question}
OPTIONS: ${data.options.join(' / ')}
USER'S ANSWER: ${data.userAnswer}
CORRECT ANSWER: ${data.correctAnswer}
USER'S CONFIDENCE: ${data.userConfidence}%

Provide:
1. explanation: 2-3 sentences explaining WHY the correct answer is right and why the user's answer is wrong. Use simple English appropriate for an intermediate learner.
2. rule: the name of the grammar rule (e.g., "Present Perfect vs Past Simple")
3. tip: a short mnemonic or memory trick to remember this rule
4. commonMistake: why French speakers specifically make this mistake (L1 interference)

${data.userConfidence > 70 ? 'NOTE: The user was highly confident but wrong. Gently address this overconfidence — the item felt familiar but the rule is trickier than it seems.' : ''}

Return ONLY valid JSON: {"explanation": "...", "rule": "...", "tip": "...", "commonMistake": "..."}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an English grammar teacher for French speakers. Be clear, supportive, and specific. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const explanation: GrammarExplainResponse = JSON.parse(cleaned);

    return res.status(200).json(explanation);
  } catch (error: any) {
    console.error('Grammar explainer error:', error);
    return res.status(500).json({ error: 'Failed to explain grammar', detail: error.message });
  }
}
