/** Minimal key shape for geometry (matches LayoutKey fields we need). */
export type GeomKey = {
  readonly code: string;
  readonly row: number;
  readonly width: number;
};

export type Point = { readonly x: number; readonly y: number };

/**
 * Key-center coordinates matching Keyboard.svelte flex layout:
 * each row is centered within the widest row; key box is `width * (unit - gap)`.
 */
export function keyboardKeyCenters(
  keys: readonly GeomKey[],
  unit: number,
  gap: number,
): { centers: Record<string, Point>; width: number; height: number } {
  const byRow = new Map<number, GeomKey[]>();
  for (const key of keys) {
    const list = byRow.get(key.row) ?? [];
    list.push(key);
    byRow.set(key.row, list);
  }
  const rows = [...byRow.entries()].sort((a, b) => a[0] - b[0]);
  const keyBox = (k: GeomKey) => (k.width ?? 1) * (unit - gap);
  const rowWidth = (rowKeys: readonly GeomKey[]) =>
    rowKeys.reduce((sum, k) => sum + keyBox(k), 0) + Math.max(0, rowKeys.length - 1) * gap;

  const maxRowWidth = rows.reduce((max, [, rowKeys]) => Math.max(max, rowWidth(rowKeys)), 0);
  const centers: Record<string, Point> = {};
  rows.forEach(([, rowKeys], ri) => {
    const rw = rowWidth(rowKeys);
    let x = (maxRowWidth - rw) / 2;
    const y = ri * unit + (unit - gap) / 2;
    for (const key of rowKeys) {
      const w = keyBox(key);
      centers[key.code] = { x: x + w / 2, y };
      x += w + gap;
    }
  });
  return {
    centers,
    width: maxRowWidth,
    height: rows.length * unit,
  };
}
