/** Soft practice cues via Web Audio (spec §05 Sound). Default off — gated by caller. */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

function tone(
  frequency: number,
  durationMs: number,
  options?: { gain?: number; type?: OscillatorType; when?: number },
): void {
  const ac = audio();
  if (!ac) return;
  void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = options?.type ?? 'sine';
  osc.frequency.value = frequency;
  const g = options?.gain ?? 0.04;
  const start = ac.currentTime + (options?.when ?? 0);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(g, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

export function playCorrect(enabled: boolean): void {
  if (!enabled) return;
  tone(880, 40, { gain: 0.03 });
}

export function playError(enabled: boolean): void {
  if (!enabled) return;
  tone(220, 70, { gain: 0.045, type: 'triangle' });
}

export function playLineComplete(enabled: boolean): void {
  if (!enabled) return;
  tone(660, 80, { gain: 0.035 });
  tone(880, 100, { gain: 0.03, when: 0.09 });
}

export function playUnlock(enabled: boolean): void {
  if (!enabled) return;
  tone(523.25, 120, { gain: 0.04 });
  tone(659.25, 160, { gain: 0.04, when: 0.12 });
}
