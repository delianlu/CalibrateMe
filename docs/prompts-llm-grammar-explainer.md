# LLM Prompt: AI Grammar Explainer

Source: `api/explain-grammar.ts`
Model: `llama-3.3-70b-versatile` (Groq) | Temperature: 0.5 | Max tokens: 512

---

## System Prompt

```
You are an English grammar teacher for French speakers. Be clear, supportive, and specific. Respond with valid JSON only.
```

---

## User Prompt

```
A French speaker learning English got this grammar question wrong. Explain the grammar rule in a clear, helpful way.

QUESTION: {question}
OPTIONS: {options}
USER'S ANSWER: {userAnswer}
CORRECT ANSWER: {correctAnswer}
USER'S CONFIDENCE: {userConfidence}%

Provide:
1. explanation: 2-3 sentences explaining WHY the correct answer is right and why the user's answer is wrong. Use simple English appropriate for an intermediate learner.
2. rule: the name of the grammar rule (e.g., "Present Perfect vs Past Simple")
3. tip: a short mnemonic or memory trick to remember this rule
4. commonMistake: why French speakers specifically make this mistake (L1 interference)

{overconfidenceNote}

Return ONLY valid JSON: {"explanation": "...", "rule": "...", "tip": "...", "commonMistake": "..."}
```

### Template Variables

| Variable | Source | Values |
|----------|--------|--------|
| `{question}` | `data.question` | The grammar question text |
| `{options}` | `data.options` | Answer options joined with ` / ` |
| `{userAnswer}` | `data.userAnswer` | The user's selected answer |
| `{correctAnswer}` | `data.correctAnswer` | The correct answer |
| `{userConfidence}` | `data.userConfidence` | Integer 0-100 |
| `{overconfidenceNote}` | Conditional | If confidence > 70%: `"NOTE: The user was highly confident but wrong. Gently address this overconfidence — the item felt familiar but the rule is trickier than it seems."` |

---

## Expected JSON Response

```json
{
  "explanation": "2-3 sentence explanation of the grammar rule",
  "rule": "Name of the Grammar Rule",
  "tip": "A short mnemonic or memory trick",
  "commonMistake": "Why French speakers specifically make this mistake"
}
```
