import { DRAG_MODEL_TYPE } from '@/enums/enum';

export const DRAG_TAB_ITEMS: {
  name: string;
  icon: string;
  key: DRAG_MODEL_TYPE;
}[] = [
  {
    name: '模型',
    icon: 'icon-model-lib',
    key: DRAG_MODEL_TYPE.Model,
  },
  {
    name: '几何体',
    icon: 'icon-moxing',
    key: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '灯光',
    icon: 'icon-juguangdeng1',
    key: DRAG_MODEL_TYPE.Light,
  },
];
