# Design fidelity checklist (screens 01–15)

Sign off each screen against its PNG in `docs/design/screens/`. Tokens and string files win over snapshot pixels/fonts.

| # | Screen | PNG | Composition match | Keyboard-only | Light/dark/HC/RM | Signed |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Welcome | `01-welcome.png` | Header, hero, zone keyboard+hands, 3 cards, footer | Enter | | |
| 02 | Questions | `02-questions.png` | One question, numbered options | 1–4, Enter | | |
| 03 | Probe A | `03-probe-a-sighted.png` | Passage chrome | Typing | | |
| 04 | Probe B | `04-probe-b-blind.png` | Home keys then hands only (keyboard hidden) | Typing | | |
| 05 | Result | `05-result-card.png` | Track card, layout, override | Enter | | |
| 06 | Orient | `06-orient.png` | Stepper, posture / zones / reach | Enter | | |
| 07 | Today | `07-today.png` | Streak, goal, crossover, start | Enter | | |
| 08 | Hands-ready | `08-hands-ready-gate.png` | Keyboard + hands rest | F+J | | |
| 09 | Practice | `09-practice.png` | Typing surface + guided keyboard | Esc / Peek | | |
| 10 | Practice states | `10-practice-states.png` | Peek, Caps, pause, break | | | |
| 11 | Unlock | `11-unlock-card.png` | New keys + reach | Enter | | |
| 12 | Summary | `12-session-summary.png` | WPM / accuracy strip | Enter | | |
| 13 | Progress | `13-progress.png` | Keyboard heatmap + crossover chart | | | |
| 14 | Library | `14-library.png` | Orient, timed test, own text hub | | | |
| 15 | Settings | `15-settings.png` | Grouped controls | | | |

After sign-off, refresh Playwright baselines under `tests/e2e/snapshots/` via `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots`.
