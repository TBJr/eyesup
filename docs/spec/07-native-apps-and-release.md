# Native apps and release

## Platform matrix

Every computer OS gets EyesUp: native installers for Windows, macOS and the major Linux families, and the installable web app everywhere else. Tauri's own docs list Debian, RPM, AppImage, Flatpak, Snap and AUR as Linux distribution formats ([Tauri: Distribute](https://v2.tauri.app/fr/distribute/)).

| Platform | Web view inside the app | Package | Distribution |
| --- | --- | --- | --- |
| Windows 10 and 11 (x64, ARM64) | WebView2 (Chromium) | MSI and NSIS installer | Direct download; winget and Microsoft Store later |
| macOS (Apple silicon and Intel) | WKWebView (WebKit) | Universal .app in a DMG, notarized | Direct download; Mac App Store optional later |
| Ubuntu, Debian, Kali, Mint, Pop!\_OS | WebKitGTK | .deb | Direct download, then an apt repository |
| Fedora, RHEL, openSUSE | WebKitGTK | .rpm | Direct download, then a dnf repository |
| Arch, Manjaro | WebKitGTK | AUR package | AUR |
| Any Linux distribution | WebKitGTK (bundled or from runtime) | AppImage, Flatpak | Flathub; AppImage download |
| ChromeOS | Browser | Installable web app | Web |
| FreeBSD and others | Browser | Installable web app | Web |

Kali is Debian-based, so the .deb covers it; it is still tested separately because its default desktop and keyboard setup differ from Ubuntu's.

## Shell specifics and the Electron fallback

Tauri uses each OS's own web view, so the desktop app runs on Chromium (Windows) and WebKit (macOS, Linux). The interface must therefore be tested on WebKit from day one, not only in Chrome.

What to verify in the Phase 3 spike, on real hardware:

- `event.code` values on Linux WebKitGTK with UK and AZERTY keyboards, plus dead keys and AltGr.
- Keystroke-to-paint latency on a low-end Linux laptop.
- Font rendering and the keyboard illustration at 100%, 150% and 200% scaling.
- How AppImage and Flatpak carry WebKitGTK.

**Fallback rule:** if the keyboard matrix shows input bugs on WebKitGTK that cannot be worked around, ship that platform (or all three) on Electron, which bundles the same Chromium everywhere. Because the interface is a plain web build and the engine never touches the DOM, the swap is limited to `apps/desktop`: the storage adapter, the updater and packaging. Rough effort: one to two weeks.

## Signing, updates and CI

Unsigned installers trigger scary warnings on Windows and are blocked by default on macOS, so signing is part of Phase 3, not an afterthought.

| Platform | Signing | Without it |
| --- | --- | --- |
| Windows | Authenticode code-signing certificate | SmartScreen "unknown publisher" warning |
| macOS | Developer ID certificate plus Apple notarization | Gatekeeper refuses to open the app normally |
| Linux | GPG-signed packages and repository metadata; Flathub signs Flatpaks | Package managers warn or refuse |

- **Updates:** desktop uses the Tauri updater with signed update manifests on static hosting (for example GitHub Releases). The web app updates through its service worker with a "new version ready" prompt between sessions, never mid-session.
- **CI build matrix (GitHub Actions):** a Linux runner builds .deb, .rpm and AppImage (use the oldest supported Ubuntu image: an older glibc means the binary runs on more distributions); a macOS runner builds the universal DMG; a Windows runner builds MSI and NSIS.
- **Release flow:** tag → tests → builds → sign → upload → update manifest. Web and desktop share one version number (SemVer).

1. **Tag a release** (`vX.Y.Z` on `main`).
2. **Tests:** engine unit tests, Playwright end to end, bundle size check, `npm audit` and `cargo audit`. Any red check stops the release.
3. **Build, one runner per OS:** Linux on the oldest supported Ubuntu LTS (.deb, .rpm, AppImage, Flatpak manifest); macOS universal binary for Apple silicon and Intel (.app in a DMG); Windows MSI and NSIS installers (x64 and ARM64).
4. **Sign:** GPG for Linux packages and repository metadata (Flathub signs the Flatpak); Developer ID code signature, then Apple notarization and stapling; Authenticode through Azure Artifact Signing, where keys never leave the cloud.
5. **Publish:** GitHub Releases, signed update manifest, Microsoft Store, Flathub pull request, apt, dnf and AUR, web app to the static host. Apps offer the update between sessions, never during one.

Signing keys live only in CI secrets or the cloud signing service, never on a laptop. Each step needs the one before it to pass, so a release is all platforms or none.

## Desktop-only features

The desktop apps match the web app screen for screen and add only what a native shell does better:

- Works fully offline from first launch.
- Opt-in daily practice reminder through OS notifications.
- Larger local history in SQLite, with CSV and JSON export.
- Remembers window size and position; full-screen practice mode.

Deliberately excluded: anything that reads keys outside the EyesUp window, such as tracking real-world typing in other apps. Transfer to daily typing is handled by check-ins and own-text practice instead.
