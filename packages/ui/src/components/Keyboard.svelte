<script lang="ts">
  import type { Layout, LayoutKey } from '@eyesup/engine';
  import en from '../../strings/en.json';
  import { keyboardKeyCenters } from '../keyboardGeometry';
  import Hands from './Hands.svelte';

  type Mode = 'zones' | 'levels' | 'heat' | 'plain';
  type HandsMode = 'none' | 'rest' | 'reach';

  let {
    layout,
    mode = 'levels',
    hands = 'none',
    target = undefined as string | undefined,
    levels = {} as Record<string, number>,
    heat = {} as Record<string, number>,
    unit = 54,
    numbers = true,
    label = en.a11y.keyboard as string,
    handsLabel = en.a11y.handsRest as string,
    peek = false,
    reducedMotion = false,
    framed = false,
  }: {
    layout: Layout;
    mode?: Mode;
    hands?: HandsMode;
    target?: string | undefined;
    levels?: Record<string, number>;
    heat?: Record<string, number>;
    unit?: number;
    numbers?: boolean;
    label?: string | undefined;
    handsLabel?: string | undefined;
    peek?: boolean;
    reducedMotion?: boolean;
    framed?: boolean;
  } = $props();

  const keySize = $derived(unit - 6);
  const gap = 6;
  const showHands = $derived(hands !== 'none');
  /** Palm overhang below the key grid (design Hands viewBox 804×400). */
  const palmPad = $derived.by(() => {
    if (!showHands) return 0;
    const geo = keyboardKeyCenters(layout.keys, unit, gap);
    const handsH = (geo.width * 400) / 804;
    return Math.max(0, Math.round(handsH - geo.height));
  });
  const stagePadStyle = $derived.by(() => {
    if (!showHands) return undefined;
    if (framed) return `padding: 24px 24px ${24 + palmPad}px 24px`;
    return `padding-bottom: ${palmPad}px`;
  });

  function fingerClass(finger: string): string {
    if (finger === 'T') return 'finger-thumb';
    const n = finger.slice(1);
    return `finger-${n === '1' ? 'index' : n === '2' ? 'middle' : n === '3' ? 'ring' : 'little'}`;
  }

  function fingerNumber(finger: string): string {
    if (finger === 'T') return '';
    return finger.slice(1);
  }

  function levelClass(code: string): string {
    if (peek) return 'level-0';
    if (mode === 'heat') {
      const h = heat[code] ?? 0;
      if (h >= 0.75) return 'heat-high';
      if (h >= 0.4) return 'heat-mid';
      return 'heat-low';
    }
    const level = levels[code] ?? 0;
    return `level-${level}`;
  }

  /** Wide keys and multi-character legends use the design's smaller type (Keyboard.dc.html). */
  function isWideKey(key: LayoutKey): boolean {
    return key.width > 1.1 || (key.base?.length ?? 0) > 1;
  }

  const rows = $derived.by(() => {
    const byRow = new Map<number, LayoutKey[]>();
    for (const key of layout.keys) {
      const list = byRow.get(key.row) ?? [];
      list.push(key);
      byRow.set(key.row, list);
    }
    return [...byRow.entries()].sort((a, b) => a[0] - b[0]);
  });
</script>

<div class="stage" class:framed class:has-hands={showHands} style={stagePadStyle}>
  <div
    class="keyboard"
    class:peek
    role="img"
    aria-label={label}
    style={`--key:${keySize}px;--gap:${gap}px`}
  >
    {#each rows as [row, keys]}
      <div class="row" data-row={row}>
        {#each keys as key}
          {@const isTarget = target === key.code}
          <div
            class="key {fingerClass(key.finger)} {levelClass(key.code)} {mode}"
            class:target={isTarget}
            class:home={key.home}
            class:bump={key.bump}
            class:wide-glyph={isWideKey(key)}
            style={`width:calc(var(--key) * ${key.width})`}
            data-code={key.code}
          >
            {#if mode !== 'plain'}
              <span class="glyph">{key.base ?? ''}</span>
            {/if}
            {#if numbers && key.finger !== 'T'}
              <span class="num">{fingerNumber(key.finger)}</span>
            {/if}
            {#if mode === 'heat'}
              <span class="heat-num">{Math.round((heat[key.code] ?? 0) * 100)}</span>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  {#if showHands}
    <div class="hands-wrap">
      <Hands
        {layout}
        mode={hands === 'reach' ? 'reach' : 'rest'}
        target={target ?? undefined}
        {unit}
        {reducedMotion}
        label={handsLabel}
      />
    </div>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: max-content;
    max-width: 100%;
  }
  .stage.framed {
    padding: 24px;
    border-radius: var(--radius-panel, 20px);
    background: var(--color-surface-card, #fff);
    border: 1px solid var(--color-surface-border, #e4e1da);
    overflow-x: auto;
    overflow-y: visible;
  }
  .keyboard {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    font-family: var(--font-family-ui, sans-serif);
    user-select: none;
  }
  .row {
    display: flex;
    gap: var(--gap);
    justify-content: center;
  }
  .key {
    height: var(--key);
    border-radius: var(--radius-key, 6px);
    border: 1px solid var(--color-surface-key-border, #dad6cd);
    background: var(--color-surface-key, #fff);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-ink-primary, #16181d);
  }
  .key.finger-index {
    --finger: var(--color-finger-index, #e69f00);
  }
  .key.finger-middle {
    --finger: var(--color-finger-middle, #56b4e9);
  }
  .key.finger-ring {
    --finger: var(--color-finger-ring, #009e73);
  }
  .key.finger-little {
    --finger: var(--color-finger-little, #cc79a7);
  }
  .key.finger-thumb {
    --finger: var(--color-finger-thumb, #8a8f98);
  }
  .key.zones,
  .key.level-0 {
    /* 22% matches opacity.fingerKeyFill; mix against key surface so dark mode stays readable. */
    background: color-mix(in srgb, var(--finger) 22%, var(--color-surface-key));
    border-color: var(--finger);
  }
  .key.level-1 {
    background: color-mix(in srgb, var(--finger) 22%, var(--color-surface-key));
    border-color: color-mix(in srgb, var(--finger) 50%, transparent);
  }
  .key.level-2 {
    background: transparent;
    border-style: dashed;
    border-color: var(--color-guide-outline, #b9b5ac);
  }
  .key.level-3:not(.peek) {
    background: transparent;
    border-color: transparent;
    color: transparent;
  }
  .key.level-3:not(.peek) .num,
  .key.level-3:not(.peek) .glyph {
    visibility: hidden;
  }
  .keyboard.peek .key.level-3 .glyph,
  .keyboard.peek .key.level-3 .num {
    visibility: visible;
    color: var(--color-ink-primary, #16181d);
  }
  .key.heat-low {
    background: var(--color-heat-low, #e8eefc);
  }
  .key.heat-mid {
    background: color-mix(
      in srgb,
      var(--color-heat-high, #2f5bea) 45%,
      var(--color-heat-low, #e8eefc)
    );
  }
  .key.heat-high {
    background: color-mix(in srgb, var(--color-heat-high, #2f5bea) 75%, var(--color-surface-key));
    color: var(--color-ink-on-accent, #fff);
  }
  .key.target {
    box-shadow: 0 0 0 2px var(--color-accent, #2f5bea);
  }
  .glyph {
    font-size: calc(var(--key) * 0.34);
    font-weight: 700;
    line-height: 1;
    text-align: center;
    padding: 0 2px;
  }
  .key.wide-glyph .glyph {
    font-size: max(9px, calc(var(--key) * 0.2));
  }
  .num {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 0.65rem;
    opacity: 0.8;
  }
  .heat-num {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 0.6rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink-secondary, #5b616b);
  }
  .bump::after {
    content: '';
    position: absolute;
    bottom: 6px;
    width: 8px;
    height: 2px;
    background: currentColor;
    opacity: 0.5;
  }
  /* Overlay hands on keys (Keyboard.dc.html / design 01). */
  .hands-wrap {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 1;
    pointer-events: none;
    display: flex;
    justify-content: center;
  }
  .stage.framed .hands-wrap {
    left: 24px;
    top: 24px;
    width: calc(100% - 48px);
  }
</style>
