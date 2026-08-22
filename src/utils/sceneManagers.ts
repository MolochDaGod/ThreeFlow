/**
 * Preset scene managers — not a second networking stack.
 * GameManager / NetworkManager live in the hierarchy like Unity empties.
 * Scripts, inspect, and deploy options sit on userData.
 */
import * as THREE from 'three';

export const GAME_MANAGER_NAME = 'GameManager';
export const NETWORK_MANAGER_NAME = 'NetworkManager';

export type ManagerRole = 'game-manager' | 'network-manager';

function empty(name: string, role: ManagerRole, data: Record<string, unknown>) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.grudgeRole = role;
  g.userData.kind = role;
  g.userData.lockedRoot = true;
  Object.assign(g.userData, data);
  return g;
}

export function ensureSceneManagers(scene: THREE.Scene) {
  let gm = scene.getObjectByName(GAME_MANAGER_NAME);
  if (!gm) {
    gm = empty(GAME_MANAGER_NAME, 'game-manager', {
      era: 'warlords',
      playMode: 'tps',
      hudPack: 'warlords',
      playScript:
        "// Game Manager — play bake + HUD kit\nselected.userData.era = selected.userData.era || 'warlords';",
      deploy: {
        play: 'https://grudgewarlords.com',
        foundry: 'https://character.grudge-studio.com/foundry?era=warlords',
        playKit: 'loadRaceKit',
        hudIcons: 'https://ui.grudge-studio.com/icons',
      },
      inspect: {
        era: 'warlords',
        playMode: 'tps',
        hud: 'CraftPix / HYDRA 1920×1080',
      },
    });
    scene.add(gm);
  }
  let nm = scene.getObjectByName(NETWORK_MANAGER_NAME);
  if (!nm) {
    nm = empty(NETWORK_MANAGER_NAME, 'network-manager', {
      transport: 'carrier',
      room: 'warlords-sandbox',
      tickHz: 20,
      playScript:
        "// Network Manager — Carrier / Railway rooms (not Spacetime)\nconsole.log('room', selected.userData.room);",
      deploy: {
        carrier: 'https://grudox.grudge-studio.com',
        rooms: 'Railway Colyseus',
        not: 'vibe SpacetimeDB',
      },
      inspect: {
        transport: 'carrier',
        tickHz: 20,
        authority: 'server',
      },
    });
    scene.add(nm);
  }
  return { gm, nm };
}

export function isManager(obj: THREE.Object3D | null | undefined) {
  const role = obj?.userData?.grudgeRole;
  return role === 'game-manager' || role === 'network-manager';
}
