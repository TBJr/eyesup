# Phase 2 report (in progress)

**Date:** 2026-11-03  
**Branch:** `phase-2`

## Delivered on this branch

| Story | Status |
| --- | --- |
| EU-031 Retrain / crossover | Engine projection + Today/Progress UI |
| EU-032 Commit week / eyes-up points | Engine gates + Today check-in; points helper |
| EU-033 Fluency | Track-aware scheduler (pair drills, metronome, rollover kinds) |
| EU-036 AZERTY + French | `packages/content/fr`, `strings/fr.json`, content pack switch |
| EU-037 Progress | Heatmap, history, milestones, crossover |
| EU-039 Own text | Storage CRUD + Library UI |
| EU-041 Public site / device | `site-public/index.html`, Pages workflow, `#/device` hand-off |
| EU-034/035/038/040 | Deferred or minimal (Could/Should); overlays and ghost race not fully polished |

## Defaults chosen (open PO questions)

- Retrain: merge size 2 after first 4 groups (`RETRAIN_GROUP_MERGE_SIZE`)
- Fluency: default goal 40 WPM (`FLUENCY_DEFAULT_GOAL_WPM`)

## Gate C

- WCAG smoke: Playwright + axe on welcome (`tests/e2e/a11y.spec.ts`)
- Metrics: `pnpm beta-report` prints day-30 return, eyes-up rate mean, crossover share
- Full Gate C still needs a real cohort at day 30

## Needs a person

- Gate B decision (if not already recorded)
- French content licence upgrade if replacing in-house list with wordfreq-fr
- Formal WCAG audit beyond axe smoke
- Public domain / Pages URL announcement
