<script lang="ts">
  import type { Layout } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';
  import AppFooter from '@eyesup/ui/AppFooter.svelte';
  import AppHeader from '@eyesup/ui/AppHeader.svelte';
  import Button from '@eyesup/ui/Button.svelte';
  import Card from '@eyesup/ui/Card.svelte';
  import Keyboard from '../components/Keyboard.svelte';

  let {
    t,
    layout,
    layoutLine,
    onStart,
    onImport,
  }: {
    t: typeof en;
    layout: Layout;
    layoutLine: string;
    onStart: () => void;
    onImport: () => void;
  } = $props();
</script>

<div class="welcome">
  <AppHeader brand={t.app.name} importLabel={t.welcome.import} {onImport} />
  <main class="main">
    <div class="inner">
      <div class="hero">
        <div class="copy">
          <span class="eyebrow">{t.welcome.eyebrow}</span>
          <h1>{t.welcome.headline}</h1>
          <p class="body">{t.welcome.body}</p>
          <div class="cta-row">
            <Button kbd="Enter" onclick={onStart}>{t.welcome.cta}</Button>
          </div>
          <p class="privacy">{t.welcome.privacyLine}</p>
        </div>
        <div class="visual">
          <Keyboard
            {layout}
            mode="zones"
            hands="rest"
            unit={38}
            numbers={true}
            framed={true}
            label={t.welcome.keyboardLabel}
            reducedMotion={false}
          />
        </div>
      </div>
      <div class="features">
        <Card title={t.welcome.featureCheckTitle}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="var(--color-accent, #2f5bea)"
              stroke-width="2.5"
            ></circle>
            <path
              d="M20 11 V20 L26 24"
              fill="none"
              stroke="var(--color-ink-primary, #16181d)"
              stroke-width="2.5"
              stroke-linecap="round"
            ></path>
          </svg>
          <p>{t.welcome.featureCheckBody}</p>
        </Card>
        <Card title={t.welcome.featureFadeTitle}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <rect
              x="3"
              y="12"
              width="10"
              height="16"
              rx="2"
              fill="var(--color-finger-middle, #56b4e9)"
              fill-opacity="0.35"
              stroke="var(--color-finger-middle, #56b4e9)"
              stroke-width="2"
            ></rect>
            <rect
              x="15"
              y="12"
              width="10"
              height="16"
              rx="2"
              fill="none"
              stroke="var(--color-guide-outline, #b9b5ac)"
              stroke-width="2"
              stroke-dasharray="3 2"
            ></rect>
            <rect
              x="27"
              y="12"
              width="10"
              height="16"
              rx="2"
              fill="none"
              stroke="var(--color-surface-border, #e4e1da)"
              stroke-width="1.5"
              stroke-dasharray="1 3"
            ></rect>
          </svg>
          <p>{t.welcome.featureFadeBody}</p>
        </Card>
        <Card title={t.welcome.featureSlowTitle}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <line
              x1="3"
              y1="14"
              x2="37"
              y2="14"
              stroke="var(--color-ink-primary, #16181d)"
              stroke-width="2"
              stroke-dasharray="4 3"
            ></line>
            <path
              d="M3 34 C14 34 22 22 30 14 L37 8"
              fill="none"
              stroke="var(--color-accent, #2f5bea)"
              stroke-width="2.5"
              stroke-linecap="round"
            ></path>
          </svg>
          <p>{t.welcome.featureSlowBody}</p>
        </Card>
      </div>
    </div>
  </main>
  <AppFooter
    offline={t.welcome.footerOffline}
    privacy={t.welcome.footerPrivacy}
    {layoutLine}
    privacyHref="#/settings"
  />
</div>

<style>
  .welcome {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface-page, #f6f4ef);
    color: var(--color-ink-primary, #16181d);
    font-family: var(--font-family-ui, system-ui, sans-serif);
  }
  .main {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 24px 24px 48px;
  }
  .inner {
    width: 100%;
    max-width: 1140px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .hero {
    display: flex;
    flex-wrap: wrap;
    gap: 48px;
    align-items: center;
  }
  .copy {
    flex: 1 1 420px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
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
    font-size: clamp(2rem, 5vw, 3.25rem);
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .body {
    margin: 0;
    font-size: 19px;
    line-height: 1.55;
    color: var(--color-ink-secondary, #5b616b);
  }
  .cta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .privacy {
    margin: 0;
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .visual {
    flex: 1 1 520px;
    min-width: 0;
  }
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .features :global(p) {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: var(--color-ink-secondary, #5b616b);
  }
</style>
