import { parseLayout, type Layout, type LetterModel } from '@eyesup/engine';
import qwertyUs from '../../../../packages/layouts/qwerty-us.json';
import qwertyUk from '../../../../packages/layouts/qwerty-uk.json';
import azertyFr from '../../../../packages/layouts/azerty-fr.json';
import letterModelJson from '../../../../packages/content/en/letter-model.json';
import wordsRaw from '../../../../packages/content/en/words.txt?raw';
import blocklistRaw from '../../../../packages/content/en/blocklist.txt?raw';

export const LAYOUTS: Record<string, Layout> = {
  'qwerty-us': parseLayout(qwertyUs),
  'qwerty-uk': parseLayout(qwertyUk),
  'azerty-fr': parseLayout(azertyFr),
};

export const letterModel = letterModelJson as LetterModel;

export const wordList = wordsRaw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

export const blocklist = blocklistRaw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

export function loadLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}
