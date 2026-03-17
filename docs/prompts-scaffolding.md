# Scaffolding Prompts

Static adaptive prompts displayed to learners during practice sessions based on their calibration patterns.

Source: `src/features/scaffolding/promptLibrary.ts`

---

## Overconfidence Prompts

### Mild (threshold: 2 miscalibrations, min 5 responses)

**Title:** Reflection Moment

```
You've been confident on a few items you got wrong. Before rating confidence, try to mentally recall the answer first.
```

**Timing:** before-answer | **Action button:** Got it

---

### Moderate (threshold: 3 miscalibrations, min 8 responses)

**Title:** Check Your Thinking

```
Ask yourself: 'Can I explain why this is correct?' If not, consider lowering your confidence rating.
```

**Timing:** before-answer | **Action button:** I'll try

---

### Severe (threshold: 5 miscalibrations, min 10 responses)

**Title:** Calibration Strategy

```
There's a pattern of high confidence on incorrect answers. Try the 'teach-back' method: before rating confidence, imagine explaining the answer to someone. If you can't, lower your confidence.
```

**Timing:** before-answer | **Action button:** Will do

---

## Underconfidence Prompts

### Mild (threshold: 2 miscalibrations, min 5 responses)

**Title:** You Know This!

```
You've been getting items right even when you felt unsure. Trust your knowledge a bit more!
```

**Timing:** after-answer | **Action button:** Thanks!

---

### Moderate (threshold: 4 miscalibrations, min 8 responses)

**Title:** Your Instincts Are Good

```
Your accuracy is consistently higher than your confidence suggests. When you have a gut feeling, give yourself more credit.
```

**Timing:** after-answer | **Action button:** I'll try

---

## Streak Prompts

### Wrong Streak (threshold: 3 wrong in a row)

**Title:** Take a Breath

```
A few misses in a row — that's normal! Try slowing down and reading each word carefully before responding.
```

**Timing:** before-answer | **Action button:** OK

---

### Correct Streak (threshold: 5 correct in a row)

**Title:** Great Streak!

```
You're on a roll — 5 correct in a row! Keep it up and make sure your confidence ratings match this performance.
```

**Timing:** after-answer | **Action button:** Nice!

---

## Reflective Prompt (High-Confidence Errors)

Source: `src/features/quiz/components/ReflectivePrompt.tsx`

Displayed when a learner rates high confidence but answers incorrectly.

**Title:** You rated {confidence}% confident, but got it wrong

**Subtitle:** Quick reflection: What happened?

**Reason options:**

```
1. It was a slip — I actually knew this
2. I misunderstood the concept
3. It felt familiar, but I didn't truly know it
4. I was guessing confidently
```
