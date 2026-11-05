# Changelog

All notable changes to EyesUp are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). The web app and desktop apps share one version number.

## [Unreleased]

### Fixed

- Caps Lock shows as “Caps” with smaller type on wide keys, so the label fits on the Welcome keyboard.
- Dark mode is easier to read: keyboard finger fills stay on dark key caps, the progress heatmap uses a dark blue scale, practice text uses the untyped ink colour, and primary buttons keep AA contrast on the dark accent.
- Startup always shows loading, an error with retry, or Welcome instead of a blank dark page; empty links and Practice without a profile no longer leave an empty shell; fonts resolve under the `/eyesup/app/` Pages path.

### Changed

- Onboarding and daily hubs match the design more closely: Orient stepper with posture and reach, Questions and Result cards, Today and Progress/Library/Settings in a side-nav hub, practice peek/Caps/break cards, and grouped Settings sections (EU-050 / EU-051).
- Interface screens now follow the design snapshots: Welcome hero with zone keyboard and hands, Progress heatmap on the keyboard plus crossover chart, and shared shell components (logo, cards, headers).

### Added

- Desktop first-launch import screen (`#/desktop-import`) for web JSON exports (EU-043).
- Milestone writers for first blind line, all letters unlocked, crossover, and 30 WPM blind (FR-24).
- Desktop release workflow (`.github/workflows/release.yml`) builds unsigned Linux, macOS and Windows installers and opens a draft GitHub release with checksums (EU-044).
- Desktop window memory and practice full-screen toggle (`window.json` + `set_fullscreen`) (EU-048).
- Desktop update stubs and between-session update banner wiring; signed updater docs for when secrets exist (EU-046).
- Phase 3 product-owner checklist for beta gates, signing secret names, keyboard matrix and store submissions.
- Desktop SQLite StorageAdapter parity: Tauri commands plus web bridge so the desktop shell uses SQLite and the browser keeps IndexedDB (EU-042).
- Public landing page (`site-public/`) and Pages assemble step; phone hand-off route `#/device` (EU-041 / D2.2).
- Progress heatmap, session history, milestones and crossover summary; Library own-text practise; Settings track/goal/sound (EU-037, EU-039, EU-051).
- Beta checklist, synthetic Gate B fixtures, and Gate C supporting metrics in `pnpm beta-report`.
- French practice pack (words, phrases, blocklist, letter model) and UI strings; the web app selects them for AZERTY / `language: fr` (EU-036).
- Desktop Tauri 2 scaffold under `apps/desktop` with SQLite schema and `import_json` command (EU-042 start); `scripts/version-set.mjs`.
- Engine support for Retrain and Fluency: crossover projection, Commit Week gates, eyes-up points, merged Retrain unlocks, and Fluency session planning (EU-031–EU-033).
- Axe WCAG smoke e2e on the welcome screen (Gate C / NFR-06 prep).
- Web MVP: onboarding, Orient, placement, Today, practice session player, Settings, Keyboard, typing surface, IndexedDB storage, offline service worker (Phase 1 / D1.1–D1.3).
- Input adapter (engine + DOM bridge) with Playwright keyboard coverage (EU-012).
- Engine mastery fade levels, pair confidence, session scheduler, spaced review and placement (EU-013–EU-016, EU-010).
- English practice word list of about 10,000 everyday words from wordfreq (CC BY-SA 4.0), with a rebuilt letter model (EU-003).
- Beta report script for Gate B JSON exports (EU-052).
- GitHub Pages publishes the app under `/app/` next to the keyboard test page.
- Backlog stories for Welcome/Orient, Settings and the beta report script (EU-050–EU-052).
- pnpm monorepo with apps/web and packages (engine, ui, layouts, content, tokens), CI, Vitest, Playwright, token and size checks (EU-006).
- English seed word list, phrases, blocklist, letter model and word-list options doc (EU-003 seed; superseded by `words.txt`).
- Engine spike: seeded line generator, mastery formula and metrics with property tests (EU-004).
- Offline keyboard-event test page under `tools/keyboard-test/` with guided matrix mode, latency harness and GitHub Pages workflow (EU-005).
- Public-repo housekeeping: `.gitignore`, `.editorconfig`, `.nvmrc`, Contributor Covenant code of conduct, GitHub issue and pull request templates.
- Product plan, Scope of Work and design snapshots under `docs/spec/` and `docs/design/`.
- Repository documentation: README, contributing guide, privacy notice, security policy.
- Architecture decision records 0001–0003: Tauri 2 desktop shell, Svelte 5 interface, local-first storage.
- Keyboard layout format, JSON Schema and validator, with layouts for English (US) QWERTY, English (UK) QWERTY and French AZERTY.
- Design tokens for light and dark themes.
- SQLite schema version 1 for the desktop app.
- Keyboard test matrix, content style guide and release runbook.
- Backlog for Phases 0–3.
