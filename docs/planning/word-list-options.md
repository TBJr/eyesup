# English frequency word-list options

Phase 0 needs a licensed ~10,000-word English frequency list for practice text (D0.3 / EU-003). Until you choose one, the repo ships `packages/content/en/words.seed.txt` (about 1,000 in-house words) as a placeholder.

This document compares three openly usable sources. None have been imported yet.

## Options

### 1. Google 10,000 English words (norvig / related redistributions)

- **What:** Frequency-ranked common English words widely redistributed for NLP demos.
- **Typical source page:** Peter Norvig's "Natural Language Corpus Data" materials and community mirrors of a 10k English word list derived from public web counts.
- **Licence:** Often treated as freely usable count data; confirm the exact mirror's terms before import. Prefer a copy that states public-domain dedication or CC0.
- **Attribution:** Credit the chosen mirror and methodology in `SOURCES.md`.
- **Fit with GPL-3 repo:** Compatible if the list is public domain / CC0 / permissive. Avoid mirrors that claim restrictive "research only" terms.
- **Pros:** Right size; frequency order; simple one-word-per-line file.
- **Cons:** Provenance can be fuzzy across mirrors; must verify licence on the exact file.

### 2. Wordfreq / Exquisite Corpus (LuminosoInsight)

- **What:** Multilingual frequency data used by the `wordfreq` project.
- **Licence:** Typically **Apache-2.0** or similar for code; **check the data files** (often Creative Commons or project-specific). Confirm the data licence in the release you would copy.
- **Attribution:** Required under Apache/CC as applicable.
- **Fit with GPL-3:** Apache-2.0 data/code can be used alongside GPL-3 application code; keep the list's licence notice in `SOURCES.md`.
- **Pros:** Careful methodology; documented; maintained.
- **Cons:** Heavier packaging; must extract a clean lowercase 10k list and drop proper nouns we do not want.

### 3. Wiktionary frequency lists / Wikimedia dumps (filtered)

- **What:** Community frequency lists derived from Wikimedia project text.
- **Licence:** List text typically under **CC BY-SA**; Wikimedia content licences apply to sourced material.
- **Attribution:** Required (BY); share-alike may affect how modified lists are published.
- **Fit with GPL-3:** CC BY-SA is workable with attribution, but share-alike obligations on the list file itself must be respected (keep the list under BY-SA even though app code is GPL-3).
- **Pros:** Transparent community source.
- **Cons:** Noisier; more filtering; BY-SA on the data file.

## Recommendation

**Prefer option 2 (Wordfreq / Exquisite Corpus data)** if its data licence is Apache-2.0 or CC0/CC BY for the extracted English list: clear provenance, documented method, and straightforward attribution in `SOURCES.md`.

If you want the simplest path with the fewest licence questions, **prefer a Norvig-style 10k list only from a mirror that is explicitly CC0 or public domain** (option 1, verified).

Do **not** import any list until you reply with the choice and "import it" or "keep the seed list for now".

## Decision needed

Reply with one of:

1. `Wordfreq — import it` (and point me at the exact release URL), or
2. `Norvig-style 10k — import it` (exact URL), or
3. `Wiktionary frequency — import it` (exact URL), or
4. `Keep the seed list for now`.
