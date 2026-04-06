import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { ProgressReportRequest, ProgressReportResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as ProgressReportRequest;

    const prompt = `Generate a comprehensive learning progress report for a French speaker learning English. Analyze their metacognitive calibration and learning trajectory.

LEARNER DATA:
- Total sessions completed: ${data.totalSessions}
- Total reviews: ${data.totalReviews}
- Overall accuracy: ${(data.accuracy * 100).toFixed(1)}%
- Vocabulary accuracy: ${(data.vocabAccuracy * 100).toFixed(1)}%
- Grammar accuracy: ${(data.grammarAccuracy * 100).toFixed(1)}%
- Calibration bias (β̂): ${data.betaHat.toFixed(3)} (${data.calibrationType})
- Expected Calibration Error (ECE): ${(data.ece * 100).toFixed(1)}%
- Current streak: ${data.streakDays} days
- Mastered items: ${data.masteredItems} / ${data.totalItems}
- Days active: ${data.daysActive}
- Recent trend: ${data.recentTrend}
- Strong categories: ${data.strongCategories.join(', ') || 'none identified yet'}
- Weak categories: ${data.weakCategories.join(', ') || 'none identified yet'}

REPORT GUIDELINES:
- Reference metacognitive monitoring theory (Nelson & Narens) where relevant
- Be specific to their data — not generic advice
- Celebrate real achievements and progress
- For calibration issues, explain what it means in practical terms
- Suggest concrete next steps based on their specific patterns
- Keep language encouraging but honest

Return ONLY valid JSON:
{
  "overallAssessment": "2-3 sentence summary of overall progress and calibration quality",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "milestones": ["milestone reached 1", "milestone reached 2"],
  "nextGoals": ["concrete goal 1", "concrete goal 2", "concrete goal 3"],
  "detailedAnalysis": "A paragraph analyzing their calibration pattern and learning trajectory in detail",
  "motivationalNote": "A personalized encouraging message based on their specific data"
}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an educational psychologist specializing in metacognitive learning and calibration. Generate insightful, personalized progress reports. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const report: ProgressReportResponse = JSON.parse(cleaned);

    return res.status(200).json(report);
  } catch (error: any) {
    console.error('Progress report error:', error);
    return res.status(500).json({ error: 'Failed to generate progress report', detail: error.message });
  }
}
