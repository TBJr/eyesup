import { describe, expect, it } from 'vitest';
import { placeLearner, type PlacementInput } from './placement.js';
import { DEFAULT_GOAL_WPM, FLUENCY_DEFAULT_GOAL_WPM } from './params.js';

function base(partial: Partial<PlacementInput>): PlacementInput {
  return {
    blindAccuracy: 0.5,
    homeScore: 1,
    sightedWpm: 20,
    blindWpm: 10,
    q2: 1,
    ...partial,
  };
}

describe('placement (EU-010, C6–C8, D2.1 — all tracks)', () => {
  const profiles: Array<{
    name: string;
    input: PlacementInput;
    placed: string;
    active: string;
    goal: number;
  }> = [
    {
      name: 'foundations clear',
      input: base({ sightedWpm: 20, blindAccuracy: 0.5, homeScore: 1, q2: 1 }),
      placed: 'foundations',
      active: 'foundations',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'retrain clear',
      input: base({ sightedWpm: 40, blindAccuracy: 0.5, homeScore: 1, q2: 2 }),
      placed: 'retrain',
      active: 'retrain',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'adaptive clear',
      input: base({
        blindAccuracy: 0.9,
        homeScore: 4,
        sightedWpm: 40,
        blindWpm: 25,
        q2: 3,
      }),
      placed: 'adaptive',
      active: 'adaptive',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'fluency clear',
      input: base({
        blindAccuracy: 0.95,
        homeScore: 4,
        sightedWpm: 50,
        blindWpm: 45,
        q2: 4,
      }),
      placed: 'fluency',
      active: 'fluency',
      goal: FLUENCY_DEFAULT_GOAL_WPM,
    },
    {
      name: 'sighted tie → foundations via q2',
      input: base({ sightedWpm: 30, blindAccuracy: 0.4, homeScore: 1, q2: 1 }),
      placed: 'foundations',
      active: 'foundations',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'sighted tie → retrain via q2',
      input: base({ sightedWpm: 30 * 1.02, blindAccuracy: 0.4, homeScore: 1, q2: 2 }),
      placed: 'retrain',
      active: 'retrain',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'home-row tie → adaptive via q2',
      input: base({
        blindAccuracy: 0.8,
        homeScore: 3,
        sightedWpm: 40,
        blindWpm: 20,
        q2: 3,
      }),
      placed: 'adaptive',
      active: 'adaptive',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'home-row edge low → q2 foundations',
      input: base({
        blindAccuracy: 0.8 * 0.96,
        homeScore: 3,
        sightedWpm: 25,
        blindWpm: 15,
        q2: 1,
      }),
      placed: 'foundations',
      active: 'foundations',
      goal: DEFAULT_GOAL_WPM,
    },
    {
      name: 'fluency speed tie → q2 fluency',
      input: base({
        blindAccuracy: 0.9,
        homeScore: 4,
        sightedWpm: 40,
        blindWpm: 35,
        q2: 4,
      }),
      placed: 'fluency',
      active: 'fluency',
      goal: FLUENCY_DEFAULT_GOAL_WPM,
    },
    {
      name: 'fluency ratio borderline → adaptive',
      input: base({
        blindAccuracy: 0.9,
        homeScore: 4,
        sightedWpm: 50,
        blindWpm: 36,
        q2: 3,
      }),
      placed: 'adaptive',
      active: 'adaptive',
      goal: DEFAULT_GOAL_WPM,
    },
  ];

  it.each(profiles)('$name', ({ input, placed, active, goal }) => {
    const result = placeLearner(input);
    expect(result.placedTrack).toBe(placed);
    expect(result.activeTrack).toBe(active);
    expect(result.goalWpm).toBe(goal);
  });
});
