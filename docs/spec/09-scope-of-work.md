# EyesUp — Scope of Work

Oct 23, 2026 · @TBJr

## Purpose and outcomes

This scope covers building EyesUp from discovery to signed desktop apps: Phases 0–3, about 22 weeks with one developer working close to full time. Phase 4 (accounts, classroom mode, more layouts and languages) will be scoped separately once Phase 3 ships.

At the end of this work there will be:

1. **A public web app** that diagnoses how each learner types today and teaches touch typing with a guide that fades key by key.
2. **Desktop apps for Windows, macOS and Linux**, built from the same code, signed, and able to update themselves.
3. **Evidence that the method works**, measured on a beta group against the targets in the plan (eyes-up rate 40%, crossover rate 50%, day-30 return 25%).

The method, design rules and technical choices behind this scope are in the [EyesUp plan](01-overview-and-roadmap.md). Screens and illustrations are in the [design snapshots](../design/). This document only says what will be built, when, and how each part is accepted.

## Scope

Each phase adds to the one before; nothing is rebuilt. Anything not listed as in scope is out of scope until a change request adds it (see Acceptance and change control).

| Phase | In scope | Not in this phase |
| --- | --- | --- |
| 0 · Discover and design (weeks 1–3) | Prototype test with 5–8 learners; final designs and illustrations; English content corpus; competitor teardown; typing-engine spike; keyboard-event test page | Production code beyond the spike |
| 1 · Web MVP (weeks 4–11) | Onboarding diagnostic with both probes; Foundations and Adaptive tracks; QWERTY US and UK; English; fading keyboard and hand guide; sessions, line results, summary; local progress; installable offline web app; private beta | Retrain and Fluency tracks, AZERTY, own-text practice, desktop builds |
| 2 · Web v1, public (weeks 12–17) | Retrain and Fluency tracks; Coder overlay; AZERTY and French; key heatmap; ghost race; crossover chart and commit week; own-text practice; accessibility modes; one-page public site with links | Numbers overlay keypad lessons (Should, if time allows); accounts |
| 3 · Desktop apps (weeks 18–22) | Tauri builds for Windows, macOS and Linux (.deb, .rpm, AppImage, Flatpak); code signing and notarization; signed auto-updates; SQLite storage; reminders; store and repository submissions | Mac App Store; Snap; ARM Linux builds |

**Out of scope for this whole engagement:**

- Phone and tablet typing practice. A physical keyboard is required; phones get a "use a keyboard" screen that hands off to a computer.
- Accounts, sign-in, cloud sync and classroom or teacher dashboards (Phase 4).
- Languages other than English and French; layouts other than QWERTY (US, UK) and AZERTY (FR).
- Languages typed through an input method (Chinese, Japanese, Korean and similar).
- Kids mode, audio-guided mode and speech output beyond screen-reader announcements.
- Payments, subscriptions and licence keys.
- Reading keystrokes outside the EyesUp window.

## Deliverables and acceptance criteria

A deliverable is accepted when every criterion in its row is met and shown in a demo or a written report.

| ID | Deliverable | Phase | Accepted when |
| --- | --- | --- | --- |
| D0.1 | Prototype test report | 0 | 5 or more learners tested; at least 4 can name which finger types E, R and O after Orient; findings and design changes listed |
| D0.2 | Final design files | 0 | All 15 MVP screens at high fidelity in light and dark; four illustrations final; tokens file matches the screens |
| D0.3 | English content pack | 0 | 10,000-word frequency list with licence recorded; letter Markov model; 200 phrases; offensive-word blocklist applied |
| D0.4 | Engine spike and keyboard test page | 0 | Engine generates lines from unlocked keys only; test page logs `code`, `key`, timing and modifiers on Windows, macOS and Ubuntu |
| D1.1 | Onboarding diagnostic | 1 | Six questions, both probes and the result card work by keyboard alone; placement follows the rules in the plan on 10 scripted test profiles |
| D1.2 | Practice engine and session player | 1 | Lines, per-key fade L0–L3, peek, pause, line results and summary work; keystroke-to-paint under 16 ms (95th percentile) on the reference laptop |
| D1.3 | Web MVP, private beta | 1 | Installable and works offline; 20 beta learners onboarded; no blocker or critical defects open |
| D1.4 | Beta report | 1 | Gate B result (home row blind at 95% within 2 weeks for half the cohort) with raw numbers |
| D2.1 | Web v1, public | 2 | Retrain, Fluency, Coder, AZERTY and French, heatmap, crossover chart, own text all live; WCAG 2.2 AA audit passed |
| D2.2 | Public site | 2 | One page explaining EyesUp, readable at phone width, with links to the web app, privacy notice and downloads |
| D2.3 | Outcome report | 2 | Day-30 return and eyes-up rate measured against beta targets (Gate C) |
| D3.1 | Desktop builds | 3 | Signed installers for Windows (MSI, NSIS), macOS (notarized universal DMG) and Linux (.deb, .rpm, AppImage, Flatpak) install and launch offline |
| D3.2 | Update channel | 3 | A signed test update installs on all three OSes; a tampered update is refused |
| D3.3 | Keyboard matrix sign-off | 3 | Every row of the keyboard test matrix passes on Windows, macOS, Ubuntu, Kali and Fedora (Gate D) |
| D3.4 | Store and repository listings | 3 | Microsoft Store and Flathub submissions accepted; apt and dnf repositories published |
| D3.5 | Handover pack | 3 | Repo docs complete (README, ADRs, layout format, test matrix, privacy, security, changelog); release runbook tested by a second person |

## Functional requirements

Thirty-six requirements, each tied to the phase that delivers it. Priority uses Must, Should and Could: a phase cannot pass its gate with a Must missing; Should and Could items can move to the next phase by agreement. In Phase 1, learners placed on Retrain start on Foundations and learners placed on Fluency start on Adaptive, until those tracks ship in Phase 2.

| ID | Requirement | Phase | Priority |
| --- | --- | --- | --- |
| FR-01 | Six onboarding questions, one per screen, each answerable with number keys | 1 | Must |
| FR-02 | Probe A: a 45-second sighted typing test that also fingerprints the keyboard layout | 1 | Must |
| FR-03 | Probe B: home-position check plus two blind lines with the keyboard hidden | 1 | Must |
| FR-04 | Placement on a track by the plan's rules, with the reason shown and a one-tap override | 1 | Must |
| FR-05 | Layout confirmation on the result card, with manual change | 1 | Must |
| FR-06 | Session plans from the scheduler: warm-up, new keys, mixed review, words, blind check or cool-down | 1 | Must |
| FR-07 | Hands-ready gate: pressing F and J together starts a session | 1 | Should |
| FR-08 | Per-key fading guide at four levels, stepping up and back by the plan's rules | 1 | Must |
| FR-09 | Animated hand guide for keys at L0; a static arrow when reduced motion is on | 1 | Must |
| FR-10 | Peek: holding Ctrl shows the full keyboard; peeked keystrokes count as guided | 1 | Must |
| FR-11 | Pause on Esc, window blur or hidden tab; idle time never counts | 1 | Must |
| FR-12 | Stop-on-error mode for Foundations; mark-and-continue for other tracks | 1 | Must |
| FR-13 | Line result strip after each line and a session summary | 1 | Must |
| FR-14 | Unlock intro card with the reach animation for each new key | 1 | Must |
| FR-15 | Break card after 20 minutes of continuous typing | 1 | Should |
| FR-16 | Per-key and per-pair confidence model driving focus key, unlocking and fading | 1 | Must |
| FR-17 | Pseudo-word and real-word generation from unlocked keys, focus key in every word | 1 | Must |
| FR-18 | Spaced review of mastered keys | 1 | Should |
| FR-19 | Retrain track: crossover chart from day 1, dip explainer, commit week, eyes-up point multiplier | 2 | Must |
| FR-20 | Fluency track: slow-pair drills, rhythm metronome, rollover drills, timed tests | 2 | Must |
| FR-21 | Coder overlay: brackets, operators, naming styles, real snippets | 2 | Should |
| FR-22 | Numbers overlay: number-row drills; keypad lessons on full-size keyboards | 2 | Could |
| FR-23 | AZERTY (French) layout and French content, including dead keys | 2 | Must |
| FR-24 | Progress: key heatmap, speed and accuracy history, milestones | 2 | Must |
| FR-25 | Streak that survives one rest day a week | 1 | Should |
| FR-26 | Ghost race against the learner's own best run | 2 | Could |
| FR-27 | Own-text practice, stored only on the device | 2 | Must |
| FR-28 | Large text, high contrast, dark mode and reduced motion | 1 | Must |
| FR-29 | One-hand and reduced-finger maps; dyslexia-friendly font | 2 | Should |
| FR-30 | Full JSON export and delete-everything in settings | 1 | Must |
| FR-31 | Desktop installers for Windows, macOS and Linux | 3 | Must |
| FR-32 | Signed auto-updates, offered between sessions, never during one | 3 | Must |
| FR-33 | SQLite storage on desktop, with import from a web export | 3 | Must |
| FR-34 | Opt-in daily practice reminder through OS notifications | 3 | Could |
| FR-35 | Remembered window size and full-screen practice | 3 | Should |
| FR-36 | Phones and keyboard-less devices: a "use a keyboard" screen that hands off to a computer | 2 | Should |

## Non-functional requirements

These apply to every phase from the moment the feature they govern exists, and each has a check that can fail.

| ID | Area | Requirement | Verified by |
| --- | --- | --- | --- |
| NFR-01 | Responsiveness | Keystroke to painted character under 16 ms at the 95th percentile on the reference laptop (mid-range, 2018) | Automated timing test in CI plus a manual run on the reference laptop |
| NFR-02 | Size | Web app JavaScript under 200 KB gzipped, excluding content packs | Bundle-size check in CI |
| NFR-03 | Size | Each desktop installer under 15 MB | Release checklist |
| NFR-04 | Start-up | Desktop cold start under 1.5 s; memory during a session under 150 MB | Release checklist on each OS |
| NFR-05 | Offline | Every learning feature works with no network after first load (web) or install (desktop) | End-to-end test with network disabled |
| NFR-06 | Accessibility | WCAG 2.2 AA; full keyboard operation; colour never the only cue | Audit before Gate C; screen-reader pass |
| NFR-07 | Privacy | No keystroke timing, typed text or own text leaves the device; analytics opt-in and session-level only | Network log review; privacy notice |
| NFR-08 | Security | Content Security Policy limited to the app's own origin; bundled fonts; signed installers and updates; no global keyboard hooks | Security checklist; tampered-update test |
| NFR-09 | Browsers | Current and previous major versions of Chrome, Edge, Firefox and Safari on desktop | Playwright on Chromium, Firefox and WebKit; manual Safari pass |
| NFR-10 | Operating systems | Windows 10 and 11; macOS 12 or later; Ubuntu 22.04 or later, Debian 12, Kali (current), Fedora (current) | Keyboard test matrix |
| NFR-11 | Reliability | Progress saved after every line; a crash loses at most the line in progress | Kill-process test |
| NFR-12 | Localisation | All interface text in string files; no text in images | Lint rule; French build in Phase 2 |
| NFR-13 | Maintainability | Engine package at 90% or higher line coverage; layouts and content are data files, not code | Coverage report in CI |

## Milestones, schedule and effort

The build runs 22 weeks from the agreed start date, in four phases separated by go/no-go gates; the [roadmap in the plan](01-overview-and-roadmap.md) shows the same sequence. A failed gate pauses the next phase; it does not cancel the work.

| Milestone | End of week | Deliverables due | Gate to pass |
| --- | --- | --- | --- |
| M0 · Design signed off | 3 | D0.1–D0.4 | A: learners understand finger zones and the fade |
| M1 · Private beta live | 9 | D1.1–D1.3 | — |
| M2 · MVP proven | 11 | D1.4 | B: half the beta types the home row blind at 95% within 2 weeks |
| M3 · Public web v1 | 17 | D2.1–D2.3 | C: day-30 return and eyes-up rate meet beta targets |
| M4 · Desktop apps released | 22 | D3.1–D3.5 | D: keyboard matrix passes on all three OSes |

Estimated effort in person-weeks. The schedule assumes one developer close to full time; part-time roughly doubles calendar time but not effort.

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Total |
| --- | --- | --- | --- | --- | --- |
| Lead developer | 2 | 8 | 6 | 5 | 21 |
| Product and UX designer | 3 | 1 | 1.5 | 0.5 | 6 |
| Illustrator (optional, if commissioned) | 2 | — | — | — | 2 |
| Content editor (word lists, copy, French) | 1 | — | 1.5 | — | 2.5 |
| QA and test coordination | — | 1 | 1 | 1.5 | 3.5 |
| **Total** | **8** | **10** | **10** | **7** | **35** |

The designer and content editor can overlap with the developer, which is why 35 person-weeks fit in 22 calendar weeks.

## Roles and responsibilities

One person can hold several roles; what matters is that each decision has exactly one owner.

| Role | Responsible for | Decides |
| --- | --- | --- |
| Product owner | Priorities, gate decisions, acceptance of deliverables, beta recruitment, store accounts and signing identities | Go/no-go at each gate; scope changes |
| Lead developer | Engine, interface, storage, desktop shells, CI, releases, technical docs | Technical approach within the plan's stack |
| Product and UX designer | Screens, illustrations brief, usability tests, accessibility audit | Visual and interaction details within the design system |
| Illustrator (optional) | Hand, reach and posture artwork in the house style | — |
| Content editor | Word lists, phrases, code snippets, interface copy, French translation, blocklist | Wording of interface text |
| QA and test coordination | Keyboard test matrix runs, regression passes, defect triage | Defect severity |
| Beta learners (20+) | Using EyesUp for 2–4 weeks and completing check-ins | — |

## Third-party costs

The fixed outside costs come to about US$220 a year, almost all of it for signing the macOS and Windows apps; people's time is the real cost and sits in the effort table above. Prices were checked on 23 October 2026 and are in US dollars.

| Item | Needed for | Cost | Notes |
| --- | --- | --- | --- |
| [Apple Developer Program](https://developer.apple.com/programs/enroll/?product=WM) | Developer ID signing and notarization of the macOS app (Phase 3) | $99 per membership year | Prices may vary by region; fee waivers exist for some nonprofits, schools and government bodies |
| [Azure Artifact Signing](https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554), entry plan | Signing Windows installers and updates (Phase 3) | $9.99 per month, up to 5,000 signatures | Organizations in the US, Canada, EU or UK, or individuals in the US or Canada. Otherwise buy a code-signing certificate from a certificate authority: \[YOUR QUOTE\] |
| [Microsoft Store](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/) developer account | Store listing (Phase 3) | Free | Free for individuals and companies since 7 May 2026 |
| [Flathub](https://docs.flathub.org/docs/for-app-authors/submission) | Linux listing (Phase 3) | No fee listed | Submitted and reviewed through a pull request |
| apt and dnf repositories, AUR | Linux packages (Phase 3) | Hosting only | Served from the same static host |
| Static hosting, for example [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits) | Web app, public site, update files (Phases 1–3) | Free plan available | Free plan: 500 builds a month, 20,000 files, 25 MiB per file |
| Domain name | Public web address | \[YOUR DOMAIN COST\] | Varies by registrar and ending |
| Fonts: Atkinson Hyperlegible, JetBrains Mono | Interface and practice text | Free | SIL Open Font License; bundled with the app |
| Word lists and text corpus | Practice content (Phase 0) | \[TO CONFIRM\] | Depends on the licence of the source chosen |
| Illustrator (optional) | Hand and posture artwork (Phase 0) | \[YOUR RATE\] | Only if not drawn in-house |

## Assumptions and dependencies

If any of these turns out false, the schedule and effort above are re-estimated through change control.

**Assumptions**

- One developer works close to full time from week 1, and the product owner answers questions within 2 working days.
- The stack in the plan holds: TypeScript engine, Svelte 5 interface, Tauri 2 desktop shell. The Electron fallback adds 1–2 weeks if Gate D forces it.
- No backend is built: storage is local, analytics are opt-in and aggregate, and there are no accounts.
- Launch content is English and French only; QWERTY (US, UK) and AZERTY (FR) only.
- The designs and illustrations in the design canvas are the starting point; Phase 0 refines them rather than starting over.

**Dependencies**

- 5–8 prototype testers in Phase 0 and 20 or more beta learners from week 9.
- Real test hardware: at least one Windows, one Mac and one Linux machine, plus US, UK and AZERTY keyboards.
- A legal entity or individual that qualifies for Apple and Windows code signing before week 18 (identity checks can take days).
- A licensed word list and text corpus chosen by the end of week 2.
- The domain and hosting accounts set up before the private beta in week 9.

## Risk register

Linux keyboard input, relapse and a single developer are the risks to watch.

| Likelihood ↓ / Impact → | Low | Medium | High |
| --- | --- | --- | --- |
| High | — | **R7** Low retention · **R10** Scope creep | — |
| Medium | R9 SmartScreen warnings | R3 Signing identity · R8 Layout detection · R11 Accessibility found late · R12 Linux packaging | **R1** Linux keyboard input · **R2** Learners slide back · **R4** One developer |
| Low | — | R5 Corpus licence, words | R6 Privacy distrust |

Bold risks sit in the red zone of the original risk map.

The red zone holds the risks that would sink the project; each has a gate or an early test that exposes it before it is expensive. The register is reviewed at every gate.

| ID | Risk | Mitigation | Owner |
| --- | --- | --- | --- |
| R1 | Linux web view mishandles keys (dead keys, AltGr, layouts) | Keyboard test page in Phase 0; full matrix at Gate D; Electron fallback costed at 1–2 weeks | Lead developer |
| R2 | Learners slide back to looking; the method does not beat their old habit | Crossover plan; Gates B and C measure it on real learners before public launch and desktop work | Product owner |
| R3 | Signing identity not eligible, or verification is slow | Start Apple and Windows enrolment in week 12; certificate-authority fallback for Windows | Product owner |
| R4 | One developer: illness or overrun stalls everything | Should and Could items can move a phase; weekly progress check; docs kept current | Product owner |
| R5 | Word list licence problems or offensive generated words | Licence chosen by week 2; blocklist; automated tests on generated lines | Content editor |
| R6 | Learners distrust an app that records keystrokes | Local-first storage; nothing typed leaves the device; plain privacy notice; no global key capture | Lead developer |
| R7 | Learners stop after the first week | 5–20 minute sessions; forgiving streaks; optional reminders; measured at Gate C | Product owner |
| R8 | Keyboard layout detected wrongly | Three-key fingerprint; confirmation on the result card; manual change in settings | Lead developer |
| R9 | Windows warns about a new app until it builds download reputation | Sign from the first release; Microsoft Store listing | Lead developer |
| R10 | Scope creep toward phones, accounts or more languages | Out-of-scope list; change control; Phase 4 holds the queue | Product owner |
| R11 | Accessibility problems found late | Checks on every screen from Phase 1; full audit before Gate C | Designer |
| R12 | Linux distributions differ in system libraries | Build on the oldest supported Ubuntu; Flatpak and AppImage for the rest; test on five distributions | Lead developer |

## Acceptance and change control

**Acceptance.** Each deliverable is presented with a short demo or report against its criteria in the deliverables table. The product owner accepts it or lists the unmet criteria within 5 working days; silence after 5 working days counts as acceptance. A rejected deliverable is fixed and presented again for the listed criteria only.

**Defect severity**, used for acceptance and for the beta:

| Severity | Meaning | Blocks acceptance |
| --- | --- | --- |
| Blocker | Learning cannot continue, or progress is lost | Yes |
| Critical | A Must requirement fails, or a privacy or security rule is broken | Yes |
| Major | A Should requirement fails, or a clear workaround is needed | No, if scheduled for the next release |
| Minor | Cosmetic or wording | No |

**Change control.** Any change to scope, a Must requirement, a milestone date or the third-party budget goes through a written change request:

1. Describe the change and why it is needed.
2. The lead developer estimates the effect on effort, schedule and risks within 3 working days.
3. The product owner approves, rejects or defers it to Phase 4.
4. Approved changes are added to this document with the date, and the backlog is updated.

## Sources

Prices and terms checked on 23 October 2026.

- [Apple Developer Program enrolment](https://developer.apple.com/programs/enroll/?product=WM) — membership fee
- [devclass: Azure Artifact Signing for Windows apps](https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554) — prices and eligibility; [Microsoft pricing page](https://azure.microsoft.com/en-us/pricing/details/trusted-signing/) for plan limits
- [Windows Developer Blog, 7 May 2026](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/) — free Microsoft Store registration
- [Flathub submission guide](https://docs.flathub.org/docs/for-app-authors/submission)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits)
- [EyesUp plan](01-overview-and-roadmap.md) and [design snapshots](../design/) — method, metrics, architecture and screens
