export type Route =
  | 'welcome'
  | 'orient'
  | 'questions'
  | 'probe-a'
  | 'probe-b'
  | 'result'
  | 'today'
  | 'practice'
  | 'progress'
  | 'library'
  | 'settings'
  | 'device'
  | 'desktop-import';

const DESTINATIONS: Route[] = [
  'today',
  'practice',
  'progress',
  'library',
  'settings',
];

const KNOWN: Route[] = [
  'welcome',
  'orient',
  'questions',
  'probe-a',
  'probe-b',
  'result',
  'today',
  'practice',
  'progress',
  'library',
  'settings',
  'device',
  'desktop-import',
];

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  // Empty hash → welcome so first paint is never a destination without a profile.
  if (!raw) return 'welcome';
  const route = raw as Route;
  return KNOWN.includes(route) ? route : 'welcome';
}

/** Touch-first device with no fine pointer / hover — soft keyboard hand-off (EU-041). */
export function isTouchFirstDevice(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return (
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(hover: hover)').matches
  );
}

export function navigate(route: Route): void {
  window.location.hash = `#/${route}`;
}

export function isDestination(route: Route): boolean {
  return DESTINATIONS.includes(route);
}
