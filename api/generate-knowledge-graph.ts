import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { KnowledgeGraphRequest, KnowledgeGraphResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as KnowledgeGraphRequest;

    const words = data.words.slice(0, 50);
    const wordList = words.map(w => `${w.word} (${w.translation}) [${w.tags.join(', ')}]`).join('\n');

    const prompt = `Analyze these English vocabulary words and identify semantic relationships between them. Group them into clusters and identify edges (connections) between related words.

VOCABULARY:
${wordList}

For each pair of related words, provide:
- source: first word
- target: second word
- weight: similarity strength 0.0-1.0
- relationship: type of connection (one of: "synonym", "antonym", "same-category", "part-of", "causes", "used-together", "opposite-meaning", "similar-meaning", "same-domain")

Also identify 4-8 semantic clusters (groups of related words).

Rules:
- Only include edges where the relationship is meaningful (weight > 0.3)
- Each word should have at least 1 edge but no more than 5
- Clusters should have 3-10 words each
- A word can belong to multiple clusters
- Assign each cluster a distinct hex color from this palette: #6366f1, #22c55e, #f59e0b, #ef4444, #8b5cf6, #ec4899, #14b8a6, #f97316

Return ONLY valid JSON: {"edges": [...], "clusters": [...]}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a computational linguist. Analyze semantic relationships between words. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const graph: KnowledgeGraphResponse = JSON.parse(cleaned);

    return res.status(200).json(graph);
  } catch (error: any) {
    console.error('Knowledge graph error:', error);
    return res.status(500).json({ error: 'Failed to generate knowledge graph', detail: error.message });
  }
}
