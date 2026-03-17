# LLM Prompt: Knowledge Graph Generation

Source: `api/generate-knowledge-graph.ts`
Model: `llama-3.3-70b-versatile` (Groq) | Temperature: 0.4 | Max tokens: 2048

---

## System Prompt

```
You are a computational linguist. Analyze semantic relationships between words. Respond with valid JSON only.
```

---

## User Prompt

```
Analyze these English vocabulary words and identify semantic relationships between them. Group them into clusters and identify edges (connections) between related words.

VOCABULARY:
{wordList}

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

Return ONLY valid JSON: {"edges": [...], "clusters": [...]}
```

### Template Variables

| Variable | Source | Values |
|----------|--------|--------|
| `{wordList}` | `data.words` (max 50) | Each word formatted as: `word (translation) [tag1, tag2]`, one per line |

---

## Expected JSON Response

```json
{
  "edges": [
    {
      "source": "happy",
      "target": "joyful",
      "weight": 0.85,
      "relationship": "synonym"
    }
  ],
  "clusters": [
    {
      "label": "Emotions",
      "words": ["happy", "joyful", "sad", "angry"],
      "color": "#6366f1"
    }
  ]
}
```

### Relationship Types

| Type | Description |
|------|-------------|
| `synonym` | Words with similar meaning |
| `antonym` | Words with opposite meaning |
| `same-category` | Words in the same semantic category |
| `part-of` | Meronymic relationship |
| `causes` | Causal relationship |
| `used-together` | Words commonly co-occurring |
| `opposite-meaning` | Opposite semantics |
| `similar-meaning` | Similar semantics |
| `same-domain` | Same knowledge domain |

### Color Palette

| Hex | Color |
|-----|-------|
| `#6366f1` | Indigo |
| `#22c55e` | Green |
| `#f59e0b` | Amber |
| `#ef4444` | Red |
| `#8b5cf6` | Violet |
| `#ec4899` | Pink |
| `#14b8a6` | Teal |
| `#f97316` | Orange |
