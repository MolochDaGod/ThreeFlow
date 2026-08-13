import { CANVAS_METHOD, DRAG_MODEL_TYPE, EFFECT_METHOD } from '@/enums/enum';

// default model list
export const defaultModelList = [
  {
    name: 'characterMan',
    key: 'characterMan',
    isAnimation: true,
    fileType: 'glb',
    id: 1,
    filePath: 'threeFile/glb/glb-1.glb',
    icon: new URL(`../assets/previewIcon/1.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'police',
    key: 'police',
    fileType: 'glb',
    id: 2,
    filePath: 'threeFile/glb/glb-2.glb',
    icon: new URL(`../assets/previewIcon/2.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'police2',
    key: 'police2',
    fileType: 'glb',
    id: 3,
    filePath: 'threeFile/glb/glb-3.glb',
    icon: new URL(`../assets/previewIcon/3.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'characterMan2',
    key: 'characterMan2',
    fileType: 'glb',
    id: 4,
    filePath: 'threeFile/glb/glb-4.glb',
    icon: new URL(`../assets/previewIcon/4.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'characterWoman',
    key: 'characterWoman',
    fileType: 'glb',
    id: 5,
    filePath: 'threeFile/glb/glb-5.glb',
    icon: new URL(`../assets/previewIcon/5.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'caravan',
    key: 'caravan',
    fileType: 'glb',
    id: 6,
    filePath: 'threeFile/glb/glb-6.glb',
    icon: new URL(`../assets/previewIcon/6.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'policeCar',
    key: 'policeCar',
    fileType: 'glb',
    id: 8,
    filePath: 'threeFile/glb/glb-8.glb',
    icon: new URL(`../assets/previewIcon/8.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'taxi',
    key: 'taxi',
    fileType: 'glb',
    id: 9,
    filePath: 'threeFile/glb/glb-9.glb',
    icon: new URL(`../assets/previewIcon/9.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'bus',
    key: 'bus',
    fileType: 'glb',
    id: 10,
    filePath: 'threeFile/glb/glb-10.glb',
    icon: new URL(`../assets/previewIcon/10.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'tree1',
    key: 'tree1',
    fileType: 'glb',
    id: 11,
    filePath: 'threeFile/glb/glb-11.glb',
    icon: new URL(`../assets/previewIcon/11.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'tree2',
    key: 'tree2',
    fileType: 'glb',
    id: 12,
    filePath: 'threeFile/glb/glb-12.glb',
    icon: new URL(`../assets/previewIcon/12.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },

  {
    name: 'tree4',
    key: 'tree4',
    fileType: 'glb',
    id: 14,
    filePath: 'threeFile/glb/glb-14.glb',
    icon: new URL(`../assets/previewIcon/14.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'building',
    key: 'building',
    fileType: 'glb',
    id: 15,
    filePath: 'threeFile/glb/glb-15.glb',
    icon: new URL(`../assets/previewIcon/15.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
  },
  {
    name: 'building2',
    key: 'building2',
    fileType: 'glb',
    id: 16,
    icon: new URL(`../assets/previewIcon/16.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
    filePath: 'threeFile/glb/glb-16.glb',
  },
  {
    name: 'building3',
    key: 'building3',
    fileType: 'glb',
    id: 17,
    icon: new URL(`../assets/previewIcon/17.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
    filePath: 'threeFile/glb/glb-17.glb',
  },
  {
    name: 'building4',
    key: 'building4',
    fileType: 'glb',
    id: 18,
    icon: new URL(`../assets/previewIcon/18.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
    filePath: 'threeFile/glb/glb-18.glb',
  },
  {
    name: 'tiger',
    key: 'tiger',
    fileType: 'glb',
    id: 19,
    isAnimation: true,
    icon: new URL(`../assets/previewIcon/19.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
    filePath: 'threeFile/glb/glb-19.glb',
  },
  {
    name: 'horse',
    key: 'horse',
    fileType: 'glb',
    id: 20,
    isAnimation: true,
    icon: new URL(`../assets/previewIcon/20.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
    filePath: 'threeFile/glb/glb-20.glb',
  },
  {
    name: 'cow',
    key: 'cow',
    fileType: 'glb',
    id: 21,
    isAnimation: true,
    icon: new URL(`../assets/previewIcon/21.png`, import.meta.url).href,
    modelType: DRAG_MODEL_TYPE.Model,
    filePath: 'threeFile/glb/glb-21.glb',
  },
];

// 默认geometry list
export const defaultGeometryList = [
  {
    name: 'Box',
    type: 'BoxGeometry',
    width: 1, // width on X
    height: 1, // height on Y
    depth: 1, // depth on Z
    widthSegments: 1, //width segments
    heightSegments: 1, //height segments
    depthSegments: 1, //depth segments
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Capsule',
    type: 'CapsuleGeometry',
    radius: 0.5, // CapsuleRadius
    length: 0.5, //cylinder length
    capSegments: 10, // cap curve segments
    radialSegments: 10, //radial faces around capsule
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Circle',
    type: 'CircleGeometry',
    radius: 0.5, // Radius
    segments: 32, //triangle segments
    thetaStart: 0, // first segment start angle
    thetaLength: 6.44, //circle sector sweep
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Cone',
    type: 'ConeGeometry',
    radius: 5, // Radius
    height: 10, //cone height
    radialSegments: 8, // cone side segments
    heightSegments: 1, //circle sector sweep
    openEnded: false, //whether the cone base is open
    thetaStart: 0,
    thetaLength: 6.283185307179586, //circle sector sweep
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Cylinder',
    type: 'CylinderGeometry',
    radiusTop: 4,
    radiusBottom: 4,
    height: 8,
    radialSegments: 8,
    heightSegments: 1,
    openEnded: false,
    thetaStart: 0,
    thetaLength: 6.283185307179586, //circle sector sweep
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Dodecahedron',
    type: 'DodecahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },

  {
    name: 'Icosahedron',
    type: 'IcosahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Octahedron',
    type: 'OctahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Plane',
    type: 'PlaneGeometry',
    width: 1, // width on X
    height: 1, // height on Y
    widthSegments: 1, //width segments
    heightSegments: 1, //height segments
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Ring',
    type: 'RingGeometry',
    innerRadius: 0.44,
    outerRadius: 0.67,
    thetaSegments: 8,
    phiSegments: 1,
    thetaStart: 0,
    thetaLength: 6.29,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Sphere',
    type: 'SphereGeometry',
    radius: 15,
    widthSegments: 32,
    heightSegments: 16,
    phiStart: 0,
    phiLength: 6.283185307179586,
    thetaStart: 0,
    thetaLength: 3.141592653589793,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Tetrahedron',
    type: 'TetrahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Torus',
    type: 'TorusGeometry',
    radius: 10,
    tube: 3,
    radialSegments: 16,
    tubularSegments: 100,
    arc: 6.283185307179586,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Torus knot',
    type: 'TorusKnotGeometry',
    radius: 10,
    tube: 3,
    tubularSegments: 161,
    radialSegments: 8,
    P: 2,
    q: 3,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
];

// default light list
export const defaultLightList = [
  {
    name: 'Point light',
    type: 'PointLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-dianguangyuan',
  },
  {
    name: 'Directional light',
    type: 'DirectionalLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-pinghangguang1',
  },
  {
    name: 'Ambient light',
    type: 'AmbientLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-huanjingguang1',
  },
  {
    name: 'Spot light',
    type: 'SpotLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-juguangdeng1',
  },
  {
    name: 'Hemisphere light',
    type: 'HemisphereLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-banqiuguang1',
  },
];

// Geometrycolor列表
export const geometryColorList = [
  '#FF4500',
  '#90EE90',
  '#00CED1',
  '#1E90FF',
  '#C71585',
  '#FF4500',
  '#FAD400',
  '#1F93FF',
  '#90F090',
  '#C71585',
];
