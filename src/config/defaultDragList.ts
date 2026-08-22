import { DRAG_MODEL_TYPE } from '@/enums/enum';

export { defaultModelList } from './warlordsCatalog';

// default geometry list
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
    radius: 0.5, // Radius
    height: 1.8, //cone height
    radialSegments: 8, // cone side segments
    heightSegments: 1, // height segments
    openEnded: false, //whether the cone base is open
    thetaStart: 0,
    thetaLength: 6.283185307179586, //circle sector sweep
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Cylinder',
    type: 'CylinderGeometry',
    radiusTop: 0.5,
    radiusBottom: 0.5,
    height: 1.8,
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
    radius: 0.5,
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
    radius: 0.5,
    tube: 0.15,
    radialSegments: 16,
    tubularSegments: 100,
    arc: 6.283185307179586,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: 'Torus knot',
    type: 'TorusKnotGeometry',
    radius: 0.5,
    tube: 0.15,
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

// geometry color list
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
