/**
 * Bind fleet baked Bip001 clips onto a Race Kit — one mixer (animationModules).
 * Lightweight: cache clips, load core 4 first, lazy-fetch traversal.
 * Blend: gait crossfade + overlay one-shot (fleet AnimationDirector bands).
 * Not a second mixer / director. Not Mixamo on Bip001.
 */
import * as THREE from 'three';
import type { WeaponSkillPack } from './raceKit';
import { diskUrlForRel } from './animPackDisk';

export const OPEN_BAKED = 'https://open.grudge-studio.com/anims/baked';

export type KitAnimRole =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack'
  | 'attack2'
  | 'attack3'
  | 'jump'
  | 'dodge'
  | 'climb'
  | 'climbUp'
  | 'climbDown'
  | 'mantle'
  | 'hang'
  | 'swim'
  | 'harvest'
  | 'hoe'
  | 'gather';

export const CORE_ROLES: KitAnimRole[] = ['idle', 'walk', 'run', 'attack'];
export const COMBO_ROLES: KitAnimRole[] = ['attack', 'attack2', 'attack3'];
export const HARVEST_ROLES: KitAnimRole[] = ['harvest', 'hoe', 'gather'];
export const TRAVERSAL_ROLES: KitAnimRole[] = [
  'jump',
  'dodge',
  'climb',
  'climbUp',
  'climbDown',
  'mantle',
  'hang',
  'swim',
];

/** Open weapon-live-packs — 1H/2H standard attack = combo clips that already dash. */
const SAMURAI_LOCO = {
  idle: [
    'greatsword_samurai/gs_samurai_idle_sword',
    'greatsword_samurai/gs_samurai_idle',
    'dual_wield/idle',
  ],
  walk: [
    'greatsword_samurai/gs_samurai_walk_sword',
    'greatsword_samurai/gs_samurai_walk',
    'magic/Standing Walk Forward',
    'locomotion/walk_forward',
  ],
  run: [
    'greatsword_samurai/gs_samurai_run_sword',
    'greatsword_samurai/gs_samurai_run',
    'locomotion/run_forward',
  ],
};

const PACK_ROLES: Record<
  WeaponSkillPack,
  Partial<Record<KitAnimRole, string[]>>
> = {
  sword_shield: {
    ...SAMURAI_LOCO,
    attack: [
      'sword_shield/drake_attack',
      'dual_wield/sword_dash_attack',
      'sword_shield/karina_attack1',
      'sword_shield/natalia_attack1',
      'sword_shield/fanny_attack1',
      'sword_shield/attack-combo-01-trimmed',
      'dual_wield/combo',
      'sword_shield/sword and shield attack',
    ],
    attack2: [
      'sword_shield/drake_attack2',
      'dual_wield/combo',
      'sword_shield/karina_attack2',
      'sword_shield/natalia_attack2',
      'sword_shield/fanny_attack2',
      'sword_shield/attack-combo-02',
      'dual_wield/slash',
    ],
    attack3: [
      'sword_shield/drake_attack3',
      'dual_wield/dash',
      'sword_shield/karina_skill1',
      'sword_shield/fanny_skill1_1',
      'greatsword_samurai/gs_samurai_dash_opener',
      'dual_wield/overhead',
    ],
    jump: [
      'greatsword_samurai/gs_samurai_jump_sword',
      'greatsword_samurai/gs_samurai_jump',
      'locomotion/jump',
    ],
  },
  '2h_melee': {
    ...SAMURAI_LOCO,
    attack: [
      'greatsword_samurai/gs_samurai_combo_a',
      '2h_melee/ruby_attack1',
      '2h_melee/hilda_attack1',
      'dual_wield/combo',
      'dual_wield/slash',
    ],
    attack2: [
      'greatsword_samurai/gs_samurai_combo_b',
      '2h_melee/ruby_attack2',
      '2h_melee/hilda_attack2',
      'dual_wield/overhead',
    ],
    attack3: [
      'greatsword_samurai/gs_samurai_dash_opener',
      '2h_melee/ruby_skill1',
      '2h_melee/hilda_skill1_1',
      'dual_wield/sword_dash_attack',
      'dual_wield/dash',
    ],
    jump: [
      'greatsword_samurai/gs_samurai_jump_sword',
      'greatsword_samurai/gs_samurai_jump',
      'locomotion/jump',
    ],
  },
  longbow: {
    idle: ['longbow/standing idle 01', 'polearm/idle'],
    walk: ['longbow/standing walk forward', 'magic/Standing Walk Forward'],
    run: ['longbow/standing run forward', 'locomotion/run_forward'],
    attack: [
      'longbow/miya_attack1',
      'longbow/standing aim recoil',
      'polearm/attack',
    ],
    attack2: ['longbow/miya_attack2', 'longbow/miya_skill1'],
    attack3: ['longbow/miya_skill2', 'longbow/miya_skill3'],
  },
  magic: {
    idle: ['magic/standing idle', 'polearm/idle'],
    walk: ['magic/Standing Walk Forward', 'locomotion/walk_forward'],
    run: ['magic/Standing Run Forward', 'locomotion/run_forward'],
    attack: [
      'magic/staffattack',
      'magic/eudora_attack1',
      'magic/estes_attack1',
      'magic/rafaela_attack1',
      'magic/standing 1h cast spell 01',
      'magic/standing 2h cast spell 01',
      'polearm/attack',
    ],
    attack2: [
      'polearm/thrust',
      'magic/eudora_attack2',
      'magic/estes_attack2',
      'dual_wield/thrust',
      'polearm/attack2',
    ],
    attack3: [
      'ghost_rider/uppercut',
      'magic/estes_skill1',
      'magic/rafaela_skill1',
      'ghost_rider/chain_uppercut',
      'polearm/overhead',
    ],
    jump: ['magic/standing-jump', 'locomotion/jump'],
  },
  spear_melee: {
    idle: ['polearm/idle'],
    walk: ['magic/Standing Walk Forward', 'locomotion/walk_forward'],
    run: ['locomotion/run_forward'],
    attack: [
      'polearm/zilong_attack1',
      'polearm/thrust',
      'polearm/attack',
      'dual_wield/thrust',
    ],
    attack2: [
      'polearm/zilong_attack2',
      'polearm/slash',
      'polearm/attack2',
      'polearm/attack3',
    ],
    attack3: [
      'polearm/zilong_attack3',
      'polearm/zilong_skill1',
      'polearm/overhead',
      'polearm/special',
      'ghost_rider/uppercut',
    ],
    jump: ['locomotion/jump'],
  },
  unarmed: {
    idle: ['unarmed/fight_idle', 'dual_wield/idle'],
    walk: ['magic/Standing Walk Forward'],
    run: ['locomotion/run_forward'],
    attack: ['unarmed/punching', 'dual_wield/attack'],
  },
};

const TRAVERSAL: Partial<Record<KitAnimRole, string[]>> = {
  jump: [
    'greatsword_samurai/gs_samurai_jump',
    'locomotion/jump',
    'greatsword_samurai/gs_samurai_jump_sword',
  ],
  dodge: ['locomotion/dodge_fwd', 'locomotion/dodge_back', 'dual_wield/dash'],
  climb: ['climb/climbing', 'climb/up', 'climb/wall_run'],
  climbUp: ['climb/up', 'climb/climbing'],
  climbDown: ['climb/down', 'climb/climbing'],
  mantle: ['climb/to_top', 'climb/up'],
  hang: ['climb/hang_idle', 'climb/stand_to_hang'],
  swim: ['swim/swimming', 'swim/treading'],
};

/** Farm / chop overlays — same mixer as attack, rotation-only Bip001. */
const HARVEST: Partial<Record<KitAnimRole, string[]>> = {
  harvest: [
    'harvest/chop',
    'pro_melee_axe/attack',
    'work-roles/farming/till',
    'twohand_hammer/attack',
  ],
  hoe: ['work-roles/farming/till', 'harvest/plant-a-plant', 'harvest/chop'],
  gather: [
    'harvest/plant-a-plant',
    'harvest/watering',
    'harvest/holding-idle',
  ],
};

export type KitAnimBind = {
  pack: WeaponSkillPack;
  roles: Partial<Record<KitAnimRole, THREE.AnimationClip>>;
  sources: Partial<Record<KitAnimRole, string>>;
  errors: string[];
};

const clipCache = new Map<string, Promise<THREE.AnimationClip | null>>();

function bakedUrls(rel: string): string[] {
  const [pack, ...rest] = rel.split('/');
  const file = encodeURIComponent(rest.join('/'));
  const local = `/anims/baked/${pack}/${file}.json`;
  const disk = diskUrlForRel(rel);
  return [disk, local, `${OPEN_BAKED}/${pack}/${file}.json`].filter(
    (u): u is string => Boolean(u),
  );
}

function rematchTracks(clip: THREE.AnimationClip, root: THREE.Object3D) {
  const names = new Set<string>();
  const byStripped = new Map<string, string>();
  root.traverse((o) => {
    if (!o.name) return;
    names.add(o.name);
    const stripped = o.name.replace(/_\d+$/, '').replace(/^Bip001_/, 'Bip001 ');
    if (!byStripped.has(stripped)) byStripped.set(stripped, o.name);
    byStripped.set(o.name.replace(/ /g, '_'), o.name);
    byStripped.set(o.name.replace(/_/g, ' '), o.name);
  });
  for (const t of clip.tracks) {
    const dot = t.name.indexOf('.');
    if (dot < 0) continue;
    const node = t.name.slice(0, dot);
    const prop = t.name.slice(dot + 1);
    if (names.has(node)) continue;
    const stripped = node.replace(/_\d+$/, '').replace(/^Bip001_/, 'Bip001 ');
    const hit =
      byStripped.get(node) ||
      byStripped.get(stripped) ||
      (names.has(stripped) ? stripped : '') ||
      (names.has(node.replace(/_/g, ' ')) ? node.replace(/_/g, ' ') : '') ||
      (names.has(node.replace(/ /g, '_')) ? node.replace(/ /g, '_') : '');
    if (hit) t.name = `${hit}.${prop}`;
  }
}

/** Rotation-only — hip/root position tracks cause hip-float on a grounded kit. */
export function stripRootMotion(clip: THREE.AnimationClip): THREE.AnimationClip {
  const tagged = clip as THREE.AnimationClip & {
    __rootStripped?: THREE.AnimationClip;
  };
  if (tagged.__rootStripped) return tagged.__rootStripped;
  const tracks = clip.tracks.filter(
    (t) => t.name.endsWith('.quaternion') || t.name.endsWith('.rotation')
  );
  if (tracks.length === clip.tracks.length) {
    tagged.__rootStripped = clip;
    return clip;
  }
  const next = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  tagged.__rootStripped = next;
  return next;
}

function toRotationOnly(clip: THREE.AnimationClip): THREE.AnimationClip {
  return stripRootMotion(clip);
}

function fetchClip(rel: string): Promise<THREE.AnimationClip | null> {
  const hit = clipCache.get(rel);
  if (hit) return hit;
  const p = (async () => {
    for (const url of bakedUrls(rel)) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) continue;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/html')) continue;
        const json = (await res.json()) as THREE.AnimationClipJSON;
        const clip = toRotationOnly(THREE.AnimationClip.parse(json));
        clip.name = rel.split('/').pop() || rel;
        if (clip.tracks.length) return clip;
      } catch {
        /* try next host */
      }
    }
    return null;
  })().catch(() => null);
  clipCache.set(rel, p);
  return p;
}

async function firstClip(
  rels: string[]
): Promise<{ clip: THREE.AnimationClip; rel: string } | null> {
  for (const rel of rels) {
    const clip = await fetchClip(rel);
    if (clip) return { clip, rel };
  }
  return null;
}

export function rolesForPack(
  pack: WeaponSkillPack
): Record<KitAnimRole, string[]> {
  const base = PACK_ROLES[pack] || PACK_ROLES.unarmed;
  return {
    idle: base.idle || [],
    walk: base.walk || [],
    run: base.run || [],
    attack: base.attack || [],
    attack2: base.attack2 || base.attack || [],
    attack3: base.attack3 || base.attack || [],
    jump: base.jump || TRAVERSAL.jump || [],
    dodge: TRAVERSAL.dodge || [],
    climb: TRAVERSAL.climb || [],
    climbUp: TRAVERSAL.climbUp || [],
    climbDown: TRAVERSAL.climbDown || [],
    mantle: TRAVERSAL.mantle || [],
    hang: TRAVERSAL.hang || [],
    swim: TRAVERSAL.swim || [],
    harvest: HARVEST.harvest || [],
    hoe: HARVEST.hoe || [],
    gather: HARVEST.gather || [],
  };
}

async function attachRole(
  root: THREE.Object3D,
  bind: KitAnimBind,
  role: KitAnimRole,
  rels: string[]
) {
  if (bind.roles[role]) return;
  const hit = await firstClip(rels);
  if (!hit) {
    bind.errors.push(`${role}: none of ${rels.join(' | ')}`);
    return;
  }
  const clip = hit.clip.clone();
  rematchTracks(clip, root);
  clip.name = `${role}:${hit.rel}`;
  bind.roles[role] = clip;
  bind.sources[role] = hit.rel;
  root.animations = Object.values(bind.roles) as THREE.AnimationClip[];
}

export async function bindKitAnims(
  root: THREE.Object3D,
  pack: WeaponSkillPack
): Promise<KitAnimBind> {
  const prev = getKitAnimBind(root);
  if (prev?.pack === pack && prev.roles.idle) return prev;
  const wanted = rolesForPack(pack);
  const bind: KitAnimBind = { pack, roles: {}, sources: {}, errors: [] };
  await Promise.all(
    CORE_ROLES.map((role) => attachRole(root, bind, role, wanted[role]))
  );
  root.userData.kitAnims = bind;
  root.userData.animPack = pack;
  void Promise.all(
    [...COMBO_ROLES, ...TRAVERSAL_ROLES, ...HARVEST_ROLES].map((role) =>
      attachRole(root, bind, role, wanted[role])
    )
  ).then(() => {
    root.userData.kitAnims = bind;
  });
  return bind;
}

export async function ensureKitRole(
  root: THREE.Object3D,
  role: KitAnimRole
): Promise<THREE.AnimationClip | null> {
  const pack = (root.userData.animPack || root.userData.raceKit?.animPack) as
    WeaponSkillPack | undefined;
  if (!pack) return null;
  let bind = getKitAnimBind(root);
  if (!bind || bind.pack !== pack) bind = await bindKitAnims(root, pack);
  if (!bind.roles[role]) {
    await attachRole(root, bind, role, rolesForPack(pack)[role]);
    root.userData.kitAnims = bind;
  }
  return bind.roles[role] || null;
}

export async function playBakeRel(
  root: THREE.Object3D,
  rel: string,
  api: AnimApi | null | undefined
): Promise<boolean> {
  const raw = await fetchClip(rel);
  if (!raw || !api) return false;
  const clip = raw.clone();
  rematchTracks(clip, root);
  clip.name = rel;
  if (api.playOverlay) api.playOverlay(clip, root, { fade: 0.1 });
  else api.playExclusive(clip, root, { loopOnce: true });
  return true;
}

export function getKitAnimBind(
  root: THREE.Object3D | null
): KitAnimBind | null {
  return (root?.userData?.kitAnims as KitAnimBind) || null;
}

export type AnimApi = {
  crossFadeGait?: (
    clip: THREE.AnimationClip,
    model: THREE.Object3D,
    fade?: number
  ) => void;
  playOverlay?: (
    clip: THREE.AnimationClip,
    model: THREE.Object3D,
    opts?: { fade?: number }
  ) => void;
  playExclusive: (
    clip: THREE.AnimationClip,
    model: THREE.Object3D,
    opts?: { loopOnce?: boolean }
  ) => void;
};

const OVERLAY: KitAnimRole[] = [
  'attack',
  'attack2',
  'attack3',
  'jump',
  'dodge',
  'mantle',
  'climbUp',
  'climbDown',
  'harvest',
  'hoe',
  'gather',
];

export function playKitRole(
  root: THREE.Object3D,
  role: KitAnimRole,
  api: AnimApi | null | undefined
): boolean {
  const clip = getKitAnimBind(root)?.roles[role];
  if (!clip || !api) return false;
  if (OVERLAY.includes(role)) {
    if (api.playOverlay) api.playOverlay(clip, root, { fade: 0.1 });
    else api.playExclusive(clip, root, { loopOnce: true });
    return true;
  }
  if (root.userData.kitGait === role) return true;
  if (api.crossFadeGait) api.crossFadeGait(clip, root, 0.18);
  else api.playExclusive(clip, root);
  root.userData.kitGait = role;
  return true;
}

/** Fleet gait bands: 0 idle · 0.34 walk · 0.70 run. Sprint = run × 1.75. */
export function setKitGait(
  root: THREE.Object3D,
  moving: boolean,
  sprint: boolean,
  api: AnimApi | null | undefined
) {
  if (!moving) return playKitRole(root, 'idle', api);
  if (sprint) return playKitRole(root, 'run', api);
  return playKitRole(root, 'walk', api) || playKitRole(root, 'run', api);
}
