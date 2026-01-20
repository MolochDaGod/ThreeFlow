export interface MaterialNode {
  label?: string;
  uuid: string;
  type?: string;
  children?: MaterialNode[];
}

export type ParametersType = Record<string, number | string | boolean> | null;

export interface TransformMaterial {
  // Mesh properties
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];

  // Light properties
  color?: THREE.Color;
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  power?: number;
  // Common properties
  type: string;
  name: string;
  visible: boolean;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  castShadow: boolean;
  receiveShadow: boolean;
  frustumCulled: boolean;

  // Group properties
  children?: THREE.Object3D[];

  // Light specific properties
  shadow?: THREE.LightShadow & THREE.SpotLightShadow;
  target?: THREE.Object3D;

  // SkinnedMesh properties
  skeleton?: THREE.Skeleton;
  bindMode?: string;
  bindMatrix?: THREE.Matrix4;
  bindMatrixInverse?: THREE.Matrix4;

  // Camera properties
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  zoom?: number;

  isLight?: boolean;
  // SpotLight specific
  isSpotLight?: boolean;
  map?: THREE.Texture;

  // DirectionalLight specific
  isDirectionalLight?: boolean;

  // PointLight specific
  isPointLight?: boolean;

  // HemisphereLight specific
  isHemisphereLight?: boolean;
  groundColor?: THREE.Color;
  userData?: {
    [key: string]: string | number | boolean;
  };
  isPoints?: boolean;
  isSprite?: boolean;
  // Methods
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
export interface MaterialData {
  type: string;
  [key: string]: boolean | number | string;
}

import type { EFFECT_METHOD, FOG_TYPE ,TEXT_MATERIAL_TYPE} from '@/enums/enum';
import * as THREE from 'three';

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

export interface EditableProperty {
  label: string;
  key: string;
  value: string | number | boolean;
  valueType: string;
  customMapData: Record<string, any>;
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
