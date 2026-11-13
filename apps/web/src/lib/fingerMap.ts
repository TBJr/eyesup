import type { Finger, Layout, LayoutKey } from '@eyesup/engine';

export type FingerMapId = 'default' | 'one-hand-left' | 'one-hand-right' | 'reduced';

function mirrorHand(finger: Finger, toLeft: boolean): Finger {
  if (finger === 'T') return 'T';
  const n = finger.slice(1);
  return `${toLeft ? 'L' : 'R'}${n}` as Finger;
}

function reduceFinger(finger: Finger): Finger {
  if (finger === 'T') return 'T';
  const hand = finger[0];
  const n = Number(finger.slice(1));
  // Map little/ring onto middle; keep index.
  if (n >= 3) return `${hand}2` as Finger;
  return finger;
}

function remapFinger(finger: Finger, map: FingerMapId): Finger {
  if (map === 'default') return finger;
  if (map === 'one-hand-left') return mirrorHand(finger, true);
  if (map === 'one-hand-right') return mirrorHand(finger, false);
  return reduceFinger(finger);
}

/**
 * Return a layout copy with finger assignments remapped for access profiles (EU-040).
 * Does not mutate the source layout object.
 */
export function layoutWithFingerMap(layout: Layout, map: FingerMapId | string | undefined): Layout {
  const id = (map ?? 'default') as FingerMapId;
  if (id === 'default' || (id !== 'one-hand-left' && id !== 'one-hand-right' && id !== 'reduced')) {
    return layout;
  }
  const keys: LayoutKey[] = layout.keys.map((k) => ({
    ...k,
    finger: remapFinger(k.finger, id),
  }));
  return { ...layout, keys };
}
