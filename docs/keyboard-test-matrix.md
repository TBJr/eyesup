# Keyboard test matrix

Reading keystrokes correctly on every system is the riskiest part of EyesUp. Automated tests in Chromium, Firefox and WebKit catch most problems; this matrix covers what only real keyboards, real operating systems and real desktop web views can show. Gate D (desktop release) requires every applicable cell to pass.

**How to use it:** copy the results table into the release issue, run each test on each environment with each layout, and mark ✅ pass, ❌ fail (link the bug) or — not applicable. Record OS version, browser or app version, and the physical keyboard used.

## Tests

| ID | Test | Steps | Pass when |
| --- | --- | --- | --- |
| K01 | Letters | Type a line containing every letter | Every keystroke reports the expected `code` and `key`; finger and colour match the layout file |
| K02 | Shift | Type capitals with the opposite-hand Shift | Shifted characters match the layout's `shift` values |
| K03 | Digits and symbols | Type the digit row with and without Shift | Characters match the layout file |
| K04 | Dead keys | AZERTY: ^ then e; ¨ then i; ^ then Space | Shows ê, ï, ^; each scored once as two keystrokes |
| K05 | AltGr | AZERTY: AltGr+0 (@), AltGr+E (€); UK: AltGr+4 (€) | Correct character; Ctrl shortcuts not triggered |
| K06 | Caps Lock | Turn Caps Lock on mid-line | Warning appears before the first wrong key; timer stops |
| K07 | Auto-repeat | Hold a letter key for 2 seconds | Only the first press is scored |
| K08 | Browser shortcuts | In practice: press Space, Backspace, ' and / | Page doesn't scroll; Firefox quick-find doesn't open; Backspace never navigates back |
| K09 | Peek | Hold Ctrl (Control on macOS) during a line | Full keyboard appears while held; keystrokes logged as guided; Ctrl+C still works outside the typing surface |
| K10 | Pause on blur | Switch to another window mid-line | Session pauses; time away isn't counted |
| K11 | Hidden tab | Switch browser tab (web only) | Session pauses |
| K12 | Input method | Turn on an IME (e.g. a Japanese input source) | Notice appears; scoring stops; nothing crashes |
| K13 | Rollover timing | Type a fast word with overlapping keys | Keyup times recorded; rollover share above 0 in the debug log |
| K14 | Latency | Run the latency harness for 60 seconds | Keystroke to paint under 16 ms at the 95th percentile |
| K15 | Layout detection | Fresh profile, type probe A | Detected layout matches the system layout |
| K16 | Layout switch mid-session | Change the system layout during a line | Mismatch dialog appears after 3 mismatched keys |
| K17 | Numeric keypad | Full-size keyboard: type digits on the keypad | `Numpad*` codes read correctly (Numbers overlay only) |
| K18 | Hands-ready gate | Press F and J together; then press them 300 ms apart | Together starts the session; apart shows a gentle retry hint |

## Environments

| ID | System | Runs |
| --- | --- | --- |
| W1 | Windows 11, current | Edge, Chrome, Firefox, desktop app (MSI) |
| W2 | Windows 10 22H2 | Edge, desktop app (NSIS) |
| M1 | macOS, current, Apple silicon | Safari, Chrome, Firefox, desktop app |
| M2 | macOS 12, Intel | Safari, desktop app |
| U1 | Ubuntu 24.04 LTS (GNOME, Wayland) | Chrome, Firefox, desktop .deb, AppImage, Flatpak |
| U2 | Ubuntu 22.04 LTS (X11) | Firefox, desktop .deb |
| K1 | Kali Linux, current (Xfce) | Firefox, desktop .deb |
| F1 | Fedora, current (GNOME) | Firefox, desktop .rpm, Flatpak |
| D1 | Debian 12 | Firefox, desktop .deb |

Layouts per environment: QWERTY US on all; QWERTY UK and AZERTY FR on at least W1, M1 and U1.

## Results table (copy per release)

| Test | W1 | W2 | M1 | M2 | U1 | U2 | K1 | F1 | D1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| K01 Letters | | | | | | | | | |
| K02 Shift | | | | | | | | | |
| K03 Digits and symbols | | | | | | | | | |
| K04 Dead keys | | | | | | | | | |
| K05 AltGr | | | | | | | | | |
| K06 Caps Lock | | | | | | | | | |
| K07 Auto-repeat | | | | | | | | | |
| K08 Browser shortcuts | | | | | | | | | |
| K09 Peek | | | | | | | | | |
| K10 Pause on blur | | | | | | | | | |
| K11 Hidden tab | | | | | | | | | |
| K12 Input method | | | | | | | | | |
| K13 Rollover timing | | | | | | | | | |
| K14 Latency | | | | | | | | | |
| K15 Layout detection | | | | | | | | | |
| K16 Layout switch | | | | | | | | | |
| K17 Numeric keypad | | | | | | | | | |
| K18 Hands-ready gate | | | | | | | | | |

Release: ______ · Tested by: ______ · Date: ______
