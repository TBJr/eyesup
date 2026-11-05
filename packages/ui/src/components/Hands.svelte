<script lang="ts">
  import type { Layout } from '@eyesup/engine';
  import en from '../../strings/en.json';
  import { keyboardKeyCenters } from '../keyboardGeometry';

  type HandsMode = 'rest' | 'reach';

  let {
    layout,
    mode = 'rest' as HandsMode,
    target = undefined as string | undefined,
    unit = 54,
    reducedMotion = false,
    label = en.a11y.handsRest,
    arrowGlyph = en.a11y.reachArrow,
  }: {
    layout: Layout;
    mode?: HandsMode;
    target?: string | undefined;
    unit?: number;
    reducedMotion?: boolean;
    label?: string;
    arrowGlyph?: string;
  } = $props();

  const gap = 6;
  /** Design-space pitch for palm anchors / viewBox (Keyboard.dc.html). */
  const DESIGN_UNIT = 54;
  const VIEW_W = 804;
  const VIEW_H = 400;

  /** Home-row finger ids → layout key codes (QWERTY-like; Semicolon / KeyA from layout). */
  const HOME: Record<string, string> = {
    L4: 'KeyA',
    L3: 'KeyS',
    L2: 'KeyD',
    L1: 'KeyF',
    R1: 'KeyJ',
    R2: 'KeyK',
    R3: 'KeyL',
    R4: 'Semicolon',
  };

  const BASE: Record<string, [number, number]> = {
    L4: [136, 222],
    L3: [180, 212],
    L2: [228, 208],
    L1: [272, 214],
    R1: [451, 214],
    R2: [495, 208],
    R3: [543, 212],
    R4: [587, 222],
  };

  const FINGER_OF: Record<string, string> = {
    KeyA: 'L4',
    KeyS: 'L3',
    KeyD: 'L2',
    KeyF: 'L1',
    KeyJ: 'R1',
    KeyK: 'R2',
    KeyL: 'R3',
    Semicolon: 'R4',
    KeyQ: 'L4',
    KeyW: 'L3',
    KeyE: 'L2',
    KeyR: 'L1',
    KeyT: 'L1',
    KeyY: 'R1',
    KeyU: 'R1',
    KeyI: 'R2',
    KeyO: 'R3',
    KeyP: 'R4',
    Space: 'T',
  };

  const FINGER_COLOR: Record<string, string> = {
    '4': 'var(--color-finger-little, #cc79a7)',
    '3': 'var(--color-finger-ring, #009e73)',
    '2': 'var(--color-finger-middle, #56b4e9)',
    '1': 'var(--color-finger-index, #e69f00)',
  };

  const geom = $derived.by(() => {
    // Tip positions in design-space; offset into fixed 804 viewBox so palms stay aligned.
    void unit;
    const { centers: raw, width: stageW } = keyboardKeyCenters(layout.keys, DESIGN_UNIT, gap);
    const ox = (VIEW_W - stageW) / 2;
    const c: Record<string, { x: number; y: number }> = {};
    for (const [code, pt] of Object.entries(raw)) {
      c[code] = { x: pt.x + ox, y: pt.y };
    }
    const tf = target ? FINGER_OF[target] : undefined;
    const reaching = mode === 'reach' && !!tf && tf !== 'T' && HOME[tf] !== target && !!c[target!];
    const fingers: Record<
      string,
      { x1: number; y1: number; x2: number; y2: number; r: number; sw: number; col: string; on: boolean }
    > = {};
    for (const id of Object.keys(BASE)) {
      const hc = c[HOME[id]!];
      const tip =
        reaching && id === tf && target && c[target]
          ? { x: c[target].x, y: c[target].y + 4 }
          : hc
            ? { x: hc.x, y: hc.y + 6 }
            : { x: BASE[id]![0], y: BASE[id]![1] + 40 };
      const on = !!target && tf === id;
      const digit = id.slice(1);
      fingers[id] = {
        x1: BASE[id]![0],
        y1: BASE[id]![1],
        x2: tip.x,
        y2: tip.y,
        r: on ? 15 : 12,
        sw: on ? 4.5 : 3.5,
        col: FINGER_COLOR[digit] ?? 'var(--color-finger-thumb, #8a8f98)',
        on,
      };
    }
    let reach = { d: '', op: 0, gx: 0, gy: 0 };
    const homeC = tf ? c[HOME[tf]!] : undefined;
    const targetC = target ? c[target] : undefined;
    if (reaching && tf && homeC && targetC) {
      const hx = homeC.x;
      const hy = homeC.y + 6;
      const tx = targetC.x;
      const ty = targetC.y + 4;
      const dx = tx - hx;
      const dy = ty - hy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const side = tf.charAt(0) === 'L' ? -1 : 1;
      const sx = hx + ux * 14;
      const sy = hy + uy * 14;
      const ex = tx - ux * 17;
      const ey = ty - uy * 17;
      const cx = (sx + ex) / 2 - uy * side * 34;
      const cy = (sy + ey) / 2 + ux * side * 34;
      reach = {
        d: `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
        op: 1,
        gx: hx,
        gy: hy,
      };
    }
    const space = c['Space'];
    const thumbL = space ? { x: space.x - 33, y: space.y - 6 } : { x: 330, y: 246 };
    const thumbR = space ? { x: space.x + 33, y: space.y - 6 } : { x: 393, y: 246 };
    return {
      fingers,
      reach,
      W: VIEW_W,
      HH: VIEW_H,
      showArrow: reducedMotion && reaching,
      thumbL,
      thumbR,
    };
  });
</script>

<svg
  class="hands"
  viewBox={`0 0 ${geom.W} ${geom.HH}`}
  role="img"
  aria-label={label}
  style="width:100%;height:auto;display:block"
>
  <defs>
    <marker
      id="eu-reach-arrow"
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M0 0L10 5L0 10z" fill="var(--color-accent, #2f5bea)"></path>
    </marker>
  </defs>
  <g opacity="0.92">
    <path
      d="M112 226 L300 214 Q326 250 312 300 L296 400 L176 400 L150 330 Q110 300 112 226 Z"
      fill="var(--color-hand-line, #8f897d)"
      stroke="var(--color-hand-line, #8f897d)"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path
      d="M611 226 L423 214 Q397 250 411 300 L427 400 L547 400 L573 330 Q613 300 611 226 Z"
      fill="var(--color-hand-line, #8f897d)"
      stroke="var(--color-hand-line, #8f897d)"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <g stroke="var(--color-hand-line, #8f897d)" stroke-linecap="round" fill="none">
      {#each Object.values(geom.fingers) as f}
        <line x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke-width="31" />
      {/each}
      <line x1="290" y1="292" x2={geom.thumbL.x} y2={geom.thumbL.y} stroke-width="35" />
      <line x1="433" y1="292" x2={geom.thumbR.x} y2={geom.thumbR.y} stroke-width="35" />
    </g>
    <path
      d="M112 226 L300 214 Q326 250 312 300 L296 400 L176 400 L150 330 Q110 300 112 226 Z"
      fill="var(--color-hand-fill, #eee9df)"
    />
    <path
      d="M611 226 L423 214 Q397 250 411 300 L427 400 L547 400 L573 330 Q613 300 611 226 Z"
      fill="var(--color-hand-fill, #eee9df)"
    />
    <g stroke="var(--color-hand-fill, #eee9df)" stroke-linecap="round" fill="none">
      {#each Object.values(geom.fingers) as f}
        <line x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke-width="27" />
      {/each}
      <line x1="290" y1="292" x2={geom.thumbL.x} y2={geom.thumbL.y} stroke-width="31" />
      <line x1="433" y1="292" x2={geom.thumbR.x} y2={geom.thumbR.y} stroke-width="31" />
    </g>
  </g>
  {#if geom.reach.op > 0 && !reducedMotion}
    <circle
      cx={geom.reach.gx}
      cy={geom.reach.gy}
      r="12"
      fill="none"
      stroke="var(--color-ink-secondary, #5b616b)"
      stroke-width="2"
      stroke-dasharray="3 3"
    />
    <path
      class="reach-path"
      d={geom.reach.d}
      fill="none"
      stroke="var(--color-accent, #2f5bea)"
      stroke-width="2.5"
      stroke-dasharray="6 5"
      stroke-linecap="round"
      marker-end="url(#eu-reach-arrow)"
    />
  {:else if geom.showArrow}
    <text
      x={geom.reach.gx || 400}
      y={(geom.reach.gy || 200) - 16}
      text-anchor="middle"
      fill="var(--color-accent, #2f5bea)"
      font-size="28"
      font-weight="700">{arrowGlyph}</text
    >
  {/if}
  {#each Object.entries(geom.fingers) as [id, f] (id)}
    <circle
      cx={f.x2}
      cy={f.y2}
      r={f.r}
      fill={f.col}
      fill-opacity={f.on ? 0.65 : 0.48}
      stroke={f.col}
      stroke-width={f.sw}
    />
  {/each}
  <circle
    cx={geom.thumbL.x}
    cy={geom.thumbL.y}
    r="12"
    fill="var(--color-finger-thumb, #8a8f98)"
    fill-opacity="0.48"
    stroke="var(--color-finger-thumb, #8a8f98)"
    stroke-width="3.5"
  />
  <circle
    cx={geom.thumbR.x}
    cy={geom.thumbR.y}
    r="12"
    fill="var(--color-finger-thumb, #8a8f98)"
    fill-opacity="0.48"
    stroke="var(--color-finger-thumb, #8a8f98)"
    stroke-width="3.5"
  />
</svg>

<style>
  .hands {
    display: block;
    pointer-events: none;
  }
  .reach-path {
    animation: reach-draw var(--motion-reach, 400ms) ease-out forwards;
  }
  @keyframes reach-draw {
    from {
      opacity: 0.2;
    }
    to {
      opacity: 1;
    }
  }
  :global([data-reduced-motion='true']) .reach-path {
    animation: none;
  }
</style>
