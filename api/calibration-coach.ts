import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { CalibrationCoachRequest, CoachResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as CalibrationCoachRequest;

    const calibrationType = data.betaHat > 0.1 ? 'overconfident' : data.betaHat < -0.1 ? 'underconfident' : 'well-calibrated';

    const domainNote = data.domainSplit
      ? `Domain-specific calibration: vocabulary β̂ = ${data.domainSplit.vocabBetaHat.toFixed(3)}, grammar β̂ = ${data.domainSplit.grammarBetaHat.toFixed(3)}.`
      : '';

    const prompt = `You are a metacognitive learning coach specializing in calibration accuracy. Analyze this learner's data and provide personalized coaching.

LEARNER DATA:
- Calibration bias (β̂): ${data.betaHat.toFixed(3)} (${calibrationType})
- Expected Calibration Error (ECE): ${(data.ece * 100).toFixed(1)}%
- Accuracy: ${(data.accuracy * 100).toFixed(1)}%
- Total sessions completed: ${data.totalSessions}
- Recent calibration trend: ${data.recentTrend}
- Automatic (Type 1) response ratio: ${(data.dualProcessRatio * 100).toFixed(0)}%
- Strengths: ${data.strengths.join(', ') || 'none identified yet'}
- Weaknesses: ${data.weaknesses.join(', ') || 'none identified yet'}
${domainNote}

COACHING PRINCIPLES:
- Reference metacognitive monitoring and control (Nelson & Narens)
- For overconfident learners: suggest self-testing before rating confidence ("Can I explain this from memory?")
- For underconfident learners: suggest recognizing their actual competence and trusting retrieval cues
- For well-calibrated learners: suggest maintaining awareness and pushing to harder material
- Be specific to their data, not generic
- Keep strategies actionable and concrete (things they can do in their next session)

Return ONLY valid JSON with this structure:
{"summary": "...", "diagnosis": "...", "strategies": ["...", "...", "..."], "encouragement": "...", "focusArea": "..."}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a metacognitive learning coach. Respond with valid JSON only. No markdown.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const coaching: CoachResponse = JSON.parse(cleaned);

    return res.status(200).json(coaching);
  } catch (error: any) {
    console.error('Calibration coach error:', error);
    return res.status(500).json({ error: 'Failed to generate coaching', detail: error.message });
  }
}
