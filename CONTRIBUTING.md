# Contributing to EyesUp

Thanks for helping people learn to type without looking. This guide covers setup, the rules every change follows, and the checks a pull request must pass.

## Set up

1. Install Node.js 22 LTS and pnpm 9 or later.
2. For desktop work, install Rust (stable, via rustup) and the Tauri prerequisites for your operating system. On Linux this includes the WebKitGTK 4.1 development package.
3. Clone the repo and run `pnpm install`.
4. Run `pnpm dev` for the web app, or `pnpm --filter desktop tauri dev` for the desktop app.

## Ground rules

- **The engine has no dependencies.** `packages/engine` must not import any npm package or touch the DOM, storage or network. Platform code lives in the apps and is injected.
- **Keystrokes never leave the device.** No change may send typed text, keystroke timing or own-text content anywhere. Analytics, if added, are opt-in and session-level only.
- **No global keyboard capture.** The desktop app reads keys only while its window is focused.
- **Layouts and content are data.** Adding a layout or a word list should never need a code change. See [docs/layout-format.md](docs/layout-format.md).
- **Colour is never the only cue.** Every finger colour is paired with a finger number; every state has a text or shape cue.
- **Performance budget.** Keystroke to painted character under 16 ms at the 95th percentile on the reference laptop. Web JavaScript under 200 KB gzipped.

## Branches and commits

- Branch from the current phase branch (`phase-0`, `phase-1`, …), or from `main` when working outside a phase: `feat/eu-013-mastery-model`, `fix/short-name`, `docs/short-name`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat(engine): add pair confidence`, `fix(desktop): read AltGr on Linux`.
- Keep pull requests small enough to review in 20 minutes.

## Sign your commits

Every commit must be signed off under the [Developer Certificate of Origin](https://developercertificate.org/). That means you certify you have the right to submit the change under this project's licence.

Add a sign-off with:

```bash
git commit -s
```

Git appends a line like `Signed-off-by: Your Name <you@example.com>` using your `user.name` and `user.email`. Pull requests without a sign-off on every commit will not be merged.

## Pull request checklist

- [ ] `pnpm test` passes and new engine code has tests (coverage target 90%)
- [ ] `pnpm test:e2e` passes in Chromium, Firefox and WebKit
- [ ] `node scripts/validate-layouts.mjs` passes if a layout changed
- [ ] Bundle size check passes
- [ ] Works with keyboard only; focus is visible; no new contrast failures
- [ ] Reduced-motion and dark mode checked if the change is visual
- [ ] If keyboard input handling changed: the relevant rows of [the keyboard test matrix](docs/keyboard-test-matrix.md) were run and recorded
- [ ] User-facing text follows [the content style guide](docs/content-style-guide.md) and lives in string files
- [ ] `CHANGELOG.md` updated under "Unreleased"

## Adding a keyboard layout

1. Copy the closest file in `packages/layouts/` and rename it `<family>-<region>.json`.
2. Edit the characters, fingerprint and learn order as described in [docs/layout-format.md](docs/layout-format.md).
3. Run `node scripts/validate-layouts.mjs`.
4. Add a column for the layout in the keyboard test matrix and run the input rows on real hardware.

## Adding practice content

Read [docs/content-style-guide.md](docs/content-style-guide.md) first. Record the source and licence of every word list or corpus in `packages/content/<language>/SOURCES.md`.

## Architecture decisions

Significant technical choices are recorded as ADRs in [docs/adr/](docs/adr/). Copy `0000-template.md`, number it, and open it as a pull request for discussion.

## Reporting security problems

Please don't open a public issue; see [SECURITY.md](SECURITY.md).
