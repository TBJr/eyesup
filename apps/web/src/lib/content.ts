import { parseLayout, type Layout, type LetterModel } from '@eyesup/engine';
import qwertyUs from '../../../../packages/layouts/qwerty-us.json';
import qwertyUk from '../../../../packages/layouts/qwerty-uk.json';
import azertyFr from '../../../../packages/layouts/azerty-fr.json';
import enLetterModelJson from '../../../../packages/content/en/letter-model.json';
import enWordsRaw from '../../../../packages/content/en/words.txt?raw';
import enBlocklistRaw from '../../../../packages/content/en/blocklist.txt?raw';
import enPhrasesRaw from '../../../../packages/content/en/phrases.txt?raw';
import frLetterModelJson from '../../../../packages/content/fr/letter-model.json';
import frWordsRaw from '../../../../packages/content/fr/words.txt?raw';
import frBlocklistRaw from '../../../../packages/content/fr/blocklist.txt?raw';
import frPhrasesRaw from '../../../../packages/content/fr/phrases.txt?raw';

export const LAYOUTS: Record<string, Layout> = {
  'qwerty-us': parseLayout(qwertyUs),
  'qwerty-uk': parseLayout(qwertyUk),
  'azerty-fr': parseLayout(azertyFr),
};

export type ContentLanguage = 'en' | 'fr';

export interface ContentPack {
  language: ContentLanguage;
  letterModel: LetterModel;
  wordList: string[];
  blocklist: string[];
  phrases: string[];
}

export function loadLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

const PACKS: Record<ContentLanguage, ContentPack> = {
  en: {
    language: 'en',
    letterModel: enLetterModelJson as LetterModel,
    wordList: loadLines(enWordsRaw),
    blocklist: loadLines(enBlocklistRaw),
    phrases: loadLines(enPhrasesRaw),
  },
  fr: {
    language: 'fr',
    letterModel: frLetterModelJson as LetterModel,
    wordList: loadLines(frWordsRaw),
    blocklist: loadLines(frBlocklistRaw),
    phrases: loadLines(frPhrasesRaw),
  },
};

/** Resolve practice content for a layout language (default English). */
export function getContentPack(language: string | undefined | null): ContentPack {
  if (language === 'fr') return PACKS.fr;
  return PACKS.en;
}

/** Content for a layout id, falling back to English. */
export function getContentPackForLayout(layoutId: string | undefined | null): ContentPack {
  const layout = layoutId ? LAYOUTS[layoutId] : undefined;
  return getContentPack(layout?.language);
}

/** @deprecated Prefer getContentPack — kept for existing English-default imports. */
export const letterModel = PACKS.en.letterModel;
/** @deprecated Prefer getContentPack */
export const wordList = PACKS.en.wordList;
/** @deprecated Prefer getContentPack */
export const blocklist = PACKS.en.blocklist;
