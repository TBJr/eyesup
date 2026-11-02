# Curriculum and adaptive engine

## Key introduction order (QWERTY)

Foundations and Retrain introduce keys in mirrored pairs: the same finger on each hand, home row first, then the most frequent reaches. Real words become possible after group 4, which matters for motivation. Retrain merges groups 5–15 into bigger steps; Adaptive skips to the keys the probes found missing and orders them by letter frequency.

| # | Keys | Finger and reach | Real words now possible (examples) |
| --- | --- | --- | --- |
| 1 | F J | Index, home (the bumps) | — |
| 2 | D K | Middle, home | — |
| 3 | S L | Ring, home | — |
| 4 | A ; | Little, home | dad, sad, flask, fall |
| 5 | E I | Middle, up | said, like, file, feel |
| 6 | R U | Index, up | sure, rude, fire, user |
| 7 | G H | Index, inward | high, she, dish, glass |
| 8 | T Y | Index, up and inward | the, they, yet, style |
| 9 | W O | Ring, up | would, work, two |
| 10 | Q P | Little, up | quite, people |
| 11 | C , | Middle, down | check, could |
| 12 | V M | Index, down | move, very, time |
| 13 | B N | Index, down and inward | and, been, number |
| 14 | X . | Ring, down | next, exit. |
| 15 | Z / | Little, down | size, zero, and/or |
| 16 | Shift | Opposite little finger | Capitals |
| 17 | ' ? ! : " Enter | Right little and ring | Full sentences |
| 18 | 4 5 6 7 | Index, two rows up | Dates, prices |
| 19 | 1 2 3 8 9 0 | Own column fingers | All numbers |
| 20 | Symbols | Per layout file | Code (Coder overlay) |

Space is pressed by the thumb from the first lesson. Other layouts get their order from the same rule (mirrored finger pairs, home row first, then frequency), computed from the layout definition file rather than hand-written.

## Lesson anatomy

A session is a sequence of short lines (40–60 characters, one visual line, never wrapped). Each line type has one job.

| Line type | Example (after group 5) | Job |
| --- | --- | --- |
| Intro card | Animated reach from D up to E | Show the movement once, before typing it |
| Key drill | `ddd eee ded ede dee eed` | Acquire the new reach in isolation (blocked) |
| Pair drill | `de ed ei ie se es le el` | Link the new key to known keys |
| Pseudo-words | `sefe likad dees fiel` | Practise the key in pronounceable, unfamiliar sequences |
| Real words | `said like file feel skies` | Word-level planning |
| Mixed review | All unlocked keys, focus key in every word | Interleaving and weak-key targeting |
| Blind check | Keyboard hidden, 30 seconds | Measure retention |

After each line, a result strip shows speed, accuracy, the slowest key and any guide-level change ("K faded to outline").

## Practice text generation

Practice text is generated, not hand-written, so it always fits the learner's unlocked keys and current weak spot.

- **Pseudo-words:** a letter-level Markov model (order 2–3) trained on a language corpus produces pronounceable non-words using only unlocked letters, with the focus key in every word. This is the approach keybr uses.
- **Real words:** a frequency-ranked word list per language (about 10,000 words, profanity-filtered), filtered to unlocked letters, most frequent first.
- **Phrases and passages:** public-domain and in-house sentences for the Chunk stage.
- **Code:** in-house snippets per language for the Coder overlay.
- **Own text:** pasted by the learner, normalised (curly quotes to straight, optional), stored only on the device.

Constraints on every generated line: the focus key makes up 25–35% of characters; no more than three same-finger keystrokes in a row for Foundations; a blocklist stops accidental offensive pseudo-words. Corpus and word-list licences are checked before shipping.

## Mastery model

Every key, and every letter pair, carries a confidence score from 0 to 1 that drives unlocking, fading and targeting.

Per key k the engine keeps:

- **aₖ — accuracy:** share of correct first attempts, exponentially weighted with a half-life of 40 presses.
- **tₖ — time-to-type:** smoothed median milliseconds from the previous keydown, ignoring pauses over 2 s and the first key of each line.
- **levelₖ:** guide level L0–L3, plus last-practised date and the count of stable sessions.

```latex
c_k = \min\left(1, \frac{T}{t_k}\right) \cdot \min\left(1, \frac{a_k}{0.95}\right), \qquad T = \frac{12000}{W}\ \text{ms}
```

W is the learner's current target speed in WPM (at 30 WPM, T = 400 ms per character). Rules built on it:

- **Focus key** = the unlocked key with the lowest confidence; it appears in every generated word.
- **Unlock** the next group when every unlocked key has accuracy of 95% or more and confidence of 0.9 or more.
- **Target speed** starts at 15 WPM (Foundations) or 80% of the probe speed (other tracks) and rises 2 WPM each time a group unlocks, up to the learner's goal.
- **Letter pairs** use the same score on the time between the two keydowns; the slowest 10 pairs drive Chunk-stage drills.

All numbers here are starting parameters, tuned on beta data.

## Session scheduler

The scheduler turns the mastery model into one session plan. It runs entirely on the device in the engine package.

```ts
function planSession(learner: Learner, minutes: number): Line[] {
  const keys = learner.unlockedKeys
  const T = 12000 / learner.targetWpm

  if (keys.every(k => k.accuracy >= 0.95 && confidence(k, T) >= 0.9)) {
    unlockNextGroup(learner)                    // next mirrored pair for this layout
  }
  const focus = minBy(keys, k => confidence(k, T))  // weakest key
  const due = keys.filter(k => daysSince(k.lastPractised) >= reviewInterval(k))
  const n = Math.round(minutes * 2)            // about 2 lines per minute

  return [
    ...warmUp(keys.filter(k => k.level >= 2), 0.1 * n),
    ...newKeyDrills(learner.newestGroup, 0.3 * n),
    ...mixedReview(keys, focus, due, 0.3 * n),
    ...wordsAndText(keys, learner.overlays, 0.2 * n),
    ...(learner.sessionCount % 3 === 0 ? blindCheck(keys) : coolDown(keys)),
  ]
}

// Spaced review: a key that stays mastered is reviewed less often (days).
function reviewInterval(k: KeyStat): number {
  return k.confidence >= 0.9 ? Math.min(30, 2 ** k.stableSessions) : 1
}
```

## Metric definitions

One definition per metric, used identically in the app, the analytics and the beta report.

| Metric | Definition |
| --- | --- |
| Gross WPM | (characters typed ÷ 5) ÷ minutes |
| Net WPM | Gross WPM − uncorrected errors per minute |
| Accuracy | Correct first-attempt keystrokes ÷ all keystrokes |
| Time-to-type | Milliseconds from the previous keydown to this keydown; pauses over 2 s dropped |
| Pair time | Milliseconds between the keydowns of a letter pair |
| Consistency | 1 − coefficient of variation of inter-key intervals within a line |
| Rollover share | Keydowns that land before the previous key's keyup ÷ all keydowns |
| Blind share | Keystrokes typed with the key at guide level L3 ÷ all keystrokes |
| Peek rate | Peeks per 100 keystrokes |
| Crossover gap | Blind net WPM − day-1 sighted net WPM (positive = crossed over) |
