# French content sources

Every word list, corpus, phrase set and code snippet used for French practice text is listed here before it is committed. See [the content style guide](../../../docs/content-style-guide.md).

| File | What it is | Source | Licence | Added | Checked by |
| --- | --- | --- | --- | --- | --- |
| `words.txt` | Everyday French practice words (~1,500), ASCII a–z only, unaccented for keyboard drills | Written in-house from common vocabulary for the MVP | Project licence | 2026-11-03 | Agent (EU-036) |
| `letter-model.json` | Order-3 letter model for pseudo-words, built from `words.txt` | Derived from `words.txt` | Project licence | 2026-11-03 | |
| `phrases.txt` | Everyday unaccented French sentences for the Chunk stage | Written in-house | Project licence | 2026-11-03 | |
| `blocklist.txt` | Words and fragments never shown | Written in-house | Project licence | 2026-11-03 | |

## Word list filter (EU-036)

Keep tokens that are:

- ASCII lowercase `a–z` only (accents stripped for practice simplicity on AZERTY base letters)
- Length 1–12
- Contain at least one vowel (`a e i o u y`)
- Not on `blocklist.txt`

## Later replacement

A frequency-ranked French list from [wordfreq](https://github.com/rspeer/wordfreq) (`fr`) can replace `words.txt` later, with the same filter and attribution as the English pack. That needs product-owner approval and an update to this file before import.
