<script lang="ts">
  import en from '@eyesup/ui/strings/en.json';
  import Logo from '@eyesup/ui/Logo.svelte';
  import Button from '@eyesup/ui/Button.svelte';

  let {
    t,
    prompt,
    options,
    selected,
    questionIndex,
    questionTotal,
    multi,
    onPick,
  }: {
    t: typeof en;
    prompt: string;
    options: string[];
    selected: number[];
    questionIndex: number;
    questionTotal: number;
    multi: boolean;
    onPick: (optionIndex: number) => void;
  } = $props();
</script>

<div class="questions" data-testid="questions-screen">
  <header class="top">
    <Logo label={t.app.name} />
    <div class="progress">
      <span
        >{t.questions.of
          .replace('{n}', String(questionIndex + 1))
          .replace('{total}', String(questionTotal))}</span
      >
      <div class="bars" aria-hidden="true">
        {#each Array(questionTotal) as _, i}
          <span class="bar" class:on={i <= questionIndex}></span>
        {/each}
      </div>
    </div>
  </header>
  <div class="main">
    <div class="inner">
      <span class="eyebrow">{t.questions.eyebrow}</span>
      <h1>{prompt}</h1>
      <div class="options">
        {#each options as opt, i}
          {@const on = selected.includes(i + 1)}
          <button type="button" class="opt" class:on aria-pressed={on} onclick={() => onPick(i + 1)}>
            <kbd class="kbd">{i + 1}</kbd>
            <span>{opt}</span>
          </button>
        {/each}
      </div>
      <div class="footer">
        <span class="hint">{multi ? t.questions.toggle : t.questions.hintKeys}</span>
        <Button kbd="Enter">{t.questions.continueCta}</Button>
      </div>
    </div>
  </div>
</div>

<style>
  .questions {
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
  .progress {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .bars {
    display: flex;
    gap: 4px;
    width: 180px;
  }
  .bar {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--color-surface-key-border, #dad6cd);
  }
  .bar.on {
    background: var(--color-accent, #2f5bea);
  }
  .main {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 48px 24px;
  }
  .inner {
    width: 100%;
    max-width: 920px;
    display: flex;
    flex-direction: column;
    gap: 28px;
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
    font-size: 36px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .opt {
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
    padding: 18px;
    border-radius: 14px;
    display: flex;
    gap: 16px;
    align-items: center;
    min-height: 112px;
    background: var(--color-surface-card, #fff);
    border: 2px solid var(--color-surface-border, #e4e1da);
  }
  .opt.on {
    border-color: var(--color-accent, #2f5bea);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent, #2f5bea) 15%, transparent);
  }
  .kbd {
    font-family: var(--font-family-practice, monospace);
    font-size: 12px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid var(--color-surface-key-border, #dad6cd);
    background: var(--color-surface-page, #f6f4ef);
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    flex-wrap: wrap;
  }
  .hint {
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
</style>
