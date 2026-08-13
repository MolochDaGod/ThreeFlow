import * as THREE from 'three';

/**
 * tone mapping types
 */
export enum TEMPLATE_MAPPING_TYPE {
  NoToneMapping = THREE.NoToneMapping,
  LinearToneMapping = THREE.LinearToneMapping,
  ReinhardToneMapping = THREE.ReinhardToneMapping,
  CineonToneMapping = THREE.CineonToneMapping,
  ACESFilmicToneMapping = THREE.ACESFilmicToneMapping,
  AgXToneMapping = THREE.AgXToneMapping,
  NeutralToneMapping = THREE.NeutralToneMapping,
  CustomToneMapping = THREE.CustomToneMapping,
}

/**
 * transform control types
 */
export enum TRANSFORM_CONTROLS_TYPE {
  Translate = 'translate',
  Rotate = 'rotate',
  Scale = 'scale',
}

/**
 * geometry parameter labels
 */
export enum GEOMETRY_PARAMETERS {
  width = 'Width',
  height = 'Height',
  depth = 'Depth',
  radius = 'Radius',
  segments = 'Segments',
  radiusSegments = 'Radius segments',
  widthSegments = 'Width segments',
  heightSegments = 'Height segments',
  depthSegments = 'Depth segments',
  capSegments = 'Cap segments',
  radialSegments = 'Radial segments',
  thetaStart = 'Start angle',
  thetaLength = 'Sweep angle',
  openEnded = 'Open ended',
  detail = 'Detail',
  innerRadius = 'Inner radius',
  outerRadius = 'Outer radius',
  thetaSegments = 'Radial segments',
  phiSegments = 'Radial segments',
  phiStart = 'Start angle',
  phiLength = 'Sweep angle',
  tubularSegments = 'Tube segments',
  arc = 'Arc',
  p = 'P',
  q = 'q',
  radiusBottom = 'Bottom radius',
  radiusTop = 'Top radius',
  length = 'Length',
  tube = 'Tube',
  closed = 'Closed',
  path = 'Path',
}

export enum MATERIAL_DATA_ENUM {
  // base properties
  color = 'Color',
  transparent = 'Transparent',
  // opacity = 'opacity',
  side = 'Side',
  alphaTest = 'Alpha test',
  // wireframeLinewidth = 'wireframe width',

  // phong-only
  specular = 'Specular',
  shininess = 'Shininess',

  // sprite-only
  rotation = 'Rotation',

  // physical-only
  sheen = 'Sheen',
  sheenRoughness = 'Sheen roughness',
  sheenColor = 'Sheen color',
  iridescence = 'Iridescence',
  iridescenceIOR = 'Iridescence IOR',
  // depth-only
  depthPacking = 'Depth packing',
  // normal-only
  // normalScale = 'Normal mapScale',

  // emissive
  emissive = 'Emissive',
  // emissiveIntensity = 'emissive intensity',
  // aoMapIntensity = 'AO intensity',

  // reflection
  metalness = 'Metalness',
  roughness = 'Roughness',
  reflectivity = 'Reflectivity',
  refractionRatio = 'IOR',
  transmission = 'Transmission',
  ior = 'IOR',

  // maps
  map = 'Map',
  normalMap = 'Normal map',
  bumpMap = 'Bump map',
  displacementMap = 'Displacement map',
  roughnessMap = 'Roughness map',
  metalnessMap = 'Metalness map',
  alphaMap = 'Alpha map',
  aoMap = 'AO map',
  emissiveMap = 'Emissive map',
  iridescenceMap = 'Iridescence map',
  lightMap = 'Light map',
  // envMap = 'EnvironmentMap',

  // line-only
  linewidth = 'Line width',
  dashSize = 'Dash size',
  gapSize = 'Gap size',

  // points-only
  size = 'Point size',
  sizeAttenuation = 'Size attenuation',

  // effects
  wireframe = 'Wireframe',
  combine = 'Blending',

  // standard-only
  // envMapIntensity = 'EnvironmentMapIntensity',
  clearcoat = 'Clearcoat',
  // _clearcoat = 'Clearcoat',
  clearcoatRoughness = 'Clearcoat roughness',

  // depth and blending
  depthTest = 'Depth test',
  depthWrite = 'Depth write',
  blending = 'Blending',

  // animation
  morphTargets = 'Morph targets',
  morphNormals = 'Morph normals',

  // lighting
  vertexColors = 'Vertex colors',
}

/**
 * background types
 */
export enum BACKGROUND_TYPE {
  NoBackground = 'not',
  Color = 'color',
  Texture = 'texture',
  Video = 'video',
}

/**
 * environment types
 */
export enum ENVIRONMENT_TYPE {
  NoEnvironment = 'not',
  Environment = 'environment',
}

/**
 * drag model types
 */
export enum DRAG_MODEL_TYPE {
  Model = 'model',
  Geometry = 'geometry',
  Light = 'light',

}

/**
 * light icon types
 */
export enum LIGHT_ICON_TYPE {
  DirectionalLight = 'icon-pinghangguang1',
  PointLight = 'icon-dianguangyuan',
  SpotLight = 'icon-juguangdeng1',
  HemisphereLight = 'icon-banqiuguang1',
  AmbientLight = 'icon-huanjingguang1',
}
/**
 * fog types
 */
export enum FOG_TYPE {
  None = 'none',
  Fog = 'Fog',
  FogExp2 = 'FogExp2',
}

/**
 * scene object names
 */
export enum MITT_ON_KEY {
  PAGE_LOADING = 'pageLoading',
  SCENE_LOADING = 'sceneLoading',
}

/**
 * export types
 */
export enum EXPORT_TYPE {
  GLTF = 'gltf',
  GLB = 'glb',
  OBJ = 'obj',
  STL = 'stl',
  USDZ = 'usdz',
}

/**
 * scene object names
 */
export enum SCENE_OBJECT_NAME {
  PerspectiveCamera = 'PerspectiveCamera',
}

/**
 * weather types
 */
export enum WEATHER_TYPE {
  None = 'none',
  Rain = 'rain',
  Snow = 'snow',
}

/**
 * effect types
 */
export enum EFFECT_METHOD {
  CreateFireEffect = 'CreateFireEffect',
  CreateSmokeEffect = 'CreateSmokeEffect',
  CreateFireworkEffect = 'CreateFireworkEffect',
}

/**
 * effect param types
 */
export enum EFFECT_PARAMS_TYPE {
  Color = 'color',
  Size = 'size',
  Height = 'height',
  Range = 'range',
  ParticleCount = 'particleCount',
}

/**
 * light types
 */
export enum LIGHT_TYPE {
  DirectionalLight = 'DirectionalLight',
  PointLight = 'PointLight',
  SpotLight = 'SpotLight',
  HemisphereLight = 'HemisphereLight',
  AmbientLight = 'AmbientLight',
}

/**
 * model types
 */
export enum MODEL_TYPE {
  GLTF = 'gltf',
  GLB = 'glb',
  OBJ = 'obj',
  STL = 'stl',
  USDZ = 'usdz',
}

/**
 * text canvas types
 */
export enum CANVAS_METHOD {
  CreateFixedCanvas = 'CreateFixedCanvas',
  CreateMotionCanvas = 'CreateMotionCanvas',
  CreateModernCanvas = 'CreateModernCanvas',
  CreateTechCanvas = 'CreateTechCanvas',
  CreateFashionCanvas = 'CreateFashionCanvas',
  CreatePlainTextCanvas = 'CreatePlainTextCanvas',
  CreateWesternCanvas = 'CreateWesternCanvas',
  CreateCampusCanvas = 'CreateCampusCanvas',
  CreateIversonCanvas = 'CreateIversonCanvas',
}

/**
 * 文本material types
 */
export enum TEXT_MATERIAL_TYPE {
  Sprite = 'Sprite',
  Mesh = 'Mesh',
}

export enum TAB_TYPE {
  Property = 'property',
  Material = 'material',
  Geometry = 'geometry',
  Animation = 'animation',
}