/**
 * 2D HUD grid — parent frame owns scale, children sit on one grid.
 * Slot rect === button rect (layered). Icons do not get a second scale.
 * Design space is always 1920×1080; only the HUD root transform scales.
 */
import type { HudFrame } from '@/config/hudKits';
import { bagSlots, hotbarSlots, type HudSlot } from '@/config/hudIcons';

export const HUD_GRID = 8;

export function snapHud(n: number): number {
  return Math.round(n / HUD_GRID) * HUD_GRID;
}

export type GridSpec = {
  cols: number;
  rows: number;
  pad: number;
  gap: number;
};

export function gridForType(type: string): GridSpec | null {
  if (type === 'hotbar-2row') return { cols: 5, rows: 2, pad: 8, gap: 6 };
  if (type === 'inventory-grid') return { cols: 6, rows: 7, pad: 10, gap: 4 };
  if (type === 'paperdoll-equipment') return { cols: 3, rows: 4, pad: 12, gap: 8 };
  return null;
}

export function slotsForFrame(f: HudFrame): HudSlot[] {
  if (f.slots?.length) return f.slots;
  if (f.type === 'hotbar-2row') return hotbarSlots();
  if (f.type === 'inventory-grid') return bagSlots(42);
  if (f.type === 'paperdoll-equipment') return bagSlots(12);
  return [];
}

export type SlotRect = {
  slot: HudSlot;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Children in parent-local px. Parent scale is the overlay transform only. */
export function layoutSlots(f: HudFrame): SlotRect[] {
  const spec = gridForType(f.type);
  const slots = slotsForFrame(f);
  if (!spec || !slots.length) return [];
  const innerW = Math.max(1, f.w - spec.pad * 2);
  const innerH = Math.max(1, f.h - spec.pad * 2);
  const cellW = (innerW - spec.gap * (spec.cols - 1)) / spec.cols;
  const cellH = (innerH - spec.gap * (spec.rows - 1)) / spec.rows;
  const side = Math.max(24, Math.min(cellW, cellH));
  return slots.slice(0, spec.cols * spec.rows).map((slot, i) => {
    const c = i % spec.cols;
    const r = Math.floor(i / spec.cols);
    return {
      slot,
      x: spec.pad + c * (side + spec.gap),
      y: spec.pad + r * (side + spec.gap),
      w: side,
      h: side,
    };
  });
}

export function snapFrame(f: HudFrame): HudFrame {
  return {
    ...f,
    x: snapHud(f.x),
    y: snapHud(f.y),
    w: Math.max(HUD_GRID * 4, snapHud(f.w)),
    h: Math.max(HUD_GRID * 3, snapHud(f.h)),
  };
}
