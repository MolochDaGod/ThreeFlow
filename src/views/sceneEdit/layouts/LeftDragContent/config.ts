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
