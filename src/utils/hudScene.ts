/**
 * HUD as hierarchy-only groups — not a second 3D render.
 * Overlay is the only visible 2D. These nodes are parent/child SSOT.
 */
import * as THREE from 'three';
import type { HudFrame } from '@/config/hudKits';
import { layoutSlots } from './hudGrid';
import { GAME_MANAGER_NAME } from './sceneManagers';

export const HUD_ROOT_NAME = 'HUD';

export function ensureHudRoot(scene: THREE.Scene): THREE.Group {
  let g = scene.getObjectByName(HUD_ROOT_NAME) as THREE.Group | undefined;
  if (!g) {
    g = new THREE.Group();
    g.name = HUD_ROOT_NAME;
    g.userData.grudgeRole = 'hud-root';
    g.userData.kind = 'hud-root';
    g.userData.lockedRoot = true;
    g.visible = false;
    scene.add(g);
  }
  g.visible = false;
  return g;
}

function stampGhost(o: THREE.Object3D) {
  o.visible = false;
  o.matrixAutoUpdate = false;
  o.position.set(0, 0, 0);
  o.updateMatrix();
}

export function syncHudToScene(scene: THREE.Scene, frames: HudFrame[]) {
  const root = ensureHudRoot(scene);
  stampGhost(root);
  const want = new Set(frames.map((f) => f.id));
  for (const child of [...root.children]) {
    const id = child.userData?.hudId as string | undefined;
    if (id && !want.has(id)) root.remove(child);
  }
  for (const f of frames) {
    let node = root.children.find((c) => c.userData?.hudId === f.id);
    if (!node) {
      node = new THREE.Group();
      node.userData.hudId = f.id;
      node.userData.grudgeRole = 'hud-frame';
      node.userData.kind = 'hud-frame';
      root.add(node);
    }
    node.name = f.label;
    node.userData.hudFrame = { ...f };
    node.userData.hudType = f.type;
    stampGhost(node);

    const cells = layoutSlots(f);
    const keep = new Set(cells.map((c) => c.slot.id));
    for (const ch of [...node.children]) {
      const sid = ch.userData?.hudSlotId as string | undefined;
      if (sid && !keep.has(sid)) node.remove(ch);
    }
    for (const cell of cells) {
      let slot = node.children.find((c) => c.userData?.hudSlotId === cell.slot.id);
      if (!slot) {
        slot = new THREE.Group();
        slot.userData.hudSlotId = cell.slot.id;
        slot.userData.kind = 'hud-slot';
        node.add(slot);
      }
      slot.name = `slot ${cell.slot.key}`;
      slot.userData.icon = cell.slot.icon;
      slot.userData.key = cell.slot.key;
      stampGhost(slot);
    }
  }
  stampHudDeploy(scene, frames);
}

export function stampHudDeploy(scene: THREE.Scene, frames: HudFrame[]) {
  const gm = scene.getObjectByName(GAME_MANAGER_NAME);
  if (!gm) return;
  gm.userData.hud = {
    design: { w: 1920, h: 1080 },
    grid: 8,
    iconHost: 'https://ui.grudge-studio.com/icons',
    frames: frames.map((f) => ({
      id: f.id,
      type: f.type,
      x: f.x,
      y: f.y,
      w: f.w,
      h: f.h,
      slots: layoutSlots(f).map((c) => ({
        id: c.slot.id,
        key: c.slot.key,
        icon: c.slot.icon,
        x: c.x,
        y: c.y,
        w: c.w,
        h: c.h,
      })),
    })),
  };
}

export function hudIdOf(obj: THREE.Object3D | null | undefined): string | null {
  let o: THREE.Object3D | null | undefined = obj;
  while (o) {
    if (typeof o.userData?.hudId === 'string') return o.userData.hudId;
    o = o.parent;
  }
  return null;
}
