import type { PropertyConfig } from '@/types/rightPanelTypes';

export const baseProperties: PropertyConfig[] = [
  { label: '类型', key: 'type' },
  { label: '名称', key: 'name' },
];

// 变换属性配置
export const transformProperties: PropertyConfig[] = [
  { label: '位置', key: 'position' },
  { label: '旋转', key: 'rotation' },
  { label: '缩放', key: 'scale' },
];

export const shadowProperties: PropertyConfig[] = [
  { label: '可见性', key: 'visible' },
  { label: '投射阴影', key: 'castShadow' },
  { label: '接收阴影', key: 'receiveShadow' },
  { label: '视锥体裁剪', key: 'frustumCulled' },
];
