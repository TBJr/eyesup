<script lang="ts">
  import type { Layout } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';
  import Logo from '@eyesup/ui/Logo.svelte';
  import Posture from '@eyesup/ui/Posture.svelte';
  import {
    ORIENT_NAV_COUNT,
    orientFingerVar,
    orientKeyGlyph,
    type OrientNavPhase,
  } from '../lib/orientSteps.js';
  import Keyboard from '../components/Keyboard.svelte';

  let {
    t,
    layout,
    navPhase,
    keyTarget = undefined as string | undefined,
    turnEyebrow,
    turnFinger = undefined as string | undefined,
    turnTip,
    soFarChips = [] as { code: string; label: string }[],
    nextLabel,
    nextEnabled = false,
    unlockHint = undefined as string | undefined,
    backLabel = undefined as string | undefined,
    onBack = undefined as (() => void) | undefined,
    onNext = undefined as (() => void) | undefined,
    reducedMotion = false,
  }: {
    t: typeof en;
    layout: Layout;
    navPhase: OrientNavPhase;
    keyTarget?: string | undefined;
    turnEyebrow: string;
    /** Finger phrase for “Press X with your …”, when a key is expected. */
    turnFinger?: string | undefined;
    turnTip: string;
    soFarChips?: { code: string; label: string }[];
    nextLabel: string;
    nextEnabled?: boolean;
    unlockHint?: string | undefined;
    backLabel?: string | undefined;
    onBack?: (() => void) | undefined;
    onNext?: (() => void) | undefined;
    reducedMotion?: boolean;
  } = $props();

  const headlines = $derived([
    t.orient.postureHeadline,
    t.orient.homeHeadline,
    t.orient.zonesHeadline,
    t.orient.tryHeadline,
  ]);

  const bodies = $derived([
    t.orient.posture,
    t.orient.home,
    t.orient.zonesBody,
    t.orient.tryBody,
  ]);

  const navItems = $derived([
    t.orient.navSit,
    t.orient.navBumps,
    t.orient.navZones,
    t.orient.navTry,
  ]);

  const showKeyboard = $derived(navPhase >= 1);
  const handsMode = $derived(navPhase === 3 ? 'reach' : 'rest');
  const chipColor = $derived(keyTarget ? orientFingerVar(keyTarget) : undefined);
  const chipGlyph = $derived(keyTarget ? orientKeyGlyph(keyTarget) : '');
</script>

<div class="orient" data-testid="orient-screen">
  <header class="top">
    <div class="brand">
      <Logo label={t.orient.title} size={28} />
      <span class="sub">{t.orient.subtitle}</span>
    </div>
    <span class="step-label"
      >{t.orient.stepOf
        .replace('{n}', String(navPhase + 1))
        .replace('{total}', String(ORIENT_NAV_COUNT))}</span
    >
  </header>
  <div class="body">
    <nav class="steps" aria-label={t.orient.title}>
      {#each navItems as label, i}
        {@const done = i < navPhase}
        {@const current = i === navPhase}
        <div class="step" class:done class:current aria-current={current ? 'step' : undefined}>
          <span class="badge">{done ? '✓' : String(i + 1)}</span>
          <span>{label}</span>
        </div>
      {/each}
    </nav>
    <div class="content">
      <div class="copy">
        <h1>{headlines[navPhase]}</h1>
        <p>{bodies[navPhase]}</p>
      </div>

      {#if navPhase === 0}
        <div class="visual">
          <Posture label={t.orient.postureAlt} />
        </div>
        <p class="hint" aria-live="polite">{turnTip}</p>
      {:else if showKeyboard}
        <div class="practice-row">
          <div class="kb-panel">
            <Keyboard
              {layout}
              mode="zones"
              hands={handsMode}
              target={keyTarget}
              numbers={true}
              framed={false}
              unit={40}
              {reducedMotion}
            />
          </div>
          <div class="side">
            <div
              class="turn"
              class:ready={!keyTarget}
              style={chipColor ? `--turn-accent:${chipColor}` : undefined}
              aria-live="polite"
            >
              <span class="turn-eye">{turnEyebrow}</span>
              <span class="turn-title">
                {#if keyTarget && chipGlyph && turnFinger}
                  {@const parts = t.orient.pressWith.split('{key}')}
                  {parts[0]}<span class="key-chip">{chipGlyph}</span
                  >{(parts[1] ?? '').replace('{finger}', turnFinger)}
                {:else}
                  {turnTip}
                {/if}
              </span>
              <span class="turn-tip">{turnTip}</span>
            </div>
            {#if soFarChips.length > 0}
              <div class="so-far">
                <span class="so-far-label">{t.orient.soFar}</span>
                <div class="chips">
                  {#each soFarChips as chip (chip.code)}
                    <span class="chip"><b>{orientKeyGlyph(chip.code)}</b> {chip.label} ✓</span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <div class="footer">
        {#if backLabel && onBack}
          <button type="button" class="back" onclick={onBack}>{backLabel}</button>
        {:else}
          <span></span>
        {/if}
        <div class="footer-next">
          {#if unlockHint && !nextEnabled}
            <span class="unlock">{unlockHint}</span>
          {/if}
          <button type="button" class="next" disabled={!nextEnabled} onclick={() => onNext?.()}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .orient {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface-page, #f6f4ef);
    color: var(--color-ink-primary, #16181d);
    font-family: var(--font-family-ui, system-ui, sans-serif);
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
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .sub,
  .step-label {
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .body {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
  }
  .steps {
    flex: 1 1 220px;
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    font-size: 15px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .step.done {
    color: #3a3f47;
  }
  .step.current {
    background: #e8eefd;
    color: var(--color-accent, #2f5bea);
    font-weight: 700;
  }
  :global([data-theme='dark']) .step.current,
  :global([data-theme='high-contrast']) .step.current {
    background: color-mix(in srgb, var(--color-accent, #2f5bea) 22%, transparent);
    color: var(--color-ink-primary, #eceae4);
  }
  .badge {
    width: 26px;
    height: 26px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex: none;
    border: 2px solid var(--color-surface-key-border, #dad6cd);
  }
  .step.done .badge {
    background: var(--color-state-correct, #1f8a4c);
    border-color: transparent;
    color: #fff;
  }
  .step.current .badge {
    background: var(--color-accent, #2f5bea);
    border-color: transparent;
    color: #fff;
  }
  .content {
    flex: 999 1 640px;
    min-width: 0;
    padding: 28px 40px 40px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .copy {
    max-width: 720px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h1 {
    margin: 0;
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .copy p {
    margin: 0;
    font-size: 17px;
    line-height: 1.55;
    color: #3a3f47;
  }
  :global([data-theme='dark']) .copy p,
  :global([data-theme='high-contrast']) .copy p {
    color: var(--color-ink-secondary, #a3a8b0);
  }
  .visual {
    overflow-x: auto;
  }
  .hint {
    margin: 0;
    color: var(--color-ink-secondary, #5b616b);
  }
  .practice-row {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: flex-start;
  }
  .kb-panel {
    padding: 20px;
    border-radius: 18px;
    background: var(--color-surface-card, #fff);
    border: 1px solid var(--color-surface-border, #e4e1da);
    overflow-x: auto;
    max-width: 100%;
  }
  .side {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .turn {
    padding: 20px;
    border-radius: 16px;
    background: var(--color-surface-card, #fff);
    border: 2px solid var(--turn-accent, var(--color-accent, #2f5bea));
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .turn.ready {
    border-color: var(--color-state-correct, #1f8a4c);
  }
  .turn-eye {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-ink-secondary, #5b616b);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .turn-title {
    font-size: 22px;
    line-height: 1.3;
    font-weight: 700;
  }
  .turn-title :global(.key-chip) {
    display: inline-block;
    padding: 0 8px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--turn-accent, #56b4e9) 22%, transparent);
    box-shadow: inset 0 -3px 0 var(--turn-accent, #56b4e9);
    font-weight: 700;
  }
  .turn-tip {
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .so-far {
    padding: 16px 18px;
    border-radius: 14px;
    background: var(--color-surface-card, #fff);
    border: 1px solid var(--color-surface-border, #e4e1da);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .so-far-label {
    font-size: 14px;
    font-weight: 700;
  }
  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-state-correct, #1f8a4c) 10%, transparent);
    font-size: 14px;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: auto;
  }
  .back {
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    color: var(--color-accent, #2f5bea);
    background: none;
    border: none;
    padding: 12px 4px;
    cursor: pointer;
    text-decoration: none;
  }
  .back:focus-visible {
    outline: 2px solid var(--color-accent, #2f5bea);
    outline-offset: 2px;
  }
  .footer-next {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .unlock {
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .next {
    font: inherit;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-ink-on-accent, #fff);
    background: var(--color-accent, #2f5bea);
    border: none;
    border-radius: 10px;
    padding: 12px 22px;
    min-height: 44px;
    cursor: pointer;
  }
  .next:disabled {
    color: var(--color-ink-secondary, #5b616b);
    background: var(--color-surface-border, #e4e1da);
    cursor: not-allowed;
  }
  .next:focus-visible {
    outline: 2px solid var(--color-accent, #2f5bea);
    outline-offset: 2px;
  }
</style>
