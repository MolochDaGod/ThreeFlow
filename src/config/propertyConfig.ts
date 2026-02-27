import * as THREE from 'three';
import { BACKGROUND_TYPE, ENVIRONMENT_TYPE, FOG_TYPE } from '@/enums/enum';

// 模型属性可编辑属性
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

// 几何体参数边界值配置
export const GEOMETRY_PARAMETER_LIMITS = {
  // 通用参数
  radius: { min: 0.5, max: 50 },
  width: { min: 0.5, max: 40 },
  height: { min: 0.5, max: 40 },
  depth: { min: 0.5, max: 30 },

  // 分段相关
  segments: { min: 3, max: 64 },
  radiusSegments: { min: 1, max: 30 },
  widthSegments: { min: 1, max: 10 },
  heightSegments: { min: 1, max: 10 },
  depthSegments: { min: 1, max: 10 },
  radialSegments: { min: 3, max: 64 },
  tubularSegments: { min: 3, max: 300 },

  // 角度相关（弧度制）
  thetaStart: { min: 0, max: Math.PI * 2 },
  thetaLength: { min: 0, max: Math.PI * 2 },
  phiStart: { min: 0, max: Math.PI * 2 },
  phiLength: { min: 0, max: Math.PI * 2 },

  // 特殊参数
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
//颜色选择器配置
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

// 材质类型
export const materialTypeList = [
  {
    type: 'MeshPhysicalMaterial',
    name: '物理材质',
  },
  {
    type: 'MeshStandardMaterial',
    name: '标准材质',
  },
  {
    type: 'MeshBasicMaterial',
    name: '基础材质',
  },
  {
    type: 'MeshLambertMaterial',
    name: 'Lambert材质',
  },
  {
    type: 'MeshPhongMaterial',
    name: 'Phong材质',
  },
  {
    type: 'MeshToonMaterial',
    name: '卡通材质',
  },
  {
    type: 'MeshNormalMaterial',
    name: '法线材质',
  },
  {
    type: 'MeshDepthMaterial',
    name: '深度材质',
  },
  {
    type: 'MeshMatcapMaterial',
    name: 'Matcap材质',
  },
  {
    type: 'LineBasicMaterial',
    name: '线条基础材质',
  },
  {
    type: 'LineDashedMaterial',
    name: '虚线材质',
  },
  {
    type: 'PointsMaterial',
    name: '点材质',
  },
];

// 渲染器色调映射
export const toneMappingOptions = [
  {
    label: '自定义色调映射(CustomToneMapping)',
    value: THREE.CustomToneMapping,
  },
  {
    label: '无色调映射(NoToneMapping)',
    value: THREE.NoToneMapping,
  },
  {
    label: '线性色调映射(LinearToneMapping)',
    value: THREE.LinearToneMapping,
  },
  {
    label: 'Reinhard色调映射(ReinhardToneMapping)',
    value: THREE.ReinhardToneMapping,
  },
  {
    label: 'Cineon色调映射(CineonToneMapping)',
    value: THREE.CineonToneMapping,
  },
  {
    label: 'ACES色调映射(ACESFilmicToneMapping)',
    value: THREE.ACESFilmicToneMapping,
  },
  {
    label: 'AgX色调映射(AgXToneMapping)',
    value: THREE.AgXToneMapping,
  },
  {
    label: 'Neutral色调映射(NeutralToneMapping)',
    value: THREE.NeutralToneMapping,
  },
];
// 场景阴影
export const shadowTypeOptions = [
  {
    label: '无阴影(NoShadow)',
    value: THREE.BasicShadowMap,
  },
  {
    label: 'PCF阴影(PCFShadowMap)',
    value: THREE.PCFShadowMap,
  },
  {
    label: 'PCF软阴影(PCFSoftShadowMap)',
    value: THREE.PCFSoftShadowMap,
  },
  {
    label: 'VSM阴影(VSMShadowMap)',
    value: THREE.VSMShadowMap,
  },
];
// 场景背景
export const backgroundOptions = [
  {
    label: '无背景',
    value: BACKGROUND_TYPE.NoBackground,
  },
  {
    label: '颜色(Color)',
    value: BACKGROUND_TYPE.Color,
  },
  {
    label: '图片(Texture)',
    value: BACKGROUND_TYPE.Texture,
  },
];

// 场景环境光
export const environmentOptions = [
  {
    label: '无',
    value: ENVIRONMENT_TYPE.NoEnvironment,
  },
  {
    label: 'Environment',
    value: ENVIRONMENT_TYPE.Environment,
  },
];


export const fogOptions = [
  {
    label: '无',
    value: FOG_TYPE.None,
  },
  {
    label: '雾(Fog)',
    value: FOG_TYPE.Fog,
  },
  {
    label: '雾(FogExp2)',
    value: FOG_TYPE.FogExp2,
  },
];


