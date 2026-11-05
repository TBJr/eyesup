<script lang="ts">
  import type { Layout } from '@eyesup/engine';
  import type { Snippet } from 'svelte';
  import en from '@eyesup/ui/strings/en.json';
  import Button from '@eyesup/ui/Button.svelte';
  import Keyboard from '../components/Keyboard.svelte';
  import HubShell from './HubShell.svelte';

  let {
    t,
    layout,
    streakDays,
    goalWpm,
    track,
    levels = {} as Record<string, number>,
    reducedMotion = false,
    extras,
  }: {
    t: typeof en;
    layout: Layout;
    streakDays: number;
    goalWpm: number;
    track: string;
    levels?: Record<string, number>;
    reducedMotion?: boolean;
    extras?: Snippet;
  } = $props();
</script>

<HubShell {t} route="today" trackLine={t.today.trackLine.replace('{track}', track)}>
  <div class="head">
    <h1>{t.today.title}</h1>
    <span class="meta">{t.today.goal}: {goalWpm} {t.practice.wpm}</span>
  </div>
  <div class="grid">
    <section class="hero-card">
      <span class="eyebrow">{t.today.sessionLabel}</span>
      <p class="lead">{t.today.handsHint}</p>
      <Button kbd="Enter">{t.today.startCta}</Button>
    </section>
    <section class="side-cards">
      <div class="panel">
        <div class="row">
          <span>{t.today.streak}</span>
          <strong>{streakDays} {t.today.days}</strong>
        </div>
        <p class="hint">{t.today.streakHint}</p>
      </div>
      {#if extras}
        {@render extras()}
      {/if}
    </section>
  </div>
  <section class="guide panel">
    <div class="guide-vis">
      <Keyboard
        {layout}
        mode="levels"
        hands="none"
        unit={30}
        {levels}
        numbers={true}
        framed={false}
        label={t.today.guideTitle}
        {reducedMotion}
      />
    </div>
    <div class="guide-copy">
      <h2>{t.today.guideTitle}</h2>
      <p class="hint">{t.today.guidePeek}</p>
    </div>
  </section>
  <p class="hint">{t.today.start}</p>
</HubShell>

<style>
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  h1 {
    margin: 0;
    font-size: 34px;
    letter-spacing: -0.02em;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .meta {
    font-size: 15px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  .hero-card {
    grid-column: 1 / -1;
    padding: 28px;
    border-radius: 18px;
    background: var(--color-ink-primary, #16181d);
    color: var(--color-ink-on-accent, #fff);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  :global([data-theme='dark']) .hero-card {
    background: var(--color-surface-card, #1b1e23);
    border: 1px solid var(--color-surface-border, #2a2e35);
    color: var(--color-ink-primary, #eceae4);
  }
  .eyebrow {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.75;
  }
  .lead {
    margin: 0;
    font-size: 18px;
    line-height: 1.45;
  }
  .side-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .panel {
    padding: 18px 20px;
    border-radius: 14px;
    background: var(--color-surface-card, #fff);
    border: 1px solid var(--color-surface-border, #e4e1da);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .guide {
    display: flex;
    gap: 28px;
    align-items: center;
    flex-wrap: wrap;
  }
  .guide-vis {
    overflow-x: auto;
    max-width: 100%;
  }
  .guide-copy {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .hint {
    margin: 0;
    font-size: 13px;
    color: var(--color-ink-secondary, #5b616b);
  }
</style>
