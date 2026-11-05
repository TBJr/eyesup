# Design fidelity checklist (screens 01–15)

Sign off each screen against its PNG in `docs/design/screens/`. Tokens and string files win over snapshot pixels/fonts.

Composition column: engineering shell vs design source (EU-050 / EU-051). **Signed** remains a product-owner visual pass in light/dark/HC/RM.

| # | Screen | PNG | Composition match | Keyboard-only | Light/dark/HC/RM | Signed |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Welcome | `01-welcome.png` | Header, hero, zone keyboard+hands, 3 cards, footer — done | Enter | Owner spot-check | |
| 02 | Questions | `02-questions.png` | One question, numbered options — done | 1–4, Enter | Owner spot-check | |
| 03 | Probe A | `03-probe-a-sighted.png` | Passage chrome — done | Typing | Owner spot-check | |
| 04 | Probe B | `04-probe-b-blind.png` | Home keys then hands only (keyboard hidden) — done | Typing | Owner spot-check | |
| 05 | Result | `05-result-card.png` | Track card, layout, override — done | Enter | Owner spot-check | |
| 06 | Orient | `06-orient.png` | Step of 4, turn panel, So far chips, footer Next/Back — done | Space → F J D K S L → Next → E R O | Owner spot-check | |
| 07 | Today | `07-today.png` | Streak, goal, crossover, start — done | Enter | Owner spot-check | |
| 08 | Hands-ready | `08-hands-ready-gate.png` | Keyboard + hands rest (practice state-card) — done | F+J | Owner spot-check | |
| 09 | Practice | `09-practice.png` | Typing surface + guided keyboard — done | Esc / Peek | Owner spot-check | |
| 10 | Practice states | `10-practice-states.png` | Peek, Caps, pause, break (status-pill / state-card) — done | | Owner spot-check | |
| 11 | Unlock | `11-unlock-card.png` | New keys + reach — done | Enter | Owner spot-check | |
| 12 | Summary | `12-session-summary.png` | WPM / accuracy strip — done | Enter | Owner spot-check | |
| 13 | Progress | `13-progress.png` | Hub shell, heatmap keyboard + crossover — done | | Owner spot-check | |
| 14 | Library | `14-library.png` | Hub shell; Orient, timed test, own text — done | | Owner spot-check | |
| 15 | Settings | `15-settings.png` | Hub shell; Keyboard / Learning / Access / Data groups — done | | Owner spot-check | |

After sign-off, refresh Playwright baselines under `tests/e2e/snapshots/` via `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots`.
