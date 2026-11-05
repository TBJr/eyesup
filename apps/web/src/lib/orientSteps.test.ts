import { describe, expect, it } from 'vitest';
import {
  ORIENT_DRILL_CODES,
  ORIENT_NAV_COUNT,
  ORIENT_TRY_CODES,
  advanceOrientKey,
  canGoNext,
  createOrientState,
  drillProgress,
  expectedOrientCode,
  goBack,
  goNext,
  orientKeyGlyph,
  type OrientState,
} from './orientSteps';

describe('orientSteps design 06', () => {
  it('defines four nav phases, a six-key drill, and three try keys', () => {
    expect(ORIENT_NAV_COUNT).toBe(4);
    expect([...ORIENT_DRILL_CODES]).toEqual([
      'KeyF',
      'KeyJ',
      'KeyD',
      'KeyK',
      'KeyS',
      'KeyL',
    ]);
    expect([...ORIENT_TRY_CODES]).toEqual(['KeyE', 'KeyR', 'KeyO']);
  });

  it('starts on Sit waiting for Space', () => {
    const s = createOrientState();
    expect(s.navPhase).toBe(0);
    expect(expectedOrientCode(s)).toBe('Space');
    expect(canGoNext(s)).toBe(false);
  });

  it('unlocks Next after Space, then Enter moves to Bumps', () => {
    let s = createOrientState();
    const r = advanceOrientKey(s, 'Space');
    expect(r.kind).toBe('state');
    if (r.kind !== 'state') return;
    s = r.state;
    expect(s.sitReady).toBe(true);
    expect(canGoNext(s)).toBe(true);
    const n = goNext(s);
    expect(n.kind).toBe('state');
    if (n.kind !== 'state') return;
    expect(n.state.navPhase).toBe(1);
    expect(expectedOrientCode(n.state)).toBe('KeyF');
  });

  it('counts F then J as presses 1–2 and auto-enters Zones', () => {
    let s: OrientState = { ...createOrientState(), navPhase: 1, sitReady: true };
    let r = advanceOrientKey(s, 'KeyF');
    expect(r.kind).toBe('state');
    if (r.kind !== 'state') return;
    s = r.state;
    expect(s.drillDone).toBe(1);
    expect(s.navPhase).toBe(1);
    expect(drillProgress(s).doneCodes).toEqual(['KeyF']);

    r = advanceOrientKey(s, 'KeyJ');
    expect(r.kind).toBe('state');
    if (r.kind !== 'state') return;
    s = r.state;
    expect(s.drillDone).toBe(2);
    expect(s.navPhase).toBe(2);
    expect(expectedOrientCode(s)).toBe('KeyD');
    expect(drillProgress(s).current).toBe(3);
  });

  it('unlocks Next: Try it after all six drill keys', () => {
    let s: OrientState = {
      ...createOrientState(),
      navPhase: 2,
      sitReady: true,
      drillDone: 2,
    };
    for (const code of ['KeyD', 'KeyK', 'KeyS', 'KeyL']) {
      const r = advanceOrientKey(s, code);
      expect(r.kind).toBe('state');
      if (r.kind !== 'state') return;
      s = r.state;
    }
    expect(s.drillDone).toBe(6);
    expect(canGoNext(s)).toBe(true);
    const n = goNext(s);
    expect(n.kind).toBe('state');
    if (n.kind !== 'state') return;
    expect(n.state.navPhase).toBe(3);
    expect(expectedOrientCode(n.state)).toBe('KeyE');
  });

  it('finishes Orient after E R O', () => {
    let s: OrientState = {
      ...createOrientState(),
      navPhase: 3,
      sitReady: true,
      drillDone: 6,
      tryDone: 0,
    };
    for (const code of ['KeyE', 'KeyR']) {
      const r = advanceOrientKey(s, code);
      expect(r.kind).toBe('state');
      if (r.kind !== 'state') return;
      s = r.state;
    }
    expect(advanceOrientKey(s, 'KeyO')).toEqual({ kind: 'done' });
  });

  it('ignores wrong keys and supports goBack', () => {
    const s: OrientState = {
      ...createOrientState(),
      navPhase: 2,
      sitReady: true,
      drillDone: 2,
    };
    expect(advanceOrientKey(s, 'KeyF')).toEqual({ kind: 'noop' });
    expect(goBack(s).navPhase).toBe(1);
  });

  it('maps key glyphs for chips', () => {
    expect(orientKeyGlyph('KeyD')).toBe('D');
    expect(orientKeyGlyph('Space')).toBe('Space');
  });
});
