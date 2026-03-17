# LLM Prompt: AI Flashcard Generation

Source: `api/generate-flashcards.ts`
Model: `llama-3.3-70b-versatile` (Groq) | Temperature: 0.7 | Max tokens: 2048

---

## System Prompt

```
You are a language learning expert specializing in French-to-English vocabulary. Always respond with valid JSON only.
```

---

## User Prompt

```
Generate exactly {count} English vocabulary flashcards for French speakers on the topic: "{topic}". Difficulty level: {difficulty}.

For each word, provide:
- word: the English word
- translation: the French translation
- difficulty: {difficultyValue}
- tags: 2-3 relevant tags (e.g., "noun", "food", "academic")
- exampleSentence: a simple sentence using the word in context
- mnemonic: a memory trick connecting the French and English words (use cognates, sound-alikes, or vivid imagery)

IMPORTANT: Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the JSON array.

Example format:
[{"word": "knowledge", "translation": "connaissance", "difficulty": 0.50, "tags": ["noun", "academic"], "exampleSentence": "Knowledge is power.", "mnemonic": "CONNAISsance → to KNOW is to have COGNIZANCE"}]
```

### Template Variables

| Variable | Source | Values |
|----------|--------|--------|
| `{count}` | `req.body.count` | Number of flashcards to generate |
| `{topic}` | `req.body.topic` | Topic string (e.g., "food", "technology") |
| `{difficulty}` | `req.body.difficulty` | `"easy"`, `"medium"`, or `"hard"` |
| `{difficultyValue}` | Derived | easy = 0.17, medium = 0.50, hard = 0.83 |

---

## Expected JSON Response

```json
[
  {
    "word": "knowledge",
    "translation": "connaissance",
    "difficulty": 0.50,
    "tags": ["noun", "academic"],
    "exampleSentence": "Knowledge is power.",
    "mnemonic": "CONNAISsance → to KNOW is to have COGNIZANCE"
  }
]
```
