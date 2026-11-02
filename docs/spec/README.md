# EyesUp specification

This folder holds the product plan and the Scope of Work as Markdown, so they can be read next to the code.

| File | Read it for |
| --- | --- |
| [01-overview-and-roadmap.md](01-overview-and-roadmap.md) | Vision, decisions taken, learner types, success metrics, phases and gates |
| [02-learning-method.md](02-learning-method.md) | The six stages, per-key guide fading (L0–L3), session design, motivation, the crossover plan |
| [03-onboarding-diagnostic.md](03-onboarding-diagnostic.md) | Six questions, probes A and B, layout detection, placement rules, tracks and overlays |
| [04-curriculum-and-engine.md](04-curriculum-and-engine.md) | Key order, line types, text generation, the mastery formula, the scheduler, metric definitions |
| [05-ux-and-design-spec.md](05-ux-and-design-spec.md) | Navigation, flows, the 15 screens, tokens, illustrations, accessibility, sound |
| [06-technical-architecture.md](06-technical-architecture.md) | Stack, repo layout, keyboard input rules, session states, data model, privacy, budgets, testing |
| [07-native-apps-and-release.md](07-native-apps-and-release.md) | Desktop platforms, the Electron fallback rule, signing, updates, CI |
| [08-references.md](08-references.md) | Sources behind the research and technical claims |
| [09-scope-of-work.md](09-scope-of-work.md) | What gets built per phase: deliverables D0.1–D3.5, FR-01–FR-36, NFR-01–NFR-13, milestones, risks |

Screens and illustrations are in [../design/](../design/).

## Which source wins

When two sources disagree, the higher one in this list wins:

1. **The clarifications below.** They settle every conflict and gap found so far.
2. **[09-scope-of-work.md](09-scope-of-work.md):** requirement IDs, priorities, phases and acceptance criteria.
3. **Files 02–07:** how each part behaves.
4. **`packages/tokens/tokens.json`, then the design snapshots:** how it looks. The token file wins over a pixel in a snapshot.
5. **[../planning/backlog.csv](../planning/backlog.csv):** the scope of one piece of work.
6. **Repo docs:** layout format, content style guide, keyboard test matrix, release runbook, ADRs.

A conflict that is not settled here goes to the product owner before anyone builds on either reading.

## Clarifications and gaps

Each entry says what the spec says, what to build, and why. Entries marked **Default** fill a gap with a starting value; keep those values in `packages/engine/src/params.ts` so they can be tuned on beta data.

| # | Topic | The spec says | Build this |
| --- | --- | --- | --- |
| C1 | Blind-check position | The fading section says every third session "opens with" a blind run; the session table, the scheduler sketch and FR-06 put it last. | Make it the last block (three sources agree). Keep its position as a parameter so it can move after beta. |
| C2 | "Every third session" | The scheduler sketch tests `sessionCount % 3 === 0`, which would put a blind check in the first session if the count starts at 0. | Use the 1-based session number: sessions 3, 6, 9 and so on get the blind check. |
| C3 | Where the input adapter lives | The architecture puts "Input" inside the engine, and the engine must never touch the DOM. | `packages/engine/src/input` does all the logic on a plain `RawKeyEvent` object (`type`, `code`, `key`, `timeStamp`, `repeat`, `isComposing`, modifier states). A thin bridge in `packages/ui` turns DOM `KeyboardEvent`s into `RawKeyEvent`s. Web and desktop share that bridge because the desktop app runs the web build. |
| C4 | Peek and AltGr | Peek is "hold Ctrl"; Windows reports AltGr as Ctrl+Alt. | Ctrl held on its own starts a peek. Never peek while `getModifierState('AltGraph')` is true or Alt is also down. Ctrl or Cmd plus another key passes through as a shortcut (matrix rows K05 and K09). |
| C5 | Number keys in onboarding | FR-01 says every question is answerable with number keys; screen 02 says "keys 1–4 pick"; questions have 3 to 6 options. | Keys 1 to N pick, where N is that question's option count. Question 6 is multi-select: number keys toggle, Enter continues. |
| C6 | The 5% tie band | "When a result lands within 5% of a threshold, the answer to question 2 decides." | A value within ±5% (relative) of a threshold is a tie at that decision. The tie goes to the branch that matches question 2. Q2 options map to tracks: 1 Foundations, 2 Retrain, 3 Adaptive, 4 Fluency. |
| C7 | Tracks that arrive in Phase 2 | SOW: in Phase 1, Retrain learners start on Foundations and Fluency learners on Adaptive. | Store both `placedTrack` and `activeTrack`. The result card names the active track. Once the track ships in Phase 2, offer the switch. |
| C8 | Starting target speed (**Default**) | "80% of the probe speed" for tracks other than Foundations, without saying which probe. | Use 80% of probe B's blind speed (B3 net WPM), never below 15 WPM. Practice is scored with eyes on the screen, so a target from sighted speed would put Retrain learners out of reach. |
| C9 | Goal (**Default**) | Target speed rises "up to the learner's goal", but onboarding never asks for a goal. | Default goal is 30 WPM, the north-star level, editable in Settings under "Track and goal". The Fluency goal and how Fluency targets rise stay open until EU-033. |
| C10 | Eyes-up points (**Default**, Phase 2) | "L3 keystrokes are worth four times L0." | L0 = 1 point, L1 = 2, L2 = 3, L3 = 4. Peeked keystrokes count as L0. |
| C11 | Screens with no backlog story | The first-run flow, screens 01, 06 and 15, and D0.1 depend on Welcome, Orient and Settings. D1.4 needs numbers from beta learners. No story covers any of these. | Add the three stories below to the backlog at the start of Phase 1. |
| C12 | Fonts | Design sources load fonts from Google Fonts for preview. | The app bundles Atkinson Hyperlegible and JetBrains Mono (NFR-08) and never loads anything from a CDN. |
| C13 | Line length and line time | Lines are 40–60 characters (curriculum); lines last 20–40 seconds (method). | Both hold. The generator works in characters; the scheduler plans about 2 lines per minute. |
| C14 | "Blind speed" | Used in placement and the signal table without a formula. | Net WPM over probe B's B3 part (20 seconds of common words). Blind accuracy uses B2 and B3 together. |
| C15 | Analytics | "Opt-in and aggregate, if any." | Build no analytics in Phases 0–3. Beta numbers come from JSON exports that learners choose to send (EU-052). |
| C16 | Learn order | The curriculum says other layouts compute their order from a rule; the layout files carry a written `learnOrder`. | The engine reads `learnOrder` from the layout file. A script may generate it, but the file is the source of truth and the validator checks it. |
| C17 | Reading the fade table | The "Steps up when" column lists, for each level, the condition to reach it; L0's entry reads "key is new (first 2 sessions with it)". | A key stays at L0 for its first 2 sessions. After that it reaches L1 at 95% over its last 40 presses, L2 at 95% and 60% of target speed, and L3 at target speed for 2 sessions in a row. Below 90% over the last 40 presses, a key steps back one level. |
| C18 | Focus-key share and early groups | Every generated line has the focus key at 25–35% of characters, and pseudo-words must be pronounceable. Key drills like `ddd eee ded` are mostly the new keys, and groups 1–3 contain no vowel. | The 25–35% share applies to word lines (pseudo-words, real words, mixed review), counted over non-space characters. Key drills and pair drills are exempt, because they exist to repeat the new keys. Until group 4 brings the first vowel (A), every line is a drill built from the unlocked keys; pseudo-words start at group 4. |

### Stories to add (C11)

Append these rows to `docs/planning/backlog.csv` with the same columns as the existing rows:

| Issue ID | Summary | Phase | Priority | Requirement | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| EU-050 | Welcome screen and Orient lesson | Phase 1 | Must | D0.1, screens 01 and 06 | Welcome starts with Enter and needs no account. Orient teaches posture, home position, the F and J bumps and finger zones in about 4 minutes. A learner can name the finger for E, R and O afterwards. Orient can be replayed from Library. Keyboard-only throughout. |
| EU-051 | Settings screen | Phase 1 | Must | FR-05, FR-28, FR-30 | Change layout, track and goal; access profile; sound; JSON export; delete everything with confirmation. Key progress is kept when the track changes. |
| EU-052 | Beta report script | Phase 1 | Must | D1.4 | A zero-dependency Node script reads a folder of learner JSON exports and prints the Gate B numbers and the supporting metrics, with no text content and no keystroke logs in its output. |

### Open questions for the product owner

- Final product name and trademark (the repo name can change cheaply until launch).
- Which frequency word list and corpus to license (D0.3, risk R5).
- Whether learners under 13 are in scope.
- How Retrain merges key groups 5–15 into bigger steps (decide before EU-031).
- How Fluency targets and goals progress once every key is unlocked (decide before EU-033).
- Monetisation and the illustration route.
