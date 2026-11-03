# Desktop updater (EU-046)

EyesUp offers signed auto-updates **between sessions only** (never while typing). Until the product owner adds signing secrets, the desktop shell exposes stub commands so the web UI can keep that between-session flow without a live updater.

## Current milestone (unsigned)

| Piece | Behaviour |
| --- | --- |
| Rust | `check_for_update` / `apply_update` stubs return `updates require signing secrets` |
| Web | `apps/web/src/lib/desktopUpdate.ts` polls; `App.svelte` shows the update banner on Today / session summary only |
| Plugin | `tauri-plugin-updater` is **not** linked — Tauri requires a real minisign pubkey to verify artifacts, and empty placeholders still trip signing during `createUpdaterArtifacts` builds |

Gate the real updater with CI secrets and a documented config flip (below). Do not ship unsigned “updates” that a learner could confuse with verified ones.

## Enable signed updates (product owner + engineer)

1. Generate a keypair (never commit the private key):

```bash
pnpm --filter @eyesup/desktop tauri signer generate -w ~/.tauri/eyesup.key
```

2. Put the **public** key contents into `apps/desktop/src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "<PASTE_PUBLIC_KEY>",
      "endpoints": [
        "https://github.com/TBJr/eyesup/releases/latest/download/latest.json"
      ]
    }
  }
}
```

3. Add CI secrets (names only; see [release-runbook.md](release-runbook.md)):
   - `TAURI_SIGNING_PRIVATE_KEY`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (if the key is encrypted)

4. Add the crate and wire the plugin in `apps/desktop/src-tauri`:

```toml
# Cargo.toml
tauri-plugin-updater = "2"
```

```rust
// lib.rs setup
app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
```

Replace the stub commands with plugin `check` / `download_and_install`, or keep thin wrappers that call the plugin. Grant updater permissions in `capabilities/default.json` per [Tauri updater docs](https://v2.tauri.app/plugin/updater/).

5. Set `EYESUP_UPDATER_ENABLED=1` (or equivalent) in the release workflow only when the pubkey is real — keep local `tauri dev` on the stub so unsigned builds stay simple.

6. Publish a draft release that includes `latest.json` and `.sig` files (release workflow publish job).

## Between-session UX

- Poll or listen while the app is open; set a “update ready” flag.
- Show the banner on **Today** and on the practice **summary**, never during `typing` / line drills.
- **Enter** on Today (or Install) applies the update; **Later** dismisses until the next launch check.
- Web (non-Tauri) keeps using the service worker “new version ready” path.

## Tampered update test

See the **Tampered update test** section in [release-runbook.md](release-runbook.md).
