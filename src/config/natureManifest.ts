/**
 * Live organized-nature → ThreeFlow library rows.
 * SSOT: info.grudge-studio.com/api/v1/organized-nature-manifest.json
 * Isolated GLBs only — never drop a fused megakit pack as one entity.
 */
import { INFO_JSON } from './objectStoreSsot';
import { ASSETS_CDN } from './assetApi';
import { biomesForNatureHint, type SectorBiome } from './sectorKits';

export type NatureHarvest = 'wood' | 'stone';

export type NatureLibRow = {
  key: string;
  name: string;
  path: string;
  url: string;
  harvestKind: NatureHarvest;
  siHeightM: number;
  category: string;
  biomes: SectorBiome[];
};

type OrgEntry = { name?: string; path?: string };
type RealEntry = {
  id?: string;
  category?: string;
  path?: string;
  runtimeReady?: boolean;
};

function cdn(path: string) {
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${ASSETS_CDN}/${p}`;
}

function treeHeight(cat: string, name: string): number {
  const s = `${cat} ${name}`.toLowerCase();
  if (/pine|snow/.test(s)) return 8;
  if (/palm|coconut/.test(s)) return 6;
  if (/oak|ancient|birch/.test(s)) return 7;
  return 6;
}

function rockHeight(name: string): number {
  return /cliff/i.test(name) ? 2.4 : 1.6;
}

export function natureRowsFromManifest(raw: unknown): NatureLibRow[] {
  if (!raw || typeof raw !== 'object') return [];
  const j = raw as {
    organized?: { trees?: OrgEntry[]; rocks?: OrgEntry[] };
    realistic?: RealEntry[];
  };
  const out: NatureLibRow[] = [];
  const seen = new Set<string>();

  const add = (row: NatureLibRow) => {
    if (!row.path || seen.has(row.path)) return;
    seen.add(row.path);
    out.push(row);
  };

  for (const t of j.organized?.trees || []) {
    if (!t.path) continue;
    add({
      key: `nature-${t.name || t.path}`,
      name: (t.name || 'tree').replace(/_/g, ' '),
      path: t.path,
      url: cdn(t.path),
      harvestKind: 'wood',
      siHeightM: treeHeight('tree', t.name || ''),
      category: 'tree',
      biomes: biomesForNatureHint(t.name || t.path || ''),
    });
  }
  for (const r of j.organized?.rocks || []) {
    if (!r.path) continue;
    add({
      key: `nature-${r.name || r.path}`,
      name: (r.name || 'rock').replace(/_/g, ' '),
      path: r.path,
      url: cdn(r.path),
      harvestKind: 'stone',
      siHeightM: rockHeight(r.name || ''),
      category: 'rock',
      biomes: biomesForNatureHint(r.name || r.path || ''),
    });
  }
  for (const r of j.realistic || []) {
    if (!r.path || r.runtimeReady === false) continue;
    const cat = String(r.category || '');
    const wood = /tree/i.test(cat);
    add({
      key: `nature-${r.id || r.path}`,
      name: (r.id || cat || 'nature').replace(/_/g, ' '),
      path: r.path,
      url: cdn(r.path),
      harvestKind: wood ? 'wood' : 'stone',
      siHeightM: wood ? treeHeight(cat, r.id || '') : rockHeight(r.id || ''),
      category: cat || (wood ? 'tree' : 'rock'),
      biomes: biomesForNatureHint(`${cat} ${r.id || ''} ${r.path || ''}`),
    });
  }
  return out;
}

export async function fetchNatureRows(): Promise<NatureLibRow[]> {
  try {
    const r = await fetch(INFO_JSON.nature, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) return [];
    return natureRowsFromManifest(await r.json());
  } catch {
    return [];
  }
}
