## Story

Story: EU-___

## Summary

<!-- What changed and why. -->

## Checklist

- [ ] `pnpm test` passes and new engine code has tests (coverage target 90%)
- [ ] `pnpm test:e2e` passes in Chromium, Firefox and WebKit
- [ ] `node scripts/validate-layouts.mjs` passes if a layout changed
- [ ] Bundle size check passes
- [ ] Works with keyboard only; focus is visible; no new contrast failures
- [ ] Reduced-motion and dark mode checked if the change is visual
- [ ] If keyboard input handling changed: the relevant rows of the keyboard test matrix were run and recorded
- [ ] User-facing text follows the content style guide and lives in string files
- [ ] `CHANGELOG.md` updated under "Unreleased"
