# 0002. Build the interface with Svelte 5 and keep the engine framework-free

- **Status:** Proposed (confirm at Gate A)
- **Date:** 2026-10-24
- **Decided by:** Lead developer

## Context

The practice screen updates on every keystroke: the typed character, the caret, the next key's glow, the hand guide. The budget is under 16 ms from keydown to painted character at the 95th percentile on a mid-range 2018 laptop, and under 200 KB of gzipped JavaScript for the whole web app. The same interface runs inside three desktop web views.

## Decision

Write the interface in Svelte 5 with TypeScript, built by Vite. Keep all learning logic in `packages/engine`, a plain TypeScript package with zero dependencies that knows nothing about Svelte, the DOM, storage or the network.

## Alternatives considered

| Option | For | Against |
| --- | --- | --- |
| Svelte 5 | Compiles to small plain JavaScript; fine-grained updates change only the characters that changed | Smaller hiring pool than React |
| SolidJS | Similar fine-grained performance | Smaller ecosystem still |
| React | Largest ecosystem and hiring pool | Larger runtime; per-keystroke rendering needs more care to stay inside budget |
| Plain Web Components | No framework at all | More hand-written state and rendering code |

## Consequences

- The typing surface renders characters as individual spans keyed by position, so a keystroke touches two or three nodes.
- The engine can be tested without a browser and could be ported to Rust or WebAssembly later if profiling demands it.
- Swapping the interface framework later would not touch the engine, layouts, content or tokens.

## Revisit when

A larger team standardises on another framework, or the keystroke latency budget cannot be met.
