/**
 * Shared Warlords character / anim language — same words as Casting
 * docs/ANIM_LIBRARY_SSOT.md. Do not invent role aliases.
 *
 * Hosts: threeflow.* play bake · casting.* lab · Open/Multiverse fetch baked JSON.
 * Play bodies stay Toon RTS. Sketchfab hero clips are pack extras only.
 */
export const CASTING_LAB = 'https://casting-abilities-threejs.vercel.app';
export const CASTING_HOST = 'https://casting.grudge-studio.com';
export const FOUNDRY_HOST = 'https://character.grudge-studio.com/foundry';
export const UI_MAIN_PANEL =
  'https://ui.grudge-studio.com/main-panel.html?era=warlords';

export type AnimFamily = 'gait' | 'combat' | 'mobility' | 'utility';
export type AnimChannel = 'gait' | 'oneShot' | 'mobility';

export type LibraryClip = {
  pack: string;
  role: string;
  bakeRel: string;
  family: AnimFamily;
  label: string;
  source?: string;
};

export const ANIM_ROLE_META: Record<
  string,
  { family: AnimFamily; channel: AnimChannel; label: string }
> = {
  idle: { family: 'gait', channel: 'gait', label: 'Idle' },
  walk: { family: 'gait', channel: 'gait', label: 'Walk' },
  run: { family: 'gait', channel: 'gait', label: 'Run' },
  jump: { family: 'gait', channel: 'oneShot', label: 'Jump' },
  attack: { family: 'combat', channel: 'oneShot', label: 'Attack 1' },
  attack2: { family: 'combat', channel: 'oneShot', label: 'Attack 2' },
  attack3: { family: 'combat', channel: 'oneShot', label: 'Attack 3' },
  skill1: { family: 'combat', channel: 'oneShot', label: 'Skill 1' },
  skill2: { family: 'combat', channel: 'oneShot', label: 'Skill 2' },
  skill3: { family: 'combat', channel: 'oneShot', label: 'Skill 3' },
  dodge: { family: 'mobility', channel: 'mobility', label: 'Dodge' },
  climb: { family: 'mobility', channel: 'oneShot', label: 'Climb' },
  swim: { family: 'mobility', channel: 'gait', label: 'Swim' },
};

const clip = (
  pack: string,
  role: string,
  bakeRel: string,
  label?: string,
  source?: string
): LibraryClip => ({
  pack,
  role,
  bakeRel,
  family: ANIM_ROLE_META[role]?.family || 'utility',
  label: label || ANIM_ROLE_META[role]?.label || role,
  source,
});

/** Fleet SSOT + Sketchfab hero extras — same packs Casting / Open already use. */
export const WARLORDS_LIBRARY_CLIPS: LibraryClip[] = [
  clip('sword_shield', 'idle', 'greatsword_samurai/gs_samurai_idle_sword'),
  clip('sword_shield', 'walk', 'greatsword_samurai/gs_samurai_walk_sword'),
  clip('sword_shield', 'run', 'greatsword_samurai/gs_samurai_run_sword'),
  clip('sword_shield', 'attack', 'dual_wield/sword_dash_attack'),
  clip('sword_shield', 'attack2', 'dual_wield/combo'),
  clip('sword_shield', 'attack3', 'dual_wield/dash'),
  clip(
    'sword_shield',
    'attack',
    'sword_shield/drake_attack',
    'Drake 1H attack',
    'drake'
  ),
  clip(
    'sword_shield',
    'attack2',
    'sword_shield/drake_attack2',
    'Drake 1H JianShu',
    'drake'
  ),
  clip(
    'sword_shield',
    'attack3',
    'sword_shield/drake_attack3',
    'Drake 1H QingJi',
    'drake'
  ),
  clip(
    'sword_shield',
    'idle',
    'sword_shield/drake_fight_idle',
    'Drake fight idle',
    'drake'
  ),
  clip(
    'sword_shield',
    'run',
    'sword_shield/drake_run',
    'Drake run',
    'drake'
  ),
  clip(
    'sword_shield',
    'skill1',
    'sword_shield/drake_skill1',
    'Drake skill1',
    'drake'
  ),
  clip(
    'sword_shield',
    'attack',
    'sword_shield/karina_attack1',
    'Karina attack1',
    'karina'
  ),
  clip(
    'sword_shield',
    'attack2',
    'sword_shield/karina_attack2',
    'Karina attack2',
    'karina'
  ),
  clip(
    'sword_shield',
    'attack',
    'sword_shield/natalia_attack1',
    'Natalia attack1',
    'natalia'
  ),
  clip(
    'sword_shield',
    'attack',
    'sword_shield/fanny_attack1',
    'Fanny attack1',
    'fanny'
  ),
  clip(
    'sword_shield',
    'skill1',
    'sword_shield/fanny_skill1_1',
    'Fanny skill1',
    'fanny'
  ),
  clip('2h_melee', 'idle', 'greatsword_samurai/gs_samurai_idle_sword'),
  clip('2h_melee', 'attack', 'greatsword_samurai/gs_samurai_combo_a'),
  clip('2h_melee', 'attack2', 'greatsword_samurai/gs_samurai_combo_b'),
  clip('2h_melee', 'attack3', 'greatsword_samurai/gs_samurai_dash_opener'),
  clip('2h_melee', 'attack', '2h_melee/ruby_attack1', 'Ruby attack1', 'ruby'),
  clip(
    '2h_melee',
    'attack',
    '2h_melee/hilda_attack1',
    'Hilda attack1',
    'hilda'
  ),
  clip(
    'spear_melee',
    'attack',
    'polearm/zilong_attack1',
    'Zilong attack1',
    'zilong'
  ),
  clip(
    'spear_melee',
    'attack2',
    'polearm/zilong_attack2',
    'Zilong attack2',
    'zilong'
  ),
  clip(
    'spear_melee',
    'attack3',
    'polearm/zilong_skill1',
    'Zilong skill1',
    'zilong'
  ),
  clip('spear_melee', 'attack', 'polearm/thrust', 'Thrust'),
  clip('magic', 'attack', 'magic/staffattack', 'Staff attack'),
  clip('magic', 'attack', 'magic/eudora_attack1', 'Eudora attack1', 'eudora'),
  clip('magic', 'attack2', 'magic/estes_attack1', 'Estes attack1', 'estes'),
  clip('magic', 'attack3', 'ghost_rider/uppercut', 'Uppercut'),
  clip('longbow', 'attack', 'longbow/miya_attack1', 'Miya attack1', 'miya'),
  clip('longbow', 'attack2', 'longbow/miya_attack2', 'Miya attack2', 'miya'),
  clip('longbow', 'skill1', 'longbow/miya_skill1', 'Miya skill1', 'miya'),
  clip('pistol', 'attack', 'pistol/clint_attack1', 'Clint attack1', 'clint'),
  clip('pistol', 'attack2', 'pistol/clint_attack2', 'Clint attack2', 'clint'),
  clip('male_injured', 'idle', 'male_injured/idle', 'Injured idle', 'mixamo'),
  clip('male_injured', 'walk', 'male_injured/walk', 'Injured walk', 'mixamo'),
  clip('male_injured', 'run', 'male_injured/run', 'Injured run', 'mixamo'),
  clip('harvest', 'idle', 'harvest/holding-idle', 'Farm hold idle', 'mixamo'),
  clip('harvest', 'walk', 'harvest/holding-walk', 'Farm hold walk', 'mixamo'),
  clip('harvest', 'attack', 'harvest/chop', 'Chop', 'mixamo'),
  clip('harvest', 'skill1', 'harvest/plant-a-plant', 'Plant', 'mixamo'),
  clip('harvest', 'skill2', 'harvest/watering', 'Water', 'mixamo'),
  clip('locomotion', 'idle', 'locomotion/idle', 'Loco idle', 'mixamo'),
  clip('locomotion', 'walk', 'locomotion/walk_forward', 'Loco walk', 'mixamo'),
  clip('locomotion', 'run', 'locomotion/run_forward', 'Loco run', 'mixamo'),
  clip('locomotion', 'jump', 'locomotion/jump', 'Loco jump', 'mixamo'),
  clip(
    'work-roles',
    'idle',
    'work-roles/farming/idle',
    'Farm work idle',
    'mixamo'
  ),
  clip(
    'work-roles',
    'walk',
    'work-roles/farming/walk',
    'Farm work walk',
    'mixamo'
  ),
  clip('work-roles', 'skill1', 'work-roles/farming/till', 'Till', 'mixamo'),
  clip(
    'reactions',
    'attack',
    'reactions/death-from-front',
    'Death front',
    'mixamo'
  ),
  clip(
    'pro_melee_axe',
    'attack',
    'pro_melee_axe/attack',
    'Axe attack',
    'mixamo'
  ),
  clip(
    'twohand_hammer',
    'attack',
    'twohand_hammer/attack',
    'Hammer attack',
    'mixamo'
  ),
  clip('rifle', 'attack', 'rifle/firing-rifle', 'Rifle fire', 'mixamo'),
];

export const MIXAMO_PACK_FOLDERS = [
  'male_injured',
  'harvest',
  'locomotion',
  'work-roles',
  'reactions',
  'climb',
  'swim',
  'pro_melee_axe',
  'twohand_hammer',
  'rifle',
  'dual_wield',
  'ghost_rider',
  'unarmed',
] as const;

export function clipsForPack(pack: string): LibraryClip[] {
  return WARLORDS_LIBRARY_CLIPS.filter((c) => c.pack === pack);
}

export function dressingRoomContract() {
  return {
    version: 1,
    updated: '2026-08-16',
    product: 'warlords',
    playBody: 'toon-rts loadRaceKit only',
    lab: CASTING_HOST,
    editor: 'https://threeflow.vercel.app',
    foundry: FOUNDRY_HOST,
    hud: UI_MAIN_PANEL,
    clipHost: '/anims/baked/{pack}/{file}.json',
    openHost: 'https://open.grudge-studio.com/anims/baked',
    assetsHost: 'https://assets.grudge-studio.com/anims/baked',
    clips: WARLORDS_LIBRARY_CLIPS,
  };
}
