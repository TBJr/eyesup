# EyesUp — Touch Typing App Plan

Oct 22, 2026 · @TBJr

## Summary

EyesUp (working name) teaches touch typing by first diagnosing how a person types today, then running a method built on motor-learning research. It ships as a web app first, then as native desktop apps for Windows, macOS and Linux from the same codebase.

Three choices make it teach faster than a one-size course:

1. **Diagnose before teaching.** A 3-minute onboarding (6 questions plus 2 short typing probes) places each learner on one of four tracks. A two-finger beginner and a fast self-taught typist who looks down need opposite things.
2. **Fade the help on purpose.** The on-screen keyboard and hand guide fade in four steps as each key is mastered. Learners who keep constant visual guidance tend to depend on it and perform worse once it is gone.
3. **Plan the hand-off to real life.** The main reason touch-typing courses fail is not the course: graduates go back to looking because looking is faster in the short term. EyesUp tracks the moment blind typing overtakes the learner's old speed and moves practice onto their own text.

Around that core: an illustrated finger-zone keyboard and animated hand guide, short daily sessions, adaptive drills on each learner's weak keys, and local-first storage so keystroke data stays on the device.

## Decisions and assumptions

These are the defaults the rest of the plan builds on. Each can be reversed cheaply now and expensively after Phase 1.

| Decision | Choice | Why | Revisit if |
| --- | --- | --- | --- |
| Working name | EyesUp | Names the goal in two words: eyes on the screen, not the keys | Trademark or domain check fails |
| Primary audience | Teens and adults (13+), learning on their own | Largest group; under-13s need parental consent flows and different content | A school partnership appears |
| Launch language and layout | English on QWERTY (US and UK) | Covers most early users; AZERTY and French follow in v1 for francophone West Africa | Early users are mostly francophone |
| Platform order | Web app (installable, offline) first, desktop shells second | One codebase; the web build becomes the desktop app's interface | — |
| Desktop shell | Tauri 2, with Electron as the fallback | Small installers and a Rust core; Electron only if Linux web-view keyboard handling misbehaves | Keyboard test matrix fails on Linux |
| Interface framework | Svelte 5 with TypeScript | Compiles to plain JavaScript with a tiny runtime; fast keystroke-to-screen response | A larger team standardises on React |
| Typing engine | Pure TypeScript package with zero dependencies | Same engine in web, desktop and tests; can be ported to Rust later | — |
| Data | Local-first (IndexedDB on web, SQLite on desktop); accounts optional later | Keystroke timing is personal data; the app must work offline | Users ask for sync across devices |
| Business model | Free core first; paid desktop licence or school plans later | Prove learning outcomes before charging | — |

## Learners, goals and success metrics

Four learner types cover nearly everyone who opens a typing tutor. The onboarding diagnostic sorts people into them; each gets its own starting track.

| Learner | Typical starting point | What they want | What gets in their way | Track |
| --- | --- | --- | --- | --- |
| Beginner (e.g. a 19-year-old student) | Two fingers, looks at every key, 10–20 WPM | Type assignments without hunting for keys | Does not know home position or finger zones | Foundations |
| Self-taught looker (e.g. a 31-year-old accountant) | Six fingers, 40–55 WPM, glances down constantly | Stop looking, get past a plateau | Touch typing feels slower at first, so they slide back | Retrain |
| Partial touch typist (e.g. a developer) | Letters blind, looks for numbers and symbols | Full keyboard blind, including code symbols | Gaps in the top row and right pinky keys | Adaptive (+ Coder) |
| Fluent typist | Touch types at 60+ WPM | Speed and consistency past 90 WPM | Uneven rhythm, slow letter pairs | Fluency |

**North-star metric — the eyes-up rate:** share of learners who reach 30 WPM at 95% accuracy or better with the on-screen keyboard hidden, within 30 days of starting. Target for beta: 40%.

Supporting metrics, with beta targets to validate:

| Metric | Definition | Beta target |
| --- | --- | --- |
| Crossover rate | Share of Retrain learners whose blind speed passes their own sighted baseline within 6 weeks | 50% |
| Placement accuracy | Share of learners who keep their assigned track after the first week (no manual switch) | 80% |
| Day-7 return | Learners active on day 7 / learners who finished onboarding | 45% |
| Day-30 return | Same, on day 30 | 25% |
| Practice rhythm | Median sessions per active week | 4 or more |
| Transfer | Day-30 check-in: "I touch type outside EyesUp most of the time" | 50% yes |

The beta targets are starting guesses, not benchmarks; Phase 1 data resets them.

## Competitive landscape

Existing tools tend to commit to one method for everyone. EyesUp's opening is to pick the method per learner and to carry them through the switch to everyday typing.

| Category | Examples | Strength | Where EyesUp differs |
| --- | --- | --- | --- |
| Adaptive drillers | [keybr](https://keybr.com/help) | Unlocks letters as speed targets are met; the weakest letter appears in every generated word | Adds diagnosis, explicit finger teaching for beginners and a fading visual guide |
| Structured courses | TypingClub, Typing.com | Clear lesson ladders, popular in schools | Adapts the ladder to the learner instead of one fixed path |
| Speed-test communities | Monkeytype | Polished tests and stats for people who already touch type | Teaches from zero; tests are one tool, not the product |
| Native desktop tutors | TIPP10, Klavaro, GNU Typist | Offline, open source | Modern design and illustrations; the same app on every OS |

This table is a first pass from general knowledge. Phase 0 includes a hands-on teardown of five competitors before the design is frozen.

## Roadmap

| Phase | Weeks | What gets built | Gate to pass before the next phase |
| --- | --- | --- | --- |
| 0 · Discover and design | 1–3 | Test the method with 5–8 learners on a clickable prototype; final designs, illustrations, content corpus, competitor teardown; spike: typing engine core and a keyboard-event test page | A: learners understand finger zones and the fade in prototype tests |
| 1 · Web MVP | 4–11 | Onboarding diagnostic with both typing probes; Foundations and Adaptive tracks; QWERTY US and UK; English; fading keyboard and hand guide, local progress, installable | B: 20 beta learners; half type the home row blind at 95% within 2 weeks |
| 2 · Web v1, public | 12–17 | Retrain and Fluency tracks; Coder overlay; AZERTY and French, heatmap, ghost race, accessibility modes; crossover chart, commit week, own-text practice | C: day-30 return and eyes-up rate meet the beta targets |
| 3 · Desktop apps | 18–22 | Tauri builds for Windows, macOS and Linux (deb, rpm, AppImage, Flatpak); code signing, notarization, signed auto-updates; SQLite storage, offline from first launch, reminders | D: keyboard-event matrix passes on all three OSes |
| 4 · Grow | 23 onward | Optional accounts with encrypted sync; classroom mode; more layouts (QWERTZ, Dvorak, Colemak) and languages; kids mode and audio-guided mode | — |

Durations assume one developer close to full time; part-time roughly doubles them.

Each gate is a go/no-go check: if it fails, the next phase waits and the method or design is fixed first. The web app stays the main product throughout; desktop builds reuse it.

## Documentation set

This doc is the planning set; the design canvas holds every visual. Export the doc to Markdown into the repo's `docs/` folder once Phase 0 signs it off.

| Document | What it settles |
| --- | --- |
| This tab | Vision, decisions, learners, metrics, roadmap |
| Learning method | The research basis and the six-stage method, fading, sessions, motivation, relapse plan |
| Onboarding diagnostic | The six questions, two typing probes, placement rules, tracks and overlays |
| Curriculum and engine | Key order, lesson anatomy, text generation, mastery formula, scheduler, metric definitions |
| UX and design spec | Information architecture, flows, screen inventory, tokens, illustrations, accessibility, sound |
| Technical architecture | Stack, architecture, repo layout, keyboard input rules, data model, privacy, budgets, testing |
| Native apps and release | Every OS and package format, the Electron fallback, signing, updates, CI |
| References | Sources behind every research and technical claim |
| [Design canvas](../design/) | Wireframes, high-fidelity screens, illustrations, tokens, the Keyboard component |
| [Scope of Work](09-scope-of-work.md) | Deliverables and acceptance criteria, 36 functional and 13 non-functional requirements, schedule, effort, costs, risks, change control |
| Repo starter kit (eyesup-repo-kit.zip) | README, contributing guide, ADRs, layout files and validator, tokens, SQLite schema, test matrix, style guide, privacy, security, runbook, backlog |

To create in the repo as the build starts:

- [x] `README.md` and `CONTRIBUTING.md`
- [x] Architecture decision records in `docs/adr/` (first three: desktop shell, interface framework, storage)
- [x] `docs/layout-format.md`: the layout file schema, so new layouts need no code
- [x] `docs/keyboard-test-matrix.md`: the per-OS, per-layout manual checklist
- [x] `docs/content-style-guide.md`: word lists, blocklist, tone of feedback copy
- [x] `PRIVACY.md` and `SECURITY.md`
- [x] `CHANGELOG.md`

All seven are drafted in the repo starter kit, together with the three layout files and their schema and validator, the design tokens, the SQLite schema, a release runbook, a CI workflow and a 49-story backlog that maps every functional requirement in the [Scope of Work](09-scope-of-work.md) to work items.

What will be built, when, how each part is accepted, the costs and the risks are in the [Scope of Work](09-scope-of-work.md).

## Open questions

- [ ] Final name: trademark and domain check for EyesUp (fallbacks: HomeRow, Keystride).
- [ ] Brand home: standalone brand, or published under Evolvtech?
- [ ] Are under-13 learners in scope for v1? A yes adds parental consent, no free-text input and a separate content set.
- [ ] Which layouts do the first 100 users actually use? Decides whether AZERTY moves into the MVP.
- [ ] Illustration route: keep the geometric in-house style, or commission an illustrator for the hand and posture art?
- [ ] Monetisation: one-time desktop licence, school seats, or both?
- [ ] Competitor teardown: five tools, hands-on, in Phase 0.
