# Security policy

## Supported versions

Only the latest release of the web app and of each desktop app receives security fixes. Desktop apps update themselves; please keep automatic updates on.

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/TBJr/eyesup/security/advisories/new) (the repo's **Security** tab → **Report a vulnerability**). Include:

- what you found and where (web app, desktop app and OS, installer, update channel, website)
- steps to reproduce, or a proof of concept
- the impact you believe it has

Please don't open a public issue or share the problem before it is fixed. We aim to acknowledge reports within 3 working days and to agree a disclosure date with you once a fix is ready. We will credit you in the release notes unless you prefer otherwise.

## What we consider in scope

- Any way typed text, keystroke timing or saved texts could leave the device
- Any way the desktop app could read keys outside its own window
- Code execution through layout files, content packs, pasted text or imported export files
- Weaknesses in the update channel: unsigned, downgraded or tampered updates being accepted
- Cross-site scripting or content-security-policy bypasses in the web app

## How releases are protected

- Windows installers are Authenticode-signed; macOS apps are signed with a Developer ID and notarized by Apple; Linux packages and repositories are GPG-signed, and Flatpaks are signed by Flathub.
- Desktop updates are verified against a public key built into the app before they install. An update that fails verification is discarded.
- The web app is served with a Content Security Policy that only allows its own origin; fonts and content are bundled, not loaded from third parties.
- Signing keys exist only in the CI secret store or the cloud signing service, never on a developer's machine.

## Verifying a download

Each release on the releases page lists a SHA-256 checksum for every file. On Linux and macOS run `shasum -a 256 <file>`; on Windows run `Get-FileHash <file>` in PowerShell, and compare with the published value.
