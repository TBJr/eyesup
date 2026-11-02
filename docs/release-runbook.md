# Release runbook

How to cut, sign and publish an EyesUp release for the web and all desktop platforms. One tag produces every build; a release is all platforms or none.

## Before you start

- [ ] `main` is green: unit tests, end-to-end tests, bundle size, `npm audit` and `cargo audit`.
- [ ] Every Must item for this milestone is merged (see the backlog).
- [ ] The keyboard test matrix is complete for this release (desktop releases need every applicable cell).
- [ ] `CHANGELOG.md` has an entry under "Unreleased" that a learner could understand.
- [ ] Signing access is current: Apple Developer Program membership, Windows signing account, GPG key expiry date at least 30 days away.

## 1. Version

1. Pick the version (SemVer): patch for fixes, minor for features, major for breaking data changes.
2. Run `pnpm version:set <x.y.z>` (script added with the release workflow in Phase 3). This updates `package.json`, `apps/desktop/src-tauri/tauri.conf.json` and `Cargo.toml` together.
3. Move the "Unreleased" changelog entries under the new version with today's date.
4. Open a pull request titled `release: vX.Y.Z`; merge when green.

## 2. Tag

```bash
git switch main && git pull
git tag -s vX.Y.Z -m "EyesUp vX.Y.Z"
git push origin vX.Y.Z
```

The tag starts the release workflow. Never re-use or move a tag; fix forward with a new patch version.

## 3. What CI does

| Job | Runner | Output | Signing |
| --- | --- | --- | --- |
| test | Linux | — | — |
| web | Linux | Static web build | — |
| linux | Oldest supported Ubuntu LTS | `.deb`, `.rpm`, AppImage, Flatpak manifest | GPG-signed packages and repository metadata |
| macos | macOS | Universal `.app` in a DMG | Developer ID, then notarization and stapling |
| windows | Windows | MSI and NSIS installers (x64, ARM64) | Authenticode via the cloud signing service |
| publish | Linux | Draft GitHub release, checksums, signed update manifest | Updater key |

Secrets used (names only; values live in the CI secret store): `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_APP_PASSWORD`, `AZURE_SIGNING_*`, `GPG_PRIVATE_KEY`, `GPG_PASSPHRASE`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

## 4. Verify the draft release

- [ ] Every expected file is attached, with a SHA-256 checksum.
- [ ] Windows: installer shows the publisher name; app launches offline.
- [ ] macOS: DMG opens without a Gatekeeper warning; `spctl -a -vv EyesUp.app` reports "accepted, source=Notarized Developer ID".
- [ ] Linux: `.deb` installs on Ubuntu 22.04 and 24.04; `.rpm` on Fedora; AppImage runs; signatures verify.
- [ ] Update test: an installed previous version finds, downloads and installs this one between sessions; a tampered manifest is refused.
- [ ] Smoke test on each OS: onboarding, one practice line, session summary, export.

## 5. Publish

1. Publish the GitHub release (this makes the update manifest live).
2. Deploy the web build to the static host; confirm the service worker shows "new version ready" in an existing tab.
3. Push packages to the apt and dnf repositories; update the AUR package.
4. Submit to the Microsoft Store and open the Flathub update pull request.
5. Post the changelog on the public site.

## 6. Watch

For 48 hours after release, check crash reports from beta learners and the issue tracker. Anything that loses progress or blocks learning is a blocker.

## Rollback

- **Desktop:** publish a new patch version that reverts the change. Never point the update manifest at an older version; the updater refuses downgrades.
- **Web:** redeploy the previous build from the host's deploy history; the service worker picks it up on the next visit.
- **Data:** if a release corrupted local data, the next release must include a repair migration. Learners can restore from their last export.
