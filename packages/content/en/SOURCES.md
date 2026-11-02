# English content sources

Every word list, corpus, phrase set and code snippet used for English practice text is listed here before it is committed. See [the content style guide](../../../docs/content-style-guide.md).

| File | What it is | Source | Licence | Added | Checked by |
| --- | --- | --- | --- | --- | --- |
| `words.txt` | Frequency-ranked everyday English words (~10,000), filtered for practice | Extracted from [wordfreq](https://github.com/rspeer/wordfreq) `large_en` via `top_n_list('en', …, wordlist='large')` (Exquisite Corpus / multi-source snapshot through ~2021). Script: `scripts/import-wordfreq-en.py`. Attribution: Robyn Speer; also SUBTLEX (Marc Brysbaert et al.), OpenSubtitles, Wikipedia, Leeds Internet Corpus, ParaCrawl, Google Books Ngrams as listed in wordfreq `NOTICE.md`. | Data: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Code that produced it: Apache-2.0. This file remains under CC BY-SA 4.0. | 2026-11-02 | Agent (EU-003) |
| `words.seed.txt` | In-house placeholder word list (~1,000 common words) kept for reference | Written in-house | Project licence | 2026-11-02 | |
| `letter-model.json` | Order-3 letter model for pseudo-words, built from `words.txt` | Derived from `words.txt` | Same as `words.txt` (CC BY-SA 4.0) | 2026-11-02 | |
| `phrases.txt` | Everyday sentences for the Chunk stage | Written in-house | Project licence | 2026-11-02 | |
| `blocklist.txt` | Words and fragments never shown | Written in-house | Project licence | 2026-11-02 | |
| `code/` | Snippets for the Coder overlay | Written in-house | Project licence | | |

## Word list filter (EU-003)

From wordfreq English `large` list, keep tokens that are:

- ASCII lowercase `a–z` only (no digits, apostrophes, punctuation)
- Length 1–12 (`a` and `i` allowed as single letters)
- Contain at least one vowel (`a e i o u y`)
- Not on `blocklist.txt`
- Not a rare given name (first-name list match with Zipf frequency under 5.0, except a small allow-list of everyday words that are also names)

Take the first 10,000 tokens that pass, in frequency order.
