import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODEL, MAX_TOKENS } from './_groqClient';
import type { StudyPlanRequest, StudyPlanResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as StudyPlanRequest;

    const calibrationType = data.betaHat > 0.1 ? 'overconfident' : data.betaHat < -0.1 ? 'underconfident' : 'well-calibrated';

    const prompt = `Create a personalized 7-day study plan for a French speaker learning English. The plan should integrate metacognitive calibration training into language learning activities.

LEARNER PROFILE:
- Current level: ${data.currentLevel}
- Calibration bias (β̂): ${data.betaHat.toFixed(3)} (${calibrationType})
- Expected Calibration Error (ECE): ${(data.ece * 100).toFixed(1)}%
- Overall accuracy: ${(data.accuracy * 100).toFixed(1)}%
- Sessions completed: ${data.totalSessions}
- Available time per day: ${data.availableMinutesPerDay} minutes
- Weak areas: ${data.weakAreas.join(', ') || 'none identified'}
- Strong areas: ${data.strongAreas.join(', ') || 'none identified'}
${data.goalDescription ? `- Personal goal: ${data.goalDescription}` : ''}

PLAN DESIGN PRINCIPLES:
- Spaced repetition: distribute review of weak areas across multiple days
- Interleaving: mix vocabulary and grammar practice within sessions
- Calibration training: include confidence-rating exercises in every session
- Progressive difficulty: start each day with review, then introduce new material
- For ${calibrationType} learners: ${
  calibrationType === 'overconfident'
    ? 'include self-testing checkpoints ("Can I use this word in a sentence from memory?") before rating confidence'
    : calibrationType === 'underconfident'
    ? 'include mastery acknowledgment exercises and encourage trusting initial instincts'
    : 'maintain current approach while gradually increasing difficulty'
}
- Address weak areas 3x more frequently than strong areas
- Each session should fit within ${data.availableMinutesPerDay} minutes

Return ONLY valid JSON:
{
  "planName": "short descriptive name for this plan",
  "overview": "2-3 sentence overview of the plan's strategy",
  "weeklySchedule": [
    {
      "day": 1,
      "focus": "Main theme for the day",
      "activities": ["Activity 1 (X min)", "Activity 2 (X min)", ...],
      "durationMinutes": total,
      "tips": "Day-specific advice"
    }
  ],
  "priorityAreas": ["area 1", "area 2"],
  "calibrationStrategy": "Specific calibration improvement strategy for this learner",
  "expectedOutcomes": "What the learner should achieve by the end of the week"
}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert language learning curriculum designer specializing in metacognitive calibration-aware instruction. Create actionable, personalized study plans. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const plan: StudyPlanResponse = JSON.parse(cleaned);

    return res.status(200).json(plan);
  } catch (error: any) {
    console.error('Study plan error:', error);
    return res.status(500).json({ error: 'Failed to generate study plan', detail: error.message });
  }
}
