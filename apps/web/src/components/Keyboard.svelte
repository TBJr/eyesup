<script lang="ts">
  import type { Layout, LayoutKey } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';

  type Mode = 'zones' | 'levels' | 'heat' | 'plain';
  type Hands = 'none' | 'rest' | 'reach';

  let {
    layout,
    mode = 'levels',
    hands = 'none',
    target = undefined as string | undefined,
    levels = {} as Record<string, number>,
    heat = {} as Record<string, number>,
    unit = 54,
    numbers = true,
    label = en.a11y.keyboard,
    theme = 'light',
    peek = false,
    reducedMotion = false,
  }: {
    layout: Layout;
    mode?: Mode;
    hands?: Hands;
    target?: string;
    levels?: Record<string, number>;
    heat?: Record<string, number>;
    unit?: number;
    numbers?: boolean;
    label?: string;
    theme?: 'light' | 'dark';
    peek?: boolean;
    reducedMotion?: boolean;
  } = $props();

  const keySize = $derived(unit - 6);
  const gap = 6;

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
    const level = levels[code] ?? 0;
    return `level-${level}`;
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

<div
  class="keyboard"
  class:dark={theme === 'dark'}
  class:peek
  class:reduced={reducedMotion}
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
          style={`width:calc(var(--key) * ${key.width})`}
          data-code={key.code}
        >
          {#if mode !== 'plain'}
            <span class="glyph">{key.base ?? ''}</span>
          {/if}
          {#if numbers && key.finger !== 'T'}
            <span class="num">{fingerNumber(key.finger)}</span>
          {/if}
          {#if hands !== 'none' && isTarget}
            {#if reducedMotion}
              <span class="arrow" aria-hidden="true"></span>
            {:else}
              <span class="reach" class:rest={hands === 'rest'} aria-hidden="true"></span>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
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
    border-radius: 6px;
    border: 1px solid var(--color-border-subtle, #c9ced6);
    background: var(--color-surface-raised, #fff);
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
    background: color-mix(in srgb, var(--finger) 35%, white);
    border-color: var(--finger);
  }
  .key.level-1 {
    background: color-mix(in srgb, var(--finger) 18%, white);
  }
  .key.level-2 {
    background: transparent;
    border-color: color-mix(in srgb, var(--finger) 50%, transparent);
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
  .key.target {
    box-shadow: 0 0 0 2px var(--color-accent, #2f6fed);
  }
  .glyph {
    font-size: 0.85rem;
  }
  .num {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 0.65rem;
    opacity: 0.8;
  }
  .arrow {
    position: absolute;
    top: -1.1rem;
    color: var(--color-accent, #2f6fed);
    font-weight: 700;
  }
  .reach {
    position: absolute;
    top: -0.75rem;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent, #2f6fed);
    animation: reach-out 400ms ease-out forwards;
  }
  .reduced .reach {
    animation: none;
  }
  @keyframes reach-out {
    from {
      transform: translateY(12px);
      opacity: 0.2;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
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
</style>
