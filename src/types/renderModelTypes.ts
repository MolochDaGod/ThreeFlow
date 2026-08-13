import type { CANVAS_METHOD, EFFECT_METHOD, LIGHT_TYPE, MODEL_TYPE, TEXT_MATERIAL_TYPE } from '@/enums/enum';
import * as THREE from 'three';
import { type GLTF } from 'three/addons/loaders/GLTFLoader.js';

export type animations = THREE.AnimationClip[];
export type fileResultType = GLTF | THREE.Group | THREE.BufferGeometry;

export interface SceneConfigInterface {
  backgroundIntensity: number;
  backgroundBlurriness: number;
  backgroundRotation: number;
}

export interface RendererConfigInterface {
  toneMappingExposure: number;
  toneMapping: string | THREE.Mapping;
  ambientLightIntensity: number;
}

export interface MaterialConfigInterface {
  type: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenRoughness: number;
  transmission: number;
  iridescence: number;
  iridescenceIOR: number;
}

export interface ModelType {
  filePath: string;
  fileType: MODEL_TYPE;
  icon?: string;
  id: number | string;
  key: string;
  name: string;
  group?: string;
}

export interface GeometryType {
  type:
    | 'BoxGeometry'
    | 'SphereGeometry'
    | 'CylinderGeometry'
    | 'ConeGeometry'
    | 'TorusGeometry'
    | 'CapsuleGeometry'
    | 'CircleGeometry'
    | 'PlaneGeometry'
    | 'TetrahedronGeometry'
    | 'OctahedronGeometry'
    | 'DodecahedronGeometry'
    | 'IcosahedronGeometry';
  name: string;
  [key: string]: string | number | boolean;
}

export interface LightType {
  type: LIGHT_TYPE;
  name: string;
}

export interface EchartsType {
  clientX: number;
  clientY: number;
  modelType?: string;
  modelData: {
    type: string;
    height: number;
    width: number;
    name: string;
    options: {
      [key: string]: string | number | boolean;
    };
  };
}

export interface CurrentDragModelData {
  clientX: number;
  clientY: number;
  modelType: string;
  modelData:
    | GeometryType
    | ModelType
    | LightType
    | EffectType
    | EchartsType
    | EffectData
    | TextData
    | null;
}

export type EffectType = {
  name: string;
  method?: EFFECT_METHOD;
  modelType?: string;
  icon?: string;
};

export type DragModelType =
  | GeometryType
  | ModelType
  | EffectType
  | LightType
  | EchartsType
  | null;

export interface MaterialData {
  uuid: string;
  name: string;
  iconClass?: string;
  type: string;
}

export interface ModelData {
  uuid: string;
  name: string;
  children?: MaterialData[]; // 使用可选Properties
}

export interface EffectData {
  name: string;
  effectMethod: EFFECT_METHOD;
  icon?: string;
  effectParams?: EffectParamsOptions;
}

export interface TextData {
  name: string;
  textMethod: CANVAS_METHOD;
  icon?: string;
  textOptions?: {
    color: string;
    fontSize: number;
    textContent: string;
    textType?: TEXT_MATERIAL_TYPE;
  };
}

export interface EffectParamsOptions {
  color?: string | { r: number; g: number; b: number };
  size?: number;
  height?: number;
  range?: number;
  particleCount?: number;
}

export interface WeatherOptions {
  weather?: WeatherType; // weather types
  count?: number; // 粒子数量
  speed?: number; // 下落速度
  size?: number; // 粒子大小
  opacity?: number; // Transparent度
  color?: string; // color
  area?: number; // 覆盖区域范围
  height?: number; // 下落Height
  planeGeometry?: string | null; // 地面Material
}
export type WeatherType = 'rain' | 'snow' | 'none';

export type MaterialType = {
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  alphaMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  emissiveMap?: THREE.Texture;
};

export type SelectLightType =
  | THREE.DirectionalLightHelper
  | THREE.PointLightHelper
  | THREE.SpotLightHelper;

export interface TubeGeometryType {
  type: 'TubeGeometry';
}

export interface UserData {
  playAnimationNameList?: string[];
  type?: string;
  effectMethod?: EFFECT_METHOD;
  effectParams?: EffectParamsOptions;
  isTransformControls?: boolean;
  helperUuid?: string;
  helperVisible?: boolean;
  lightHelper?: boolean;
  planeGeometry?: string | null;
  isSTLModel?: boolean;
}