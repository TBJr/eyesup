# Content style guide

Two kinds of text appear in EyesUp: **practice text** that learners type, and **interface text** that talks to them. Both follow this guide.

## Practice text

### Sources and licences

- Every word list, corpus and phrase set has its source, licence and date recorded in `packages/content/<language>/SOURCES.md` before it is used.
- Prefer public-domain or openly licensed sources; write phrases and code snippets in-house when in doubt.
- Never ship text copied from books, articles or song lyrics.

### Word lists

- About 10,000 words per language, ranked by frequency.
- Lowercase base forms plus common inflections; no proper names except days and months.
- Run every list through the blocklist (below) before it is committed.

### Generated lines

- Use only unlocked keys. The focus key makes up 25–35% of characters in a line.
- 40–60 characters per line; one visual line at the default text size, never wrapped.
- Foundations track: no more than three keystrokes in a row by the same finger.
- Pseudo-words must be pronounceable and must not match a blocklist entry or come within one letter of one.

### Phrases and passages

- Neutral, everyday subjects. No politics, religion, violence, health conditions or real people.
- Mix sentence lengths. Every sentence must make sense on its own.
- Use straight quotes (' and "), not curly quotes, unless the lesson teaches them.

### Code snippets (Coder overlay)

- Short, realistic, and runnable in their language. No secrets, real URLs or real company names.
- 2- or 4-space indentation, as is idiomatic for the language; never tabs mixed with spaces.

### French

- Practice text uses a normal space before : ; ! ? (French typography uses a narrow no-break space there, but learners can't type one with the Space bar).
- Include accented letters in proportion to real use: é and è early, à and ç next, ê â î ô û and ë ï ü once dead keys are unlocked.
- Use « » only in Fluency passages, after their keys are taught.

### Blocklist

`packages/content/<language>/blocklist.txt`, one entry per line, covering slurs, sexual terms and insults. It is checked in automated tests against every generated line. Additions need no discussion; removals need a second reviewer.

## Interface text

### Voice

Plain, warm and specific, like a good coach standing beside the learner.

| Do | Don't |
| --- | --- |
| "Your right ring finger (O, L, full stop) is 18% faster this week." | "Great job!" |
| "I needs a little more help, so its full guide is back for now." | "You failed the I key." |
| "You'll be slower for a few weeks. That's normal." | "This will be easy." |
| "Press F and J together to begin." | "Click the button below to get started on your learning journey." |

### Rules

- Sentences under 20 words. One idea per sentence.
- Address the learner as "you". Use "we" sparingly, only for EyesUp as a whole.
- Never shame: no "wrong", "failed" or "bad" about the learner. Describe the key or the result instead.
- Avoid "just", "simply", "easy" and "obviously".
- No exclamation marks except for real milestones (first blind line, crossover).
- Name keys by what's printed on them (F, J, Space, Shift, Enter). Write shortcuts with a `kbd` element: Esc, Ctrl, Enter.
- Numbers: digits for all numbers in the interface ("3 minutes", "12 of 26 letters"). Speeds as "24 WPM"; accuracy as "96%".
- Buttons start with a verb and say what happens: "Start the drill", "Export everything (JSON)", "Delete everything…".
- Errors say what happened and what to do next, in that order.

### Accessibility

- Every illustration has a text alternative describing the action ("Left middle finger moves up from D to E").
- Announce results and unlocks through a polite live region; never announce every keystroke.
- All strings live in string files (`packages/ui/strings/<language>.json`), never in images.
