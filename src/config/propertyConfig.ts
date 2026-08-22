import * as THREE from 'three';
import { BACKGROUND_TYPE, ENVIRONMENT_TYPE, FOG_TYPE } from '@/enums/enum';

// editable model properties
export const groupTypePropertyKeys = [
  'type',
  'name',
  'position',
  'rotation',
  'scale',
  'visible',
  'castShadow',
  'receiveShadow',
];

// geometry parameter limits
export const GEOMETRY_PARAMETER_LIMITS = {
  // common parameters
  radius: { min: 0.5, max: 50 },
  width: { min: 0.5, max: 40 },
  height: { min: 0.5, max: 40 },
  depth: { min: 0.5, max: 30 },

  // segment parameters
  segments: { min: 3, max: 64 },
  radiusSegments: { min: 1, max: 30 },
  widthSegments: { min: 1, max: 10 },
  heightSegments: { min: 1, max: 10 },
  depthSegments: { min: 1, max: 10 },
  radialSegments: { min: 3, max: 64 },
  tubularSegments: { min: 3, max: 300 },

  // angles (radians)
  thetaStart: { min: 0, max: Math.PI * 2 },
  thetaLength: { min: 0, max: Math.PI * 2 },
  phiStart: { min: 0, max: Math.PI * 2 },
  phiLength: { min: 0, max: Math.PI * 2 },

  // special parameters
  tube: { min: 0.1, max: 10 },
  detail: { min: 0, max: 5 },
  P: { min: 1, max: 10 },
  q: { min: 1, max: 10 },
  innerRadius: { min: 0.1, max: 50 },
  outerRadius: { min: 0.1, max: 50 },
  length: { min: 0.1, max: 50 },
  capSegments: { min: 1, max: 30 },
  radiusTop: { min: 0.1, max: 50 },
  radiusBottom: { min: 0.1, max: 50 },
} as const;
// color picker presets
export const PREDEFINE_COLORS = [
  '#d4af37',
  '#c9a227',
  '#e8d5a3',
  '#ffffff',
  '#c5cceb',
  '#8b93b7',
  '#14161c',
  '#2a2342',
  '#ff6b6b',
  '#4ecdc4',
  '#448aff',
  '#90ee90',
  '#c71585',
  '#ff8c00',
];

// material types
export const materialTypeList = [
  {
    type: 'MeshPhysicalMaterial',
    name: 'Physical',
  },
  {
    type: 'MeshStandardMaterial',
    name: 'Standard',
  },
  {
    type: 'MeshBasicMaterial',
    name: 'Basic',
  },
  {
    type: 'MeshLambertMaterial',
    name: 'Lambert',
  },
  {
    type: 'MeshPhongMaterial',
    name: 'Phong',
  },
  {
    type: 'MeshToonMaterial',
    name: 'Toon',
  },
  {
    type: 'MeshNormalMaterial',
    name: 'Normal',
  },
  {
    type: 'MeshDepthMaterial',
    name: 'Depth',
  },
  {
    type: 'MeshMatcapMaterial',
    name: 'Matcap',
  },
  {
    type: 'LineBasicMaterial',
    name: 'Line basic',
  },
  {
    type: 'LineDashedMaterial',
    name: 'Dashed line',
  },
  {
    type: 'PointsMaterial',
    name: 'Points',
  },
];

// renderer tone mapping
export const toneMappingOptions = [
  {
    label: 'Custom',
    value: THREE.CustomToneMapping,
  },
  {
    label: 'None',
    value: THREE.NoToneMapping,
  },
  {
    label: 'Linear',
    value: THREE.LinearToneMapping,
  },
  {
    label: 'Reinhard',
    value: THREE.ReinhardToneMapping,
  },
  {
    label: 'Cineon',
    value: THREE.CineonToneMapping,
  },
  {
    label: 'ACES Filmic',
    value: THREE.ACESFilmicToneMapping,
  },
  {
    label: 'AgX',
    value: THREE.AgXToneMapping,
  },
  {
    label: 'Neutral',
    value: THREE.NeutralToneMapping,
  },
];
// scene shadows
export const shadowTypeOptions = [
  {
    label: 'Basic',
    value: THREE.BasicShadowMap,
  },
  {
    // r182+: PCFShadowMap includes soft shadows; PCFSoftShadowMap is deprecated
    label: 'PCF soft',
    value: THREE.PCFShadowMap,
  },
  {
    label: 'VSM',
    value: THREE.VSMShadowMap,
  },
];

/** normalize legacy PCFSoftShadowMap to PCFShadowMap */
export const normalizeShadowType = (
  type?: THREE.ShadowMapType | null
): THREE.ShadowMapType => {
  // PCFSoftShadowMap legacy enum value is 2
  if (type === 2) {
    return THREE.PCFShadowMap;
  }
  return type ?? THREE.BasicShadowMap;
};
// scene background
export const backgroundOptions = [
  {
    label: 'None',
    value: BACKGROUND_TYPE.NoBackground,
  },
  {
    label: 'Color',
    value: BACKGROUND_TYPE.Color,
  },
  {
    label: 'Texture',
    value: BACKGROUND_TYPE.Texture,
  },
];

// scene environment
export const environmentOptions = [
  {
    label: 'None',
    value: ENVIRONMENT_TYPE.NoEnvironment,
  },
  {
    label: 'Environment',
    value: ENVIRONMENT_TYPE.Environment,
  },
];

export const fogOptions = [
  {
    label: 'None',
    value: FOG_TYPE.None,
  },
  {
    label: 'Fog',
    value: FOG_TYPE.Fog,
  },
  {
    label: 'FogExp2',
    value: FOG_TYPE.FogExp2,
  },
];
