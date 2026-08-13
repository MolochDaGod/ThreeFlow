import type { PropertyConfig } from '@/types/rightPanelTypes';

export const baseProperties: PropertyConfig[] = [
  { label: 'Type', key: 'type' },
  { label: 'Name', key: 'name' },
];

// Transform properties
export const transformProperties: PropertyConfig[] = [
  { label: 'Position', key: 'position' },
  { label: 'Rotate', key: 'rotation' },
  { label: 'Scale', key: 'scale' },
];

export const shadowProperties: PropertyConfig[] = [
  { label: 'Visible', key: 'visible' },
  { label: 'Cast shadow', key: 'castShadow' },
  { label: 'Receive shadow', key: 'receiveShadow' },
  { label: 'Frustum culled', key: 'frustumCulled' },
];
