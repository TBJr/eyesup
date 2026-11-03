import type { AccessProfile } from '../storage/types.js';

export function applyDisplaySettings(access: AccessProfile): void {
  const root = document.documentElement;
  root.style.setProperty('--practice-font-size', `${access.textSizePx}px`);
  if (access.theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (access.theme === 'high-contrast') {
    root.setAttribute('data-theme', 'high-contrast');
  } else {
    root.removeAttribute('data-theme');
  }
  if (access.reducedMotion) {
    root.setAttribute('data-reduced-motion', 'true');
  } else {
    root.removeAttribute('data-reduced-motion');
  }
  if (access.font === 'dyslexia') {
    root.setAttribute('data-font', 'dyslexia');
    root.style.setProperty('--practice-letter-spacing', '0.08em');
    root.style.setProperty('--practice-word-spacing', '0.16em');
  } else {
    root.removeAttribute('data-font');
    root.style.removeProperty('--practice-letter-spacing');
    root.style.removeProperty('--practice-word-spacing');
  }
  if (access.fingerMap) {
    root.setAttribute('data-finger-map', access.fingerMap);
  } else {
    root.removeAttribute('data-finger-map');
  }
}

export const DEFAULT_ACCESS: AccessProfile = {
  textSizePx: 28,
  theme: 'light',
  reducedMotion: false,
  sound: false,
};
