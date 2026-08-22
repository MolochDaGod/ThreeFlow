/**
 * 2D / UI kits from ui.grudge-studio.com Warlords pack (HYDRA 1920×1080).
 * Do not invent chrome — types match game-ui-packs/warlords.json.
 */
import { HUD_DESIGN_H, HUD_DESIGN_W } from '@/utils/imageLoader';
import { bagSlots, hotbarSlots, type HudSlot } from './hudIcons';
export const UI_HOST = 'https://ui.grudge-studio.com';
export const UI_PACK_URL = `${UI_HOST}/game-ui-packs/warlords.json`;
export const UI_MAIN_PANEL = `${UI_HOST}/main-panel.html?era=warlords&embed=1`;

export type GameModeId = 'rpg' | 'mmo' | 'rts' | 'harvest' | 'tps' | 'fps';

export type { HudSlot };

export type HudFrame = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  groups: string[];
  cols?: number;
  rows?: number;
  slots?: HudSlot[];
  icon?: string;
};

export const GAME_MODES: { id: GameModeId; label: string; groups: string[] }[] =
  [
    { id: 'rpg', label: 'RPG', groups: ['hud', 'explore', 'inventory'] },
    { id: 'mmo', label: 'MMO', groups: ['hud', 'combat', 'explore', 'chat'] },
    { id: 'rts', label: 'RTS', groups: ['hud', 'explore'] },
    {
      id: 'harvest',
      label: 'Harvesting',
      groups: ['hud', 'explore', 'dialogue'],
    },
    { id: 'tps', label: 'Third-person shooter', groups: ['hud', 'combat'] },
    { id: 'fps', label: 'First-person shooter', groups: ['hud', 'combat'] },
  ];

/** Subset of Warlords pack — drag pieces for the 2D/UI tab. */
export const HUD_FRAMES: HudFrame[] = [
  {
    id: 'pf1',
    type: 'player-frame',
    label: 'Player frame',
    x: 24,
    y: 880,
    w: 320,
    h: 120,
    groups: ['hud', 'combat'],
  },
  {
    id: 'tf1',
    type: 'target-frame',
    label: 'Target frame',
    x: 760,
    y: 24,
    w: 400,
    h: 72,
    groups: ['hud', 'combat'],
  },
  {
    id: 'hb1',
    type: 'hotbar-2row',
    label: 'Hotbar 2-row',
    x: 640,
    y: 920,
    w: 640,
    h: 120,
    groups: ['hud', 'combat'],
    cols: 5,
    rows: 2,
    slots: hotbarSlots(),
  },
  {
    id: 'mm1',
    type: 'minimap',
    label: 'Minimap',
    x: 1680,
    y: 24,
    w: 200,
    h: 200,
    groups: ['hud', 'explore'],
  },
  {
    id: 'cast1',
    type: 'cast-bar',
    label: 'Cast bar',
    x: 700,
    y: 860,
    w: 520,
    h: 48,
    groups: ['hud', 'combat'],
  },
  {
    id: 'chat1',
    type: 'chat-window',
    label: 'Chat',
    x: 24,
    y: 420,
    w: 280,
    h: 200,
    groups: ['hud', 'explore'],
  },
  {
    id: 'qt1',
    type: 'quest-tracker',
    label: 'Quest tracker',
    x: 1480,
    y: 450,
    w: 220,
    h: 160,
    groups: ['hud', 'explore'],
  },
  {
    id: 'dlg1',
    type: 'dialogue-box',
    label: 'Dialogue',
    x: 480,
    y: 760,
    w: 960,
    h: 160,
    groups: ['dialogue'],
  },
  {
    id: 'inv1',
    type: 'inventory-grid',
    label: 'Bag 6×7',
    x: 560,
    y: 180,
    w: 420,
    h: 520,
    groups: ['inventory'],
    cols: 6,
    rows: 7,
    slots: bagSlots(42),
  },
  {
    id: 'eq1',
    type: 'paperdoll-equipment',
    label: 'Paperdoll',
    x: 160,
    y: 160,
    w: 420,
    h: 560,
    groups: ['inventory'],
  },
  {
    id: 'xh1',
    type: 'crosshair',
    label: 'Crosshair',
    x: 940,
    y: 520,
    w: 40,
    h: 40,
    groups: ['hud', 'combat'],
  },
  {
    id: 'ip1',
    type: 'interaction-prompt',
    label: 'Interact F',
    x: 820,
    y: 700,
    w: 160,
    h: 40,
    groups: ['explore'],
  },
];

/** What each 2D/UI piece does in play — shown on RMB inspect. */
export const HUD_TYPE_HELP: Record<string, string> = {
  'player-frame': 'Your name, HP, MP. Stays on the local player.',
  'target-frame': 'Focused enemy/ally name + HP when you have a target.',
  'hotbar-2row': 'Skill and item slots. Play binds 1–0 / F / R.',
  minimap: 'Local map. Click opens the world map overlay.',
  'cast-bar': 'Shows wind-up while you or the target cast.',
  'chat-window': 'Party / say / system text. Not a second bag DB.',
  'quest-tracker': 'Pinned quest steps. Hide in combat if crowded.',
  'dialogue-box': 'NPC talk. Shown only when a dialogue script fires.',
  'inventory-grid': 'Bag grid. Account bag is Railway — this is layout only.',
  'paperdoll-equipment': 'Worn slots on the body. Character UUID owns gear.',
  crosshair: 'Screen reticle. Play: show in focus/aim, hide in select.',
  'interaction-prompt': 'Nearby use prompt (F). Hidden when nothing is in range.',
};

export function hudTypeHelp(type: string): string {
  return HUD_TYPE_HELP[type] || 'HUD chrome. Layout only — play reads the same frames.';
}

export function clampHudFrame(f: HudFrame): HudFrame {
  const g = 8;
  const snap = (n: number) => Math.round(n / g) * g;
  const w = Math.min(Math.max(snap(f.w), g * 4), HUD_DESIGN_W);
  const h = Math.min(Math.max(snap(f.h), g * 3), HUD_DESIGN_H);
  const x = Math.min(Math.max(snap(f.x), 0), HUD_DESIGN_W - w);
  const y = Math.min(Math.max(snap(f.y), 0), HUD_DESIGN_H - h);
  return { ...f, x, y, w, h };
}

const LS = 'threeflow.hudOverlay.v2';

export type HudState = {
  mode: GameModeId;
  frames: HudFrame[];
  selectedId: string | null;
};

export function loadHud(): HudState {
  try {
    const raw = JSON.parse(
      localStorage.getItem(LS) ||
        localStorage.getItem('threeflow.hudOverlay.v1') ||
        'null'
    );
    if (raw?.frames) {
      const frames = (raw.frames as HudFrame[]).map((f) => {
        const next = clampHudFrame(f);
        if (next.type === 'hotbar-2row' && !next.slots?.length) {
          next.cols = 5;
          next.rows = 2;
          next.slots = hotbarSlots();
        }
        if (next.type === 'inventory-grid' && !next.slots?.length) {
          next.cols = 6;
          next.rows = 7;
          next.slots = bagSlots(42);
        }
        if (next.type === 'interaction-prompt' && next.h > 64) {
          next.h = 40;
          next.w = Math.min(next.w, 168);
        }
        return next;
      });
      return { ...raw, frames } as HudState;
    }
  } catch {
    /* */
  }
  return { mode: 'rpg', frames: [], selectedId: null };
}

export function saveHud(s: HudState) {
  localStorage.setItem(LS, JSON.stringify(s));
}

export function ensurePlayHud(): HudState {
  const cur = loadHud();
  if (cur.frames.length) return cur;
  return applyModeKit('mmo');
}

export function applyModeKit(mode: GameModeId): HudState {
  const def = GAME_MODES.find((m) => m.id === mode)!;
  const frames = HUD_FRAMES.filter((f) =>
    f.groups.some((g) => def.groups.includes(g))
  ).map((f) => ({
    ...f,
    id: `${f.id}-${mode}`,
  }));
  const next = { mode, frames, selectedId: null };
  saveHud(next);
  return next;
}
