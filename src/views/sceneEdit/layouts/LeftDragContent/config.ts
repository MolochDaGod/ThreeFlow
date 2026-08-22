/** Six left rails — Geometry is a Place section, not its own tab. */
export type LeftTabKey =
  | 'world'
  | 'assets'
  | 'place'
  | 'hud'
  | 'game'
  | 'deploy';

export const LEFT_TAB_ITEMS: {
  name: string;
  icon: string;
  key: LeftTabKey;
  hint: string;
}[] = [
  {
    name: 'World',
    icon: 'icon-yingyongchangjing',
    key: 'world',
    hint: 'Sectors · islands · DS2 · scenes',
  },
  {
    name: 'Assets',
    icon: 'icon-model-lib',
    key: 'assets',
    hint: 'Captains · units · enemies · weapons · meshes',
  },
  {
    name: 'Place',
    icon: 'icon-moxing',
    key: 'place',
    hint: 'Prefabs · lights · primitives',
  },
  {
    name: 'HUD',
    icon: 'icon-changjing2',
    key: 'hud',
    hint: '2D frames become scene children under HUD',
  },
  {
    name: 'Game',
    icon: 'icon-zhuti',
    key: 'game',
    hint: 'Game Manager · Network Manager',
  },
  {
    name: 'Deploy',
    icon: 'icon-daochu',
    key: 'deploy',
    hint: 'Forge · play · push mesh',
  },
];

export const WORLD_GROUPS = ['sectors', 'islands', 'zones', 'scenes'] as const;
export const ASSET_GROUPS = [
  'captains',
  'units',
  'animals',
  'enemies',
  'weapons',
  'harvest',
  'meshes',
  'animations',
  'vfx',
  'textures',
] as const;
export const PLACE_GROUPS = ['prefabs'] as const;
