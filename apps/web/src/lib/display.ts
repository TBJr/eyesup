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
}

export const DEFAULT_ACCESS: AccessProfile = {
  textSizePx: 28,
  theme: 'light',
  reducedMotion: false,
  sound: false,
};
