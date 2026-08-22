/**
 * Disk anim catalog — D:\Games\Models\_anim_packs\retargeted
 * Served locally at /anim-packs. Production falls back to /anims/baked.
 */
export const ANIM_PACKS_ROOT = 'D:\\Games\\Models\\_anim_packs';

export const PACK_BUCKET: Record<string, string> = {
  sword_shield: 'weapons/sword_shield',
  '2h_melee': 'weapons/2h_melee',
  polearm: 'weapons/spear_melee',
  longbow: 'weapons/longbow',
  magic: 'weapons/magic',
  pistol: 'weapons/pistol',
  rifle: 'weapons/rifle',
  dual_wield: 'weapons/dual_wield',
  unarmed: 'weapons/unarmed',
  pro_melee_axe: 'weapons/axe',
  twohand_hammer: 'weapons/hammer',
  ghost_rider: 'weapons/ghost_rider',
  locomotion: 'locomotion/core',
  climb: 'mobility/climb',
  swim: 'mobility/swim',
  harvest: 'special/harvest',
  'work-roles': 'special/work-roles',
  reactions: 'special/reactions',
  male_injured: 'special/injured',
};

export type DiskClip = {
  pack: string;
  bucket: string;
  file: string;
  name: string;
  bakeRel: string;
  family: 'weapons' | 'mobility' | 'locomotion' | 'special';
};

export type DiskIndex = {
  version: number;
  skeleton: string;
  tracks: string;
  copied: number;
  files: Array<{ pack: string; bucket: string; file: string; name: string }>;
};

function familyOf(bucket: string): DiskClip['family'] {
  const top = bucket.split('/')[0];
  if (
    top === 'weapons' ||
    top === 'mobility' ||
    top === 'locomotion' ||
    top === 'special'
  )
    return top;
  return 'special';
}

export function bakeRelOf(pack: string, file: string): string {
  const noExt = file.replace(/\.json$/i, '');
  return `${pack}/${noExt}`.replace(/\\/g, '/');
}

export function diskUrlForRel(rel: string): string | null {
  const clean = rel.replace(/\.json$/i, '');
  const [pack, ...rest] = clean.split('/');
  const bucket = PACK_BUCKET[pack];
  if (!bucket || !rest.length) return null;
  return `/anim-packs/retargeted/${bucket}/${rest.join('/')}.json`;
}

export function normalizeIndex(raw: DiskIndex | null): DiskClip[] {
  if (!raw?.files?.length) return [];
  return raw.files.map((f) => ({
    pack: f.pack,
    bucket: f.bucket,
    file: f.file,
    name: f.name,
    bakeRel: bakeRelOf(f.pack, f.file),
    family: familyOf(f.bucket),
  }));
}

export async function loadDiskAnimIndex(): Promise<DiskClip[]> {
  const urls = [
    '/api/anim-packs',
    '/anim-packs/retargeted/index.json',
    '/anims/baked/retargeted-index.json',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as DiskIndex;
      const rows = normalizeIndex(json);
      if (rows.length) return rows;
    } catch {
      /* try next */
    }
  }
  return [];
}
