# EyesUp

Learn to type without looking at the keyboard.

EyesUp starts with a 3-minute check of how you type today, places you on one of four tracks, and teaches with an on-screen keyboard that fades key by key as your fingers learn. It runs in the browser and as a desktop app on Windows, macOS and Linux, from one codebase. Everything you type stays on your device.

> **Status:** Phase 3 in progress on `phase-3` (desktop: SQLite storage, window state, updater stubs, release workflow). Phase 0–2 web work is on `main` / prior phase branches. Private beta / Gate B still needs a product-owner cohort; see [docs/beta-checklist.md](docs/beta-checklist.md) and [docs/phase-3-owner-checklist.md](docs/phase-3-owner-checklist.md).

## Principles

- **Diagnose before teaching.** A two-finger beginner and a fast self-taught typist need different things.
- **Fade the help on purpose.** Constant guidance creates dependence; each key's guide steps down as it is mastered and comes back if accuracy slips.
- **Plan for the switch to real life.** Learners who already type by looking get slower before they get faster; EyesUp tracks the point where blind typing overtakes their old speed.
- **Local-first and private.** No account, no server in the learning loop, no keystrokes read outside the EyesUp window.
- **No runtime dependencies in the engine.** The typing engine is plain TypeScript with zero packages.

## Repository layout

```text
eyesup/
├── apps/
│   ├── web/                 # Svelte 5 + Vite, installable web app, service worker, IndexedDB adapter
│   └── desktop/             # Tauri 2 shell that loads the web build
│       └── src-tauri/       # Rust: SQLite adapter and migrations, updater, window state
├── packages/
│   ├── engine/              # zero-dependency TypeScript: input, mastery, scheduler, generator, metrics
│   ├── ui/                  # Svelte components: typing surface, keyboard, hands, charts
│   ├── layouts/             # keyboard layout files (JSON) and their schema
│   ├── content/             # word lists, letter models, phrases, code snippets per language
│   └── tokens/              # design tokens (JSON) → CSS custom properties
├── docs/                    # project docs and architecture decision records
├── scripts/                 # repo tooling (layout validation, release helpers)
└── tests/e2e/               # Playwright, including the keyboard-event checks
```

## Getting started

Requirements: Node.js 22 LTS, pnpm 9 or later. For the desktop app, also Rust (stable) and the Tauri system prerequisites for your OS.

```bash
pnpm install
pnpm dev                       # web app at http://localhost:5173
pnpm test                      # engine unit tests
pnpm test:e2e                  # Playwright in Chromium, Firefox and WebKit
pnpm desktop:dev                  # desktop app in a native window (needs Rust)
pnpm beta-report fixtures/beta-exports  # Gate B / Gate C support metrics
node scripts/validate-layouts.mjs # check every layout file
```

## Beta and gates

| Gate | Meaning | How |
| --- | --- | --- |
| A | Prototype / Orient understood | Passed (Phase 0) |
| B | Half of beta types home row blind at 95% within ~2 weeks | [docs/beta-checklist.md](docs/beta-checklist.md) + `pnpm beta-report` |
| C | Day-30 return and eyes-up rate vs plan targets | Same exports; report prints supporting shares |
| D | Keyboard matrix on all desktop OSes | [docs/keyboard-test-matrix.md](docs/keyboard-test-matrix.md) |

## Documentation

| Document | What it covers |
| --- | --- |
| [Layout format](docs/layout-format.md) | How keyboard layouts are described and how to add one |
| [Keyboard test matrix](docs/keyboard-test-matrix.md) | The per-OS, per-layout checks every release must pass |
| [Content style guide](docs/content-style-guide.md) | Practice text rules and interface wording |
| [Release runbook](docs/release-runbook.md) | Cutting, signing and publishing a release |
| [Architecture decisions](docs/adr/) | Why the stack is what it is |
| [Backlog](docs/planning/backlog.csv) | Stories for Phases 0–3, importable into an issue tracker |
| [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) | |
| [Product plan and Scope of Work](docs/spec/) | Vision, learning method, curriculum, architecture, deliverables and acceptance |
| [Design snapshots](docs/design/) | Screens, wireframes, illustrations and tokens |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

The code in this repository is licensed under the [GNU General Public License v3.0](LICENSE). The EyesUp name and logo are not covered by that licence and remain reserved.
