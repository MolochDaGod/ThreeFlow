import * as THREE from 'three';

/**
 * 场景贴图映射类型
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
 * 变换控制器类型
 */
export enum TRANSFORM_CONTROLS_TYPE {
  Translate = 'translate',
  Rotate = 'rotate',
  Scale = 'scale',
}

/**
 * 几何体参数枚举
 */
export enum GEOMETRY_PARAMETERS {
  width = '宽度',
  height = '高度',
  depth = '深度',
  radius = '半径',
  segments = '分段',
  radiusSegments = '半径分段',
  widthSegments = '宽度分段',
  heightSegments = '高度分段',
  depthSegments = '深度分段',
  capSegments = '盖子分段',
  radialSegments = '圆周分段',
  thetaStart = '起始角度',
  thetaLength = '中心角',
  openEnded = '是否开放',
  detail = '细节',
  innerRadius = '内半径',
  outerRadius = '外半径',
  thetaSegments = '圆周分段',
  phiSegments = '圆周分段',
  phiStart = '起始角度',
  phiLength = '中心角',
  tubularSegments = '圆环分段',
  arc = '弧度',
  p = 'P',
  q = 'q',
  radiusBottom = '底部半径',
  radiusTop = '顶部半径',
  length = '长度',
  tube = '管',
  closed = '是否闭合',
  path = '路径',
}

export enum MATERIAL_DATA_ENUM {
  // 基础属性
  color = '材质颜色',
  transparent = '透明',
  // opacity = '不透明度',
  side = '渲染面',
  alphaTest = '透明度测试阈值',
  // wireframeLinewidth = '线框宽度',

  // 高光材质特有
  specular = '高光颜色',
  shininess = '高光强度',

  // 精灵材质特有
  rotation = '旋转角度',

  // 物理材质特有
  sheen = '织物绒毛效果',
  sheenRoughness = '织物绒毛粗糙度',
  sheenColor = '织物绒毛颜色',
  iridescence = '彩虹色',
  iridescenceIOR = '彩虹色折射率',
  // 深度材质特有
  depthPacking = '深度打包模式',
  // 法线材质特有
  // normalScale = '法线贴图缩放',

  // 环境光和发光
  emissive = '自发光颜色',
  // emissiveIntensity = '自发光强度',
  // aoMapIntensity = '环境遮挡强度',

  // 反射和光泽
  metalness = '金属度',
  roughness = '粗糙度',
  reflectivity = '反射率',
  refractionRatio = '折射率',
  transmission = '透光率',
  ior = '折射率',

  // 贴图相关
  map = '贴图',
  normalMap = '法线贴图',
  bumpMap = '凹凸贴图',
  displacementMap = '置换贴图',
  roughnessMap = '粗糙度贴图',
  metalnessMap = '金属度贴图',
  alphaMap = '透明度贴图',
  aoMap = '环境遮挡贴图',
  emissiveMap = '自发光贴图',
  iridescenceMap = '彩虹色贴图',
  lightMap = '光照贴图',
  // envMap = '环境贴图',

  // 线条材质特有
  linewidth = '线宽',
  dashSize = '虚线长度',
  gapSize = '虚线间隔',

  // 点材质特有
  size = '点大小',
  sizeAttenuation = '尺寸衰减',

  // 特殊效果
  wireframe = '线框模式',
  combine = '混合模式',

  // 标准材质特有
  // envMapIntensity = '环境贴图强度',
  clearcoat = '清漆层强度',
  // _clearcoat = '清漆层强度',
  clearcoatRoughness = '清漆层粗糙度',

  // 深度和混合
  depthTest = '深度测试',
  depthWrite = '深度写入',
  blending = '混合模式',

  // 动画相关
  morphTargets = '变形目标',
  morphNormals = '法线变形',

  // 光照计算
  vertexColors = '顶点颜色',
}

/**
 * 背景类型
 */
export enum BACKGROUND_TYPE {
  NoBackground = 'not',
  Color = 'color',
  Texture = 'texture',
  Video = 'video',
}

/**
 * 环境类型
 */
export enum ENVIRONMENT_TYPE {
  NoEnvironment = 'not',
  Environment = 'environment',
}

/**
 * 拖拽模型类型
 */
export enum DRAG_MODEL_TYPE {
  Model = 'model',
  Geometry = 'geometry',
  Light = 'light',

}

/**
 * 灯光图标类型
 */
export enum LIGHT_ICON_TYPE {
  DirectionalLight = 'icon-pinghangguang1',
  PointLight = 'icon-dianguangyuan',
  SpotLight = 'icon-juguangdeng1',
  HemisphereLight = 'icon-banqiuguang1',
  AmbientLight = 'icon-huanjingguang1',
}
/**
 * 雾类型
 */
export enum FOG_TYPE {
  None = 'none',
  Fog = 'Fog',
  FogExp2 = 'FogExp2',
}

/**
 * 场景对象名称
 */
export enum MITT_ON_KEY {
  PAGE_LOADING = 'pageLoading',
  SCENE_LOADING = 'sceneLoading',
}

/**
 * 导出类型
 */
export enum EXPORT_TYPE {
  GLTF = 'gltf',
  GLB = 'glb',
  OBJ = 'obj',
  STL = 'stl',
  USDZ = 'usdz',
}

/**
 * 场景对象名称
 */
export enum SCENE_OBJECT_NAME {
  PerspectiveCamera = 'PerspectiveCamera',
}

/**
 * 天气类型
 */
export enum WEATHER_TYPE {
  None = 'none',
  Rain = 'rain',
  Snow = 'snow',
}

/**
 * 特效类型
 */
export enum EFFECT_METHOD {
  CreateFireEffect = 'CreateFireEffect',
  CreateSmokeEffect = 'CreateSmokeEffect',
  CreateFireworkEffect = 'CreateFireworkEffect',
}

/**
 * 特效参数类型
 */
export enum EFFECT_PARAMS_TYPE {
  Color = 'color',
  Size = 'size',
  Height = 'height',
  Range = 'range',
  ParticleCount = 'particleCount',
}

/**
 * 灯光类型
 */
export enum LIGHT_TYPE {
  DirectionalLight = 'DirectionalLight',
  PointLight = 'PointLight',
  SpotLight = 'SpotLight',
  HemisphereLight = 'HemisphereLight',
  AmbientLight = 'AmbientLight',
}

/**
 * 模型类型
 */
export enum MODEL_TYPE {
  GLTF = 'gltf',
  GLB = 'glb',
  OBJ = 'obj',
  STL = 'stl',
  USDZ = 'usdz',
}

/**
 * 文本canvas类型
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
 * 文本材质类型
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