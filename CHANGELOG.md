# Changelog

All notable changes to EyesUp are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). The web app and desktop apps share one version number.

## [Unreleased]

### Added

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
