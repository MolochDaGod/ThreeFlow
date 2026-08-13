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
//color选择器配置
export const PREDEFINE_COLORS = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  'rgba(255, 69, 0, 0.68)',
  'rgb(255, 120, 0)',
  'hsv(51, 100, 98)',
  'hsva(120, 40, 94, 0.5)',
  'hsl(181, 100%, 37%)',
  'hsla(209, 100%, 56%, 0.73)',
  '#c7158577',
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
    name: 'LambertMaterial',
  },
  {
    type: 'MeshPhongMaterial',
    name: 'PhongMaterial',
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
    name: 'DepthMaterial',
  },
  {
    type: 'MeshMatcapMaterial',
    name: 'MatcapMaterial',
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

// RendererTone mapping
export const toneMappingOptions = [
  {
    label: 'Custom',
    value: THREE.CustomToneMapping,
  },
  {
    label: 'NoneTone mapping(NoToneMapping)',
    value: THREE.NoToneMapping,
  },
  {
    label: 'Linear',
    value: THREE.LinearToneMapping,
  },
  {
    label: 'ReinhardTone mapping(ReinhardToneMapping)',
    value: THREE.ReinhardToneMapping,
  },
  {
    label: 'CineonTone mapping(CineonToneMapping)',
    value: THREE.CineonToneMapping,
  },
  {
    label: 'ACESTone mapping(ACESFilmicToneMapping)',
    value: THREE.ACESFilmicToneMapping,
  },
  {
    label: 'AgXTone mapping(AgXToneMapping)',
    value: THREE.AgXToneMapping,
  },
  {
    label: 'NeutralTone mapping(NeutralToneMapping)',
    value: THREE.NeutralToneMapping,
  },
];
// SceneShadows
export const shadowTypeOptions = [
  {
    label: 'NoneShadows(NoShadow)',
    value: THREE.BasicShadowMap,
  },
  {
    // r182+：PCFShadowMap includes soft shadows; PCFSoftShadowMap is deprecated
    label: 'PCF soft',
    value: THREE.PCFShadowMap,
  },
  {
    label: 'VSMShadows(VSMShadowMap)',
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
// SceneBackground
export const backgroundOptions = [
  {
    label: 'NoneBackground',
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


