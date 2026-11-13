# Flatpak (Flathub intent)

Tauri 2 does **not** accept `"flatpak"` as a `bundle.targets` string. Supported targets remain `deb`, `rpm`, `appimage`, `msi`, `nsis`, `app`, and `dmg` (see [Tauri config](https://v2.tauri.app/reference/config/)).

EyesUp still ships Flatpak via Flathub as a **post-deb** packaging step (EU-044 / D3.1):

1. CI builds the unsigned `.deb` on Ubuntu 22.04 (see `.github/workflows/release.yml`).
2. A Flathub / `flatpak-builder` manifest (to be filled when store submission starts) unpacks that `.deb` into `/app` — follow [Tauri’s Flatpak guide](https://v2.tauri.app/distribute/flatpak/).
3. The product owner opens the Flathub PR; Flathub signs the Flatpak. No signing secrets belong in this repo.

`app.eyesup.desktop.yml` is a stub only. Do not treat it as a buildable Flathub submission until identifiers, runtime version, and release `.deb` URL/sha256 are filled by a person.
