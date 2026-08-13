import { DRAG_MODEL_TYPE } from '@/enums/enum';

export const DRAG_TAB_ITEMS: {
  name: string;
  icon: string;
  key: DRAG_MODEL_TYPE;
}[] = [
  {
    name: 'Warlords',
    icon: 'icon-model-lib',
    key: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'D1',
    icon: 'icon-changjing2',
    key: DRAG_MODEL_TYPE.D1,
  },
  {
    name: 'R2',
    icon: 'icon-glb',
    key: DRAG_MODEL_TYPE.R2,
  },
  {
    name: 'VFX',
    icon: 'icon-hot',
    key: DRAG_MODEL_TYPE.Vfx,
  },
  {
    name: 'Geometry',
    icon: 'icon-moxing',
    key: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Lights',
    icon: 'icon-juguangdeng1',
    key: DRAG_MODEL_TYPE.Light,
  },
];
