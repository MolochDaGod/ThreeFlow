/**
 * VFX lab scene — Threeflow editor preset for vfx.grudge.studio edits.
 * Environment + loaders come from this SPA (HDR + Draco + loadRaceKit).
 * Effect JSON SSOT stays on vfx.grudge.studio.
 */
import { DRAG_MODEL_TYPE, MODEL_TYPE } from '@/enums/enum';
import type { WarlordsDragItem } from './warlordsCatalog';
import { item } from './warlordsCatalog';
import { STUDIO_ASSETS } from './branding';

export const VFX_STUDIO = 'https://vfx.grudge.studio';
export const VFX_CATALOG_URL = `${VFX_STUDIO}/assets/catalog.json`;
export const VFX_LAB_QUERY = 'vfx';
export const VFX_LAB_HDR = '/hdr/view-hdr-11.hdr';
export const VFX_LAB_CAPTAIN =
  `${STUDIO_ASSETS}/asset-packs/toon-rts-characters/glb/characters/human.glb`;

export function isVfxLabQuery(search = window.location.search): boolean {
  const q = new URLSearchParams(search);
  const scene = (q.get('scene') || q.get('preset') || '').toLowerCase();
  return scene === VFX_LAB_QUERY || scene === 'vfx-lab' || q.get('vfx') === '1';
}

type CatalogEffect = {
  id: string;
  name?: string;
  category?: string;
  pack?: string;
  format?: string;
  path?: string;
  vfx?: string;
  meshes?: string[];
};

type CatalogJson = {
  effects?: CatalogEffect[];
};

export async function loadVfxStudioCatalog(): Promise<WarlordsDragItem[]> {
  try {
    const res = await fetch(VFX_CATALOG_URL, { mode: 'cors' });
    if (!res.ok) return [];
    const data = (await res.json()) as CatalogJson;
    const out: WarlordsDragItem[] = [];
    for (const fx of data.effects || []) {
      const meshRel = (fx.meshes || []).find((m) => /\.glb$/i.test(m));
      if (!meshRel || !fx.path) continue;
      const filePath = `${VFX_STUDIO}/assets/${fx.path.replace(/^\/+/, '')}/${meshRel.replace(/^\/+/, '')}`;
      out.push(
        item(
          'vfx',
          `studio-${fx.id}`,
          fx.name || fx.id,
          filePath,
          `${STUDIO_ASSETS}/icons/pack/entities/totem1.png`,
          false,
          {
            tab: 'vfx',
            prefabKind: 'weapon',
          }
        )
      );
    }
    return out;
  } catch {
    return [];
  }
}

export function vfxLabCaptainItem(): WarlordsDragItem {
  return item(
    'captains',
    'vfx-lab-human',
    'Human captain',
    VFX_LAB_CAPTAIN,
    `${STUDIO_ASSETS}/icons/pack/entities/Human_Warrior.png`,
    true,
    { tab: 'warlords' }
  );
}

export { MODEL_TYPE, DRAG_MODEL_TYPE };
