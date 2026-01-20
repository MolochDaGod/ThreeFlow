import { CANVAS_METHOD, DRAG_MODEL_TYPE, EFFECT_METHOD } from '@/enums/enum';

// 默认模型列表
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

// 默认几何体列表
export const defaultGeometryList = [
  {
    name: '立方体',
    type: 'BoxGeometry',
    width: 1, // X轴上面的宽度
    height: 1, // Y轴上面的高度
    depth: 1, // 轴上面的深度
    widthSegments: 1, //宽度的分段数
    heightSegments: 1, //高度的分段数
    depthSegments: 1, //深度的分段数
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '胶囊',
    type: 'CapsuleGeometry',
    radius: 0.5, // 胶囊半径
    length: 0.5, //中间区域的长度
    capSegments: 10, // 构造盖子的曲线部分的个数
    radialSegments: 10, //覆盖胶囊圆周的分离的面的个数
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '圆形',
    type: 'CircleGeometry',
    radius: 0.5, // 半径
    segments: 32, //分段（三角面）的数量
    thetaStart: 0, // 第一个分段的起始角度
    thetaLength: 6.44, //圆形扇区的中心角
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '圆锥',
    type: 'ConeGeometry',
    radius: 5, // 半径
    height: 10, //圆锥的高度
    radialSegments: 8, // 圆锥侧面周围的分段数
    heightSegments: 1, //圆形扇区的中心角
    openEnded: false, //指明该圆锥的底面是开放的还是封顶的
    thetaStart: 0,
    thetaLength: 6.283185307179586, //圆形扇区的中心角
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '圆柱',
    type: 'CylinderGeometry',
    radiusTop: 4,
    radiusBottom: 4,
    height: 8,
    radialSegments: 8,
    heightSegments: 1,
    openEnded: false,
    thetaStart: 0,
    thetaLength: 6.283185307179586, //圆形扇区的中心角
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '十二面体',
    type: 'DodecahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },

  {
    name: '二十面体',
    type: 'IcosahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '八面体',
    type: 'OctahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '平面',
    type: 'PlaneGeometry',
    width: 1, // X轴上面的宽度
    height: 1, // Y轴上面的高度
    widthSegments: 1, //宽度的分段数
    heightSegments: 1, //高度的分段数
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '圆环',
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
    name: '球',
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
    name: '四面体',
    type: 'TetrahedronGeometry',
    radius: 0.5,
    detail: 0,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '圆环',
    type: 'TorusGeometry',
    radius: 10,
    tube: 3,
    radialSegments: 16,
    tubularSegments: 100,
    arc: 6.283185307179586,
    modelType: DRAG_MODEL_TYPE.Geometry,
  },
  {
    name: '圆环扭结',
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

// 默认灯光列表
export const defaultLightList = [
  {
    name: '点光源',
    type: 'PointLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-dianguangyuan',
  },
  {
    name: '平行光源',
    type: 'DirectionalLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-pinghangguang1',
  },
  {
    name: '环境光',
    type: 'AmbientLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-huanjingguang1',
  },
  {
    name: '聚光灯',
    type: 'SpotLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-juguangdeng1',
  },
  {
    name: '半球光',
    type: 'HemisphereLight',
    modelType: DRAG_MODEL_TYPE.Light,
    iconClass: 'icon-banqiuguang1',
  },
];

// 几何体颜色列表
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
