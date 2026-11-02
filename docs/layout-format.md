# Keyboard layout format

A layout file tells EyesUp three things about one keyboard layout: which finger presses each physical key, what each key types, and the order the keys are taught. The on-screen keyboard, the hand guide, the finger colours and the lessons are all drawn from this file, so a new layout needs no code.

Files live in `packages/layouts/<id>.json` and must pass both the JSON Schema (`packages/layouts/schema/layout.schema.json`) and the validator:

```bash
node scripts/validate-layouts.mjs
```

## Shipped layouts

| File | Layout | Standard | Learnable keys |
| --- | --- | --- | --- |
| `qwerty-us.json` | English (US) QWERTY | ANSI | 51 |
| `qwerty-uk.json` | English (UK) QWERTY | ISO | 52 |
| `azerty-fr.json` | French AZERTY | ISO | 52 |

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Lowercase, hyphenated, same as the file name: `qwerty-us` |
| `name` | Yes | Name shown to learners: "English (US) QWERTY" |
| `language` | Yes | Language of the practice content: `en`, `fr` |
| `standard` | Yes | Physical arrangement: `ANSI`, `ISO` or `JIS` |
| `fingerprint` | Yes | At least three physical keys and the character each produces; used to detect the layout from live typing |
| `keys` | Yes | Every key on the board, described below |
| `learnOrder` | Yes | Groups of keys, taught one group at a time |
| `deadKeys` | If the layout has dead keys | What each accent produces with the following key |

## Keys

Each key is identified by its **physical position**, using the `KeyboardEvent.code` names from the UI Events specification (`KeyF`, `Semicolon`, `IntlBackslash`). On an AZERTY board the key labelled A still has the code `KeyQ`, because it sits where Q sits on QWERTY. This is what lets finger assignment stay the same across layouts.

| Field | Required | Meaning |
| --- | --- | --- |
| `code` | Yes | Physical key, e.g. `KeyQ` |
| `row` | Yes | 0 = number row, 1 = top letters, 2 = home row, 3 = bottom letters, 4 = space row |
| `width` | Yes | Width in key units (a letter key is 1) |
| `rowSpan` | No | `2` for the ISO Enter key, which covers rows 1 and 2 |
| `finger` | Yes | `L1`–`L4` and `R1`–`R4` (1 index, 2 middle, 3 ring, 4 little) or `T` for thumb |
| `base` | No | Character typed without modifiers |
| `shift` | No | Character typed with Shift |
| `altGr` | No | Character typed with AltGr (Right Alt; Option on macOS layouts) |
| `home` | No | `true` on the resting key of each finger; exactly one per finger |
| `bump` | No | `true` on the two keys with tactile bumps; always `KeyF` and `KeyJ` |
| `learn` | No | `false` for keys that are never drilled: Tab, Caps Lock, Backspace |

**Character values.** A single character, a control name (`Shift`, `CapsLock`, `\n` for Enter, `\t` for Tab, `\b` for Backspace), or `Dead:<accent>` for a dead key. Example: AZERTY `BracketLeft` has `"base": "Dead:^"`.

**Finger colours.** The interface colours each key by the number in its finger: 1 index, 2 middle, 3 ring, 4 little, matching the design tokens. Both hands share colours; the number is drawn on the key so colour is never the only cue.

## Learn order

`learnOrder` is a list of groups. Each group is introduced together on one unlock card.

Rules, enforced by the validator:

1. Every key without `"learn": false` appears exactly once.
2. The first group contains `KeyF` and `KeyJ` (and `Space`, pressed by the thumbs from lesson one).
3. Only keys present in `keys` may be listed.

Guidelines for writing the order:

- Home row first, outward from the index fingers: F J, D K, S L, then the little-finger home keys.
- Pair mirrored keys (same finger, same reach, both hands) so each unlock teaches one movement twice.
- After the home row, introduce the most frequent letters of the layout's language first. Real words should become possible within the first 4–5 groups.
- Shift comes after all letters; then punctuation needed for sentences; then digits (index-finger digits first); then the remaining symbols.
- On layouts where digits need Shift (AZERTY), introduce the most common digit-row characters (é, è, ç, à) before the digits themselves.

## Fingerprint

At least three keys whose characters differ between common layouts. The input adapter compares what learners actually type against each installed layout's fingerprint. `KeyQ`, `KeyY` and `KeyE` separate QWERTY, QWERTZ, AZERTY, Dvorak and Colemak; add keys such as `Quote` and `Backslash` to separate regional variants (US and UK QWERTY differ there).

## Dead keys

```json
"deadKeys": {
  "^": { "a": "â", "e": "ê", "i": "î", "o": "ô", "u": "û", " ": "^" }
}
```

The input adapter holds a dead keystroke until the next one arrives and scores the composed character once, as two keystrokes. A space after the accent types the accent itself.

## Adding a layout

1. Copy the closest existing file and change `id`, `name`, `language` and `standard`.
2. Update `base`, `shift` and `altGr` for every key that differs. Leave `code`, `row`, `width` and `finger` alone unless the physical board differs.
3. Write the fingerprint and the learn order.
4. Add `deadKeys` if any key value starts with `Dead:`.
5. Run `node scripts/validate-layouts.mjs`.
6. Add a column for the layout to the [keyboard test matrix](keyboard-test-matrix.md) and run the input rows on a real keyboard set to that layout.
7. Add practice content for the language if it is new (see the [content style guide](content-style-guide.md)).
