# EyesUp design reference

These are snapshots of the EyesUp design canvas: the 15 MVP screens, the illustrations, the Keyboard component, the wireframes and the platform boards. Build the interface to match them.

- **Colours, type and spacing come from `packages/tokens/tokens.json`**, not from the pixels here. If a snapshot and the token file disagree, the token file wins.
- **Fonts in the snapshots are fallbacks.** The app uses Atkinson Hyperlegible (interface) and JetBrains Mono (practice text), both bundled with the app.
- **Copy in the snapshots is a draft.** Interface text follows `docs/content-style-guide.md` and lives in string files.

## Screens

| # | Screen | Snapshot | Source |
| --- | --- | --- | --- |
| 01 | Welcome | [screens/01-welcome.png](screens/01-welcome.png) | `Welcome.dc.html` |
| 02 | Six questions (question 2 shown) | [screens/02-questions.png](screens/02-questions.png) | `Onboarding.dc.html` |
| 03 | Probe A, sighted | [screens/03-probe-a-sighted.png](screens/03-probe-a-sighted.png) | `ProbeA.dc.html` |
| 04 | Probe B, blind | [screens/04-probe-b-blind.png](screens/04-probe-b-blind.png) | `Probe.dc.html` |
| 05 | Result card | [screens/05-result-card.png](screens/05-result-card.png) | `Result.dc.html` |
| 06 | Orient lesson (finger zones step) | [screens/06-orient.png](screens/06-orient.png) | `Orient.dc.html` |
| 07 | Today | [screens/07-today.png](screens/07-today.png) | `Today.dc.html` |
| 08 | Hands-ready gate | [screens/08-hands-ready-gate.png](screens/08-hands-ready-gate.png) | `Ready.dc.html` |
| 09 | Practice, light and dark | [screens/09-practice.png](screens/09-practice.png) · [screens/09-practice-dark.png](screens/09-practice-dark.png) | `Practice.dc.html`, `PracticeDark.dc.html` |
| 10 | Line result and other practice states (peek, Caps Lock, paused, break, step-back) | [screens/10-practice-states.png](screens/10-practice-states.png) | `States.dc.html` |
| 11 | Unlock intro card | [screens/11-unlock-card.png](screens/11-unlock-card.png) | `Unlock.dc.html` |
| 12 | Session summary | [screens/12-session-summary.png](screens/12-session-summary.png) | `Summary.dc.html` |
| 13 | Progress | [screens/13-progress.png](screens/13-progress.png) | `Progress.dc.html` |
| 14 | Library | [screens/14-library.png](screens/14-library.png) | `Library.dc.html` |
| 15 | Settings | [screens/15-settings.png](screens/15-settings.png) | `Settings.dc.html` |

## Everything else

| Board | Snapshot | Source |
| --- | --- | --- |
| Keyboard component: zones, fade levels, heatmap, hands | [components/keyboard.png](components/keyboard.png) | `Keyboard.dc.html` |
| Design tokens sheet | [components/tokens.png](components/tokens.png) | `Tokens.dc.html` |
| Illustration: finger zones and hands at rest | [illustrations/finger-zones-and-hands.png](illustrations/finger-zones-and-hands.png) | `Main.dc.html` |
| Illustration: reach storyboard | [illustrations/reach-storyboard.png](illustrations/reach-storyboard.png) | `Reach.dc.html` |
| Illustration: the guide fades key by key | [illustrations/fade-sequence.png](illustrations/fade-sequence.png) | `Fade.dc.html` |
| Illustration: posture | [illustrations/posture.png](illustrations/posture.png) | `Posture.dc.html` |
| Wireframes: first run | [wireframes/first-run.png](wireframes/first-run.png) | `WF-FirstRun.dc.html` |
| Wireframes: daily use | [wireframes/daily-use.png](wireframes/daily-use.png) | `WF-Daily.dc.html` |
| Wireframes 16–24: edge and system states (no keyboard, input method on, layout mismatch, Caps Lock, paused, break, crossover reached, empty progress, delete everything) | [wireframes/edge-and-system-states.png](wireframes/edge-and-system-states.png) | `WF-States.dc.html` |
| Desktop apps on Windows, macOS and Linux; update prompt; reminder; import on first launch | [platforms/desktop-apps.png](platforms/desktop-apps.png) | `Desktop.dc.html` |
| Phone hand-off and public site at phone width | [platforms/phone-handoff.png](platforms/phone-handoff.png) | `Phone.dc.html` |

## The source files

`source/` holds the canvas files the snapshots were rendered from. They are reference markup for exact sizes, spacing, SVG paths (hands, reach curves) and the Keyboard component's props. They need the design tool's runtime to display, so they do not run in this repo.

Never copy them into the app as they are: they load fonts from Google Fonts and use the design tool's template syntax. Rebuild each screen in Svelte with the tokens, string files and bundled fonts.

The Keyboard component's props map one to one onto the production component: `mode` (zones, levels, heat, plain), `hands` (none, rest, reach), `target`, `levels`, `heat`, `unit` (key pitch in px: the default 54 is a 48 px key plus a 6 px gap, as in the spec), `numbers` (finger numbers on keys), `label` (accessible name) and `theme` (light or dark).
