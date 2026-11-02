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
  | 'settings';

const DESTINATIONS: Route[] = [
  'today',
  'practice',
  'progress',
  'library',
  'settings',
];

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  const route = (raw || 'today') as Route;
  const known: Route[] = [
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
  ];
  return known.includes(route) ? route : 'today';
}

export function navigate(route: Route): void {
  window.location.hash = `#/${route}`;
}

export function isDestination(route: Route): boolean {
  return DESTINATIONS.includes(route);
}
