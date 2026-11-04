<script lang="ts">
  import type { Layout } from '@eyesup/engine';
  import UiKeyboard from '@eyesup/ui/Keyboard.svelte';

  let {
    layout,
    mode = 'levels',
    hands = 'none',
    target = undefined as string | undefined,
    levels = {} as Record<string, number>,
    heat = {} as Record<string, number>,
    unit = 54,
    numbers = true,
    label = undefined as string | undefined,
    peek = false,
    reducedMotion = false,
    framed = false,
  }: {
    layout: Layout;
    mode?: 'zones' | 'levels' | 'heat' | 'plain';
    hands?: 'none' | 'rest' | 'reach';
    target?: string | undefined;
    levels?: Record<string, number>;
    heat?: Record<string, number>;
    unit?: number;
    numbers?: boolean;
    label?: string | undefined;
    peek?: boolean;
    reducedMotion?: boolean;
    framed?: boolean;
  } = $props();
</script>

{#if label !== undefined}
  <UiKeyboard
    {layout}
    {mode}
    {hands}
    {target}
    {levels}
    {heat}
    {unit}
    {numbers}
    {label}
    {peek}
    {reducedMotion}
    {framed}
  />
{:else}
  <UiKeyboard
    {layout}
    {mode}
    {hands}
    {target}
    {levels}
    {heat}
    {unit}
    {numbers}
    {peek}
    {reducedMotion}
    {framed}
  />
{/if}
