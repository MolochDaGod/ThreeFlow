export interface MaterialNode {
  label?: string;
  uuid: string;
  type?: string;
  name?: string;
  kind?: string;
  iconClass?: string;
  children?: MaterialNode[];
}

export type ParametersType = Record<string, number | string | boolean> | null;

export interface TransformMaterial {
  // Mesh Properties
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];

  // Light Properties
  color?: THREE.Color;
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  power?: number;
  // Common Properties
  type: string;
  name: string;
  visible: boolean;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  castShadow: boolean;
  receiveShadow: boolean;
  frustumCulled: boolean;

  // Group children
  children?: THREE.Object3D[];

  // Light Properties
  shadow?: THREE.LightShadow & THREE.SpotLightShadow;
  target?: THREE.Object3D;

  // SkinnedMesh Properties
  skeleton?: THREE.Skeleton;
  bindMode?: string;
  bindMatrix?: THREE.Matrix4;
  bindMatrixInverse?: THREE.Matrix4;

  // Camera Properties
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  zoom?: number;

  isLight?: boolean;
  // SpotLight Properties
  isSpotLight?: boolean;
  map?: THREE.Texture;

  // DirectionalLight Properties
  isDirectionalLight?: boolean;

  // PointLight Properties
  isPointLight?: boolean;

  // HemisphereLight Properties
  isHemisphereLight?: boolean;
  groundColor?: THREE.Color;
  userData?: {
    [key: string]: string | number | boolean;
  };
  isPoints?: boolean;
  isSprite?: boolean;
  // methods
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

import type { EFFECT_METHOD, FOG_TYPE, TEXT_MATERIAL_TYPE } from '@/enums/enum';
import * as THREE from 'three';

/**
 * Materialdata shape
 * All supported material properties. Typed.
 */
export interface MaterialData {
  // base properties
  type: string;
  uuid?: string;
  name?: string;
  color?: THREE.Color | string | number;
  transparent?: boolean;
  opacity?: number;
  visible?: boolean;
  side?: THREE.Side;
  alphaTest?: number;
  isMaterial?: boolean;

  // maps
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

  // physical/standardMaterialProperties
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

  // PBR advancedProperties
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

  // Phong/Lambert MaterialProperties
  specular?: THREE.Color | string | number;
  shininess?: number;
  combine?: THREE.Combine;

  // line/pointMaterialProperties
  linewidth?: number;
  dashSize?: number;
  gapSize?: number;
  scale?: number; // LineDashedMaterial
  size?: number;
  sizeAttenuation?: boolean;

  // Sprite MaterialProperties
  rotation?: number;

  // common renderProperties
  wireframe?: boolean;
  wireframeLinewidth?: number;
  flatShading?: boolean;
  depthTest?: boolean;
  depthWrite?: boolean;
  depthPacking?: number; // MeshDepthMaterial
  blending?: THREE.Blending;

  // Animation/morph
  morphTargets?: boolean;
  morphNormals?: boolean;

  // other
  vertexColors?: boolean;
  fog?: boolean;
  shadowSide?: THREE.Side;

  // ShaderMaterial
  uniforms?: { [key: string]: THREE.Uniform };
  vertexShader?: string;
  fragmentShader?: string;

  // internal implicitProperties (maps to MaterialProperty/index.vue hidePropertyKey)
  _clearcoat?: number;
  _iridescence?: number;
  _sheen?: number;
}

export type MaterialConfig = {
  // common parameters
  color?: string | number | THREE.Color;
  opacity?: number;
  transparent?: boolean;
  map?: THREE.Texture | null;
  alphaMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  wireframe?: boolean;

  // lineMaterialparams
  linewidth?: number;
  dashSize?: number;
  gapSize?: number;

  // pointMaterialparams
  size?: number;
  sizeAttenuation?: boolean;

  // spriteMaterialparams
  rotation?: number;

  // shader params
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: { [key: string]: THREE.Uniform };

  // physical/standardMaterialextra params
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;

  // PhongMaterialparams
  shininess?: number;
  specular?: THREE.Color;

  // other possibleMaterialparams
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
  string | number | boolean | THREE.Color | THREE.Texture | null | undefined;

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
