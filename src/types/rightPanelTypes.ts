export interface MaterialNode {
  label?: string;
  uuid: string;
  type?: string;
  children?: MaterialNode[];
}

export type ParametersType = Record<string, number | string | boolean> | null;

export interface TransformMaterial {
  // Mesh 属性
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];

  // Light 属性
  color?: THREE.Color;
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  power?: number;
  // Common 属性
  type: string;
  name: string;
  visible: boolean;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  castShadow: boolean;
  receiveShadow: boolean;
  frustumCulled: boolean;

  // Group 子对象
  children?: THREE.Object3D[];

  // Light 特定属性
  shadow?: THREE.LightShadow & THREE.SpotLightShadow;
  target?: THREE.Object3D;

  // SkinnedMesh 属性
  skeleton?: THREE.Skeleton;
  bindMode?: string;
  bindMatrix?: THREE.Matrix4;
  bindMatrixInverse?: THREE.Matrix4;

  // Camera 属性
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  zoom?: number;

  isLight?: boolean;
  // SpotLight 特定属性
  isSpotLight?: boolean;
  map?: THREE.Texture;

  // DirectionalLight 特定属性
  isDirectionalLight?: boolean;

  // PointLight 特定属性
  isPointLight?: boolean;

  // HemisphereLight 特定属性
  isHemisphereLight?: boolean;
  groundColor?: THREE.Color;
  userData?: {
    [key: string]: string | number | boolean;
  };
  isPoints?: boolean;
  isSprite?: boolean;
  // 方法
  updateMatrix?: () => void;
  updateMatrixWorld?: (force?: boolean) => void;
  lookAt?: (vector: THREE.Vector3 | number, y?: number, z?: number) => void;
}

export type TransformMaterialType =
  | 'position'
  | 'rotation'
  | 'scale'
  | 'visible'
  | 'castShadow'
  | 'receiveShadow'
  | 'name'
  | 'type'
  | 'frustumCulled';
export interface PropertyConfig {
  label: string;
  key: TransformMaterialType;
}

export interface GeometryParameters {
  type: string;
  uuid: string;
  parameters: ParametersType;
}

export type GeometryTypeParameter =
  | 'width'
  | 'height'
  | 'depth'
  | 'radius'
  | 'segments'
  | 'widthSegments'
  | 'heightSegments'
  | 'depthSegments'
  | 'radialSegments'
  | 'tubularSegments'
  | 'thetaStart'
  | 'thetaLength'
  | 'phiStart'
  | 'phiLength'
  | 'tube'
  | 'detail'
  | 'P'
  | 'q'
  | 'innerRadius'
  | 'outerRadius'
  | 'length'
  | 'capSegments'
  | 'radiusTop'
  | 'radiusBottom';

export type MaterialPropertyType =
  | 'color'
  | 'transparent'
  | 'opacity'
  | 'visible'
  | 'side'
  | 'alphaTest'
  | 'wireframeLinewidth'
  | 'specular'
  | 'shininess'
  | 'rotation'
  | 'sheen'
  | 'sheenRoughness'
  | 'depthPacking'
  | 'normalScale'
  | 'emissive'
  | 'emissiveIntensity'
  | 'aoMapIntensity'
  | 'metalness'
  | 'roughness'
  | 'reflectivity'
  | 'clearcoat'
  | 'clearcoatRoughness'
  | 'transmission'
  | 'transmissionRoughness'
  | 'roughnessMap'
  | 'metalnessMap'
  | 'clearcoatMap'
  | 'clearcoatRoughnessMap'
  | 'sheenMap'
  | 'transmissionMap'
  | 'aoMap'
  | 'emissiveMap'
  | 'envMap'
  | 'gradientMap'
  | 'linewidth'
  | 'dashSize'
  | 'gapSize'
  | 'size'
  | 'sizeAttenuation'
  | 'wireframe'
  | 'flatShading'
  | 'combine'
  | 'envMapIntensity'
  | 'depthTest'
  | 'depthWrite'
  | 'blending'
  | 'morphTargets'
  | 'morphNormals'
  | 'shadowSide'
  | 'vertexColors'
  | 'fog'
  | 'normalMap';

import type { EFFECT_METHOD, FOG_TYPE ,TEXT_MATERIAL_TYPE} from '@/enums/enum';
import * as THREE from 'three';

/**
 * 材质数据接口
 * 包含所有支持的材质属性，提供强类型支持
 */
export interface MaterialData {
  // 基础属性
  type: string;
  uuid?: string;
  name?: string;
  color?: THREE.Color | string | number;
  transparent?: boolean;
  opacity?: number;
  visible?: boolean;
  side?: THREE.Side;
  alphaTest?: number;
  
  // 贴图相关
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  bumpMap?: THREE.Texture | null;
  displacementMap?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  metalnessMap?: THREE.Texture | null;
  alphaMap?: THREE.Texture | null;
  aoMap?: THREE.Texture | null;
  emissiveMap?: THREE.Texture | null;
  iridescenceMap?: THREE.Texture | null;
  lightMap?: THREE.Texture | null;
  envMap?: THREE.Texture | null;
  gradientMap?: THREE.Texture | null;
  clearcoatMap?: THREE.Texture | null;
  clearcoatRoughnessMap?: THREE.Texture | null;
  sheenMap?: THREE.Texture | null;
  transmissionMap?: THREE.Texture | null;
  matcap?: THREE.Texture | null;

  // 物理/标准材质属性
  metalness?: number;
  roughness?: number;
  emissive?: THREE.Color | string | number;
  emissiveIntensity?: number;
  aoMapIntensity?: number;
  envMapIntensity?: number;
  lightMapIntensity?: number;
  bumpScale?: number;
  normalScale?: THREE.Vector2;
  displacementScale?: number;
  displacementBias?: number;

  // PBR 高级属性
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  transmissionRoughness?: number;
  ior?: number;
  reflectivity?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: THREE.Color | string | number;
  iridescence?: number;
  iridescenceIOR?: number;
  thickness?: number;
  attenuationDistance?: number;
  attenuationColor?: THREE.Color | string | number;

  // Phong/Lambert 材质属性
  specular?: THREE.Color | string | number;
  shininess?: number;
  combine?: THREE.Combine;

  // 线条/点材质属性
  linewidth?: number;
  dashSize?: number;
  gapSize?: number;
  scale?: number; // LineDashedMaterial
  size?: number;
  sizeAttenuation?: boolean;

  // Sprite 材质属性
  rotation?: number;

  // 通用渲染属性
  wireframe?: boolean;
  wireframeLinewidth?: number;
  flatShading?: boolean;
  depthTest?: boolean;
  depthWrite?: boolean;
  depthPacking?: number; // MeshDepthMaterial
  blending?: THREE.Blending;
  
  // 动画/变形
  morphTargets?: boolean;
  morphNormals?: boolean;
  
  // 其他
  vertexColors?: boolean;
  fog?: boolean;
  shadowSide?: THREE.Side;
  
  // ShaderMaterial
  uniforms?: { [key: string]: THREE.Uniform };
  vertexShader?: string;
  fragmentShader?: string;

  // 内部使用的隐式属性 (对应 MaterialProperty/index.vue 中的 hidePropertyKey)
  _clearcoat?: number;
  _iridescence?: number;
  _sheen?: number;
}

export type MaterialConfig = {
  // 通用参数
  color?: string | number | THREE.Color;
  opacity?: number;
  transparent?: boolean;
  map?: THREE.Texture | null;
  alphaMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  wireframe?: boolean;

  // 线条材质参数
  linewidth?: number;
  dashSize?: number;
  gapSize?: number;

  // 点材质参数
  size?: number;
  sizeAttenuation?: boolean;

  // 精灵材质参数
  rotation?: number;

  // 着色器参数
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: { [key: string]: THREE.Uniform };

  // 物理/标准材质扩展参数
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;

  // Phong材质参数
  shininess?: number;
  specular?: THREE.Color;

  // 其他可能的材质参数
  matcap?: THREE.Texture | null;
  bumpScale?: number;
  [key: string]:
    | string
    | number
    | boolean
    | THREE.Color
    | THREE.Texture
    | THREE.Uniform
    | { [key: string]: THREE.Uniform }
    | undefined
    | null;
};

export type EditableValue =
  | string
  | number
  | boolean
  | THREE.Color
  | THREE.Texture
  | null
  | undefined;

export interface EditableProperty {
  label: string;
  key: string;
  value: EditableValue;
  valueType: string;
  customMapData: {
    visible?: boolean;
    texture?: THREE.Texture | null;
    image?: string | null;
  };
}

export interface UniformValue {
  value:
    | THREE.Texture
    | {
        dispose?: () => void;
      };
}

export interface MaterialWithUniforms extends THREE.Material {
  uniforms?: {
    [key: string]: UniformValue;
  };
}

export interface AnimationsList {
  name: string;
  uuid: string;
}
export interface ActionParams {
  loop: number;
  paused: boolean;
  weight: number;
  timeScale: number;
}

export interface ProjectConfigData {
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  shadowType: THREE.ShadowMapType;
  background: string | null;
  backgroundColor: string | null;
  backgroundMap: string | null;
  backgroundTexture: THREE.Texture | null;
  backgroundBlurriness: number;
  backgroundIntensity: number;
  environment: string | null;
  environmentMap: string | null;
  environmentTexture: THREE.Texture | null;
  fog: FOG_TYPE.None | FOG_TYPE.Fog | FOG_TYPE.FogExp2;
  fogColor: string | null;
  fogNear: number;
  fogFar: number;
  fogDensity: number;
}

export type LightHelperType =
  | THREE.DirectionalLightHelper
  | THREE.SpotLightHelper
  | THREE.PointLightHelper
  | THREE.HemisphereLightHelper;

export type AxisType = 'x' | 'y' | 'z';

export type TransformType = 'position' | 'rotation' | 'scale';

export interface PlaneGeometry {
  label: string;
  key: string;
  mapPath: string;
  normalMapPath: string;
}

export type ExportType = 'gltf' | 'glb' | 'obj' | 'stl' | 'usdz' | 'dae';

export interface EffectOptions {
  effectMethod: EFFECT_METHOD;
  clientX?: number;
  clientY?: number;
  name?: string;
}

export interface TextOptions {
  color: string;
  fontSize: number;
  textContent: string;
  textType?: TEXT_MATERIAL_TYPE;
}
