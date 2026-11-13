<script lang="ts">
  import type { Track } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';
  import Logo from '@eyesup/ui/Logo.svelte';
  import Button from '@eyesup/ui/Button.svelte';

  let {
    t,
    placedTrack,
    activeTrack,
    placementReason,
    detectedLayout,
    trackOptions,
    onOverride,
    onLayoutChange,
  }: {
    t: typeof en;
    placedTrack: string;
    activeTrack: Track;
    placementReason: string;
    detectedLayout: string;
    trackOptions: Track[];
    onOverride: (track: Track) => void;
    onLayoutChange: (layoutId: string) => void;
  } = $props();

  const ctaLabel = $derived(
    activeTrack === 'foundations' || activeTrack === 'retrain'
      ? t.result.startOrient
      : t.result.startPractice,
  );
</script>

<div class="result" data-testid="result-screen">
  <header class="top">
    <Logo label={t.app.name} />
    <span class="eyebrow">{t.result.eyebrow}</span>
  </header>
  <div class="main">
    <div class="inner">
      <span class="eyebrow">{t.result.eyebrow}</span>
      <h1>
        {t.result.headline.replace('{track}', placedTrack)}
      </h1>
      <p class="reason"><strong>{t.result.reason}:</strong> {placementReason}</p>
      <div class="card">
        <p data-testid="placed-track" hidden>{placedTrack}</p>
        <p data-testid="active-track" hidden>{activeTrack}</p>
        <label>
          {t.result.override}
          <select
            value={activeTrack}
            onchange={(e) => onOverride(e.currentTarget.value as Track)}
          >
            {#each trackOptions as tr}
              <option value={tr}>{tr}</option>
            {/each}
          </select>
        </label>
        <div class="layout-row">
          <span>{t.result.layout}: <b>{detectedLayout}</b></span>
          <label>
            {t.result.changeLayout}
            <select value={detectedLayout} onchange={(e) => onLayoutChange(e.currentTarget.value)}>
              <option value="qwerty-us">{t.layouts.qwertyUs}</option>
              <option value="qwerty-uk">{t.layouts.qwertyUk}</option>
              <option value="azerty-fr">{t.layouts.azertyFr}</option>
            </select>
          </label>
        </div>
      </div>
      <div class="cta">
        <Button kbd="Enter">{ctaLabel}</Button>
      </div>
      <p class="hint">{t.result.continue}</p>
    </div>
  </div>
</div>

<style>
  .result {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface-page, #f6f4ef);
    color: var(--color-ink-primary, #16181d);
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 18px 32px;
    border-bottom: 1px solid var(--color-surface-border, #e4e1da);
    background: var(--color-surface-card, #fff);
  }
  .main {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 40px 24px;
  }
  .inner {
    width: 100%;
    max-width: 1040px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .eyebrow {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-ink-secondary, #5b616b);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    font-size: 40px;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .reason {
    margin: 0;
    font-size: 17px;
    line-height: 1.55;
    color: var(--color-ink-secondary, #5b616b);
    max-width: 760px;
  }
  .card {
    padding: 20px;
    border-radius: 14px;
    background: var(--color-surface-card, #fff);
    border: 1px solid var(--color-surface-border, #e4e1da);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .layout-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }
  label {
    display: block;
  }
  select {
    display: block;
    margin-top: 0.25rem;
    max-width: 20rem;
  }
  .cta {
    display: flex;
    justify-content: flex-end;
  }
  .hint {
    margin: 0;
    color: var(--color-ink-secondary, #5b616b);
    text-align: right;
  }
</style>
