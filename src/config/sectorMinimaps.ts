/**
 * Per-sector minimap plates for HUD + library.
 * Files live in public/minimap/{id}.jpg — ortho of the real sector / island /
 * foundation GLB (pnpm bake:minimaps). HUD + library icons. Not cartography.
 */
import { HD_DEPLOY_TARGETS } from './hdTerrainDeploy';

export function minimapUrl(id: string): string {
  return `/minimap/${id}.jpg`;
}

export const SECTOR_MINIMAP_IDS = HD_DEPLOY_TARGETS.map((t) => t.id);

export function minimapForScene(scene: {
  traverse: (fn: (o: { userData: Record<string, unknown> }) => void) => void;
}): string | null {
  let id: string | null = null;
  scene.traverse((o) => {
    if (id) return;
    const sid = o.userData.sectorId || o.userData.terrainId;
    if (typeof sid === 'string' && sid) id = sid;
  });
  return id ? minimapUrl(id) : null;
}
