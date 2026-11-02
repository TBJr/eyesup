#!/usr/bin/env python3
"""Extract packages/content/en/words.txt from wordfreq large_en (EU-003).

Requires: pip install 'wordfreq==3.1.1'
Usage: python3 scripts/import-wordfreq-en.py
Then: node scripts/build-letter-model.mjs packages/content/en/words.txt packages/content/en/letter-model.json
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

from wordfreq import top_n_list, zipf_frequency

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "packages/content/en/words.txt"
BLOCKLIST = ROOT / "packages/content/en/blocklist.txt"
NAMES_URL = (
    "https://cdn.jsdelivr.net/gh/dominictarr/random-name@master/first-names.json"
)
TARGET = 10_000
VOWELS = set("aeiouy")
DROP_EXACT = {
    "mr",
    "mrs",
    "ms",
    "jr",
    "sr",
    "ll",
    "ve",
    "re",
    "nt",
    "www",
    "http",
    "https",
    "com",
    "org",
    "edu",
    "gov",
    "ko",
}
EXTRA_DROP = {
    "gerald",
    "greene",
    "hugo",
    "lambert",
    "mann",
    "myers",
    "heath",
    "barton",
    "nelson",
    "thompson",
    "anderson",
    "edwards",
    "collins",
    "stewart",
    "morris",
    "rogers",
    "richardson",
    "torres",
    "peterson",
    "ramirez",
    "henderson",
    "coleman",
    "jenkins",
    "patterson",
    "hughes",
    "flores",
    "gonzales",
    "bryant",
    "diaz",
    "hayes",
}
NAME_ALLOW = {
    "will",
    "may",
    "mark",
    "march",
    "april",
    "june",
    "august",
    "grace",
    "hope",
    "faith",
    "joy",
    "bill",
    "bob",
    "jack",
    "joe",
    "john",
    "mike",
    "tom",
    "james",
    "mary",
    "ann",
    "sue",
    "pat",
    "max",
    "sam",
    "ben",
    "kim",
    "lee",
    "ray",
    "kay",
    "jay",
    "robin",
    "chase",
    "brook",
    "lane",
    "penny",
    "dawn",
    "ginger",
    "holly",
    "iris",
    "ivy",
    "jade",
    "olive",
    "rose",
    "violet",
    "amber",
    "crystal",
    "pearl",
    "ruby",
    "summer",
    "winter",
    "autumn",
    "spring",
    "christian",
    "norman",
    "roman",
    "frank",
    "earl",
    "duke",
    "king",
    "queen",
    "prince",
    "brown",
    "white",
    "black",
    "green",
    "gray",
    "grey",
    "young",
    "long",
    "short",
    "little",
    "good",
    "best",
    "great",
    "rich",
    "strong",
    "wise",
    "true",
    "fair",
    "bright",
    "golden",
}


def main() -> None:
    with urllib.request.urlopen(NAMES_URL) as response:
        names = {n.lower() for n in json.load(response) if isinstance(n, str)}

    block: set[str] = set()
    for line in BLOCKLIST.read_text(encoding="utf-8").splitlines():
        token = line.strip().lower()
        if token and not token.startswith("#"):
            block.add(token)

    out: list[str] = []
    seen: set[str] = set()
    for word in top_n_list("en", 60_000, wordlist="large"):
        if len(out) >= TARGET:
            break
        if not word or not word.isascii() or not word.isalpha() or not word.islower():
            continue
        if len(word) == 1 and word not in {"a", "i"}:
            continue
        if not (1 <= len(word) <= 12):
            continue
        if word in block or word in DROP_EXACT or word in EXTRA_DROP:
            continue
        if not any(ch in VOWELS for ch in word):
            continue
        if (
            word in names
            and word not in NAME_ALLOW
            and zipf_frequency(word, "en") < 5.0
        ):
            continue
        if word in seen:
            continue
        seen.add(word)
        out.append(word)

    if len(out) < TARGET:
        raise SystemExit(f"only collected {len(out)} words; need {TARGET}")

    OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} words to {OUT}")


if __name__ == "__main__":
    main()
