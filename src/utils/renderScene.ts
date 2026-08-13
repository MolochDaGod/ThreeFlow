import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { USDLoader } from 'three/addons/loaders/USDLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ObjectLoader } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { ElMessage, ElNotification } from 'element-plus';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ViewportGizmo } from 'three-viewport-gizmo';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import AnimationModules from './sceneModules/animationModules';
import TransformControlsModules from './sceneModules/transformControlsModules';
import LightModules from './sceneModules/lightModules';
import HistoryModules from './historyModules';
import type { Command } from './historyModules/command';
import type {
  CurrentDragModelData,
  GeometryType,
  TubeGeometryType,
  LightType,
  MaterialType,
} from '@/types/renderModelTypes';
import type {
  MaterialConfig,
  MaterialNode,
  ParametersType,
} from '@/types/rightPanelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import { useIndexDbStore } from '@/store/indexDbStore';
import { IndexDbStoreName, IndexDbStoreKeyPath } from '@/enums/indexDb';
import { createMaterial, disposeMaterial, disposeScene } from './utils';
import type { IndexDbSceneData } from '@/types/indexDbTypes';
import type { ActionParams } from '@/types/rightPanelTypes';
import { FOG_COLOR_VALUE } from '@/config/constant';
import type { LIGHT_TYPE, MODEL_TYPE } from '@/enums/enum';
import {
  createModelFromResult,
  getMousePosition,
  setModelPositionSize,
} from './sceneModules';
import { kindFromGroup, type PlaceKind } from './siPlace';
import {
  bootstrapRaceKit,
  findRaceKitRoot,
  raceIdFromName,
  setHoverMesh,
} from './raceKit';
import { snapObjectToTerrain, tagTerrain } from './terrainGround';
import {
  generateDs2Terrain,
  type Ds2PresetId,
  type Ds2Quality,
} from './sceneModules/ds2Terrain';

const store = useSceneStore();

class renderScene {
  // 相机实例
  camera: THREE.PerspectiveCamera | null;
  // Renderer实例
  renderer: THREE.WebGLRenderer | null;
  // Scene实例
  scene: THREE.Scene | null;
  // 控制器实例
  controls: OrbitControls | null;
  // 指针锁定控制器实例
  pointerLockControls: PointerLockControls | null;
  moveSpeed: number;
  keys: { [key: string]: boolean };
  // 容器DOM元素
  container: HTMLElement | null;
  // 文件加载器映射表
  fileLoaderMap: Record<string, THREE.Loader>;
  // Models加载进度回调函数
  modelProgressCallback: ((loaded: number, total: number) => void) | null;
  // 窗口大小变化监听器
  onWindowResizesListener: (() => void) | null;
  // 键盘按下事件监听器
  onKeyDownListener: (event: KeyboardEvent) => void;
  // 键盘松开事件监听器
  onKeyUpListener: (event: KeyboardEvent) => void;
  // 鼠标点击事件监听器
  onPointerUnLockListener: () => void;
  // Animation帧请求ID
  renderAnimation: number | null;
  // Modelsloading state
  loadingStatus: boolean;
  boxHelper: THREE.BoxHelper | null;
  // Animation模块实例
  animationModules: {
    playAnimation: (animation: THREE.AnimationClip, model: THREE.Group) => void;
    updateAnimationParams: (action: ActionParams, uuid: string) => void;
    updateActionAnimationMap: (mapId: string, uuid: string) => void;
    currentActions: Map<string, THREE.AnimationAction[]>;
    clear: () => void;
    initializeAnimations: () => void;
  };
  // 光源模块实例
  lightModules: {
    createLight: (type: LIGHT_TYPE, position: THREE.Vector3) => void;
    updateHelper: (uuid?: string) => void;
    initLight: () => void;
  };
  // 变换控制器模块实例
  transformControlsModules: {
    init: () => void;
    transformControls: TransformControls | null;
    transformControlsHelper: THREE.Object3D | null;
    focusOnObject: (object: THREE.Object3D) => void;
    destroy: () => void;
    createTransformControls: () => void;
    clearCurrentSelection: () => void;
  };
  // 历史记录模块实例
  historyModules: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    execute: (command: Command) => void;
  };
  // 视图辅助器实例
  viewHelper: ViewportGizmo | null;
  constructor(selector: string) {
    this.container = document.querySelector(selector);
    this.camera = null;
    this.renderer = null;
    this.scene = null;
    this.controls = null;
    this.pointerLockControls = null;
    this.moveSpeed = 1;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };
    this.fileLoaderMap = {
      glb: new GLTFLoader(),
      fbx: new FBXLoader(),
      gltf: new GLTFLoader(),
      obj: new OBJLoader(),
      stl: new STLLoader(),
      usdz: new USDLoader(),
    };
    this.modelProgressCallback = null;
    this.onWindowResizesListener = null;
    this.onKeyDownListener = () => {};
    this.onKeyUpListener = () => {};
    this.onPointerUnLockListener = () => {};
    this.renderAnimation = null;
    this.loadingStatus = true;
    this.boxHelper = null;
    this.animationModules = new AnimationModules();
    this.lightModules = new LightModules();
    this.transformControlsModules = new TransformControlsModules();
    this.historyModules = new HistoryModules();
    this.viewHelper = null;
  }
  /**
   * 初始化Scene
   * @returns Promise<boolean>
   */
  init(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.container) {
        reject(new Error('Container not found'));
        return;
      }
      this.initCamera();
      this.initRender();
      await this.initScene();
      await this.initControls();
      this.transformControlsModules.init();
      // 获取indexDbScene数据
      const indexDbStore = useIndexDbStore();
      let loadSceneData: IndexDbSceneData | null = null;
      if (indexDbStore.indexDbUtil) {
        loadSceneData = await indexDbStore.indexDbUtil.get<IndexDbSceneData>(
          IndexDbStoreName.scene,
          IndexDbStoreKeyPath.sceneBlobData
        );
      }

      if (loadSceneData) {
        await this.loadIndexDbSceneData(loadSceneData);
      } else {
        await this.initPlaneGround();
      }
      this.sceneAnimation();
      this.addEvenListMouseListener();
      this.onWindowResizes();
      resolve(true);
    });
  }
  /**
   * 初始化Renderer
   */
  initRender(): void {
    if (!this.container) return;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // 开启硬件抗锯齿
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance', // 优先使用高性能GPU
    });
    this.renderer.setClearColor(0xcccccc);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制最大像素比为2
    const { offsetWidth, offsetHeight } = this.container;
    this.renderer.setSize(offsetWidth, offsetHeight);
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);
  }
  /**
   * 初始化相机
   */
  initCamera(): void {
    if (!this.container) return;
    const { offsetWidth, offsetHeight } = this.container;

    const aspectRatio = offsetWidth / offsetHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.05, 20000);
    this.camera.position.set(0.607, 3.347, 7.966);
    this.camera.rotation.set(-0.304, 0.048, 0.016);
    this.camera.name = 'Camera';
    this.camera.updateProjectionMatrix();
  }
  /**
   * 初始化Scene
   */
  async initScene(): Promise<void> {
    this.scene = new THREE.Scene();
    const hdrLoader = new HDRLoader();
    const texture = await hdrLoader.loadAsync('hdr/view-hdr-11.hdr');
    texture.mapping = THREE.EquirectangularReflectionMapping;

    this.scene.background = new THREE.Color(FOG_COLOR_VALUE);

    this.scene.environment = texture;
    texture.dispose();
    // 调整Environment光Intensity;
    this.scene.backgroundIntensity = 1;
    this.scene.fog = new THREE.FogExp2(FOG_COLOR_VALUE, 0.001);

    return Promise.resolve();
  }
  /**
   * 初始化地面
   */
  async initPlaneGround(loadSceneData?: IndexDbSceneData) {
    try {
      let planeGeometryType: string;
      // 获取地面类型
      planeGeometryType = loadSceneData?.weather?.planeGeometry || 'brick';
      if (planeGeometryType === 'none') return;
      if (!this.scene) return;

      const map = await new THREE.TextureLoader().loadAsync(
        new URL(`../assets/textures/textures-5.png`, import.meta.url).href
      );

      map.repeat.set(1000, 1000);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 16;
      map.colorSpace = THREE.SRGBColorSpace;
      // 可选：加载Normal map
      const normalMap = await new THREE.TextureLoader().loadAsync(
        new URL(`../assets/textures/textures-normal-5.png`, import.meta.url)
          .href
      );
      const gg = new THREE.PlaneGeometry(2000, 2000);
      const gm = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map,
        normalMap,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide,
      });
      map.dispose();
      normalMap.dispose();
      const ground = new THREE.Mesh(gg, gm);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.name = 'customPlane';
      ground.userData.planeGeometry = 'brick';
      this.scene?.add(ground);
    } finally {
      Promise.resolve();
    }
  }
  /**
   * 初始化控制器
   */
  async initControls(): Promise<void> {
    if (!this.camera || !this.renderer || !this.scene) return;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 启用平移
    this.controls.screenSpacePanning = false;
    // 启用平滑Scale
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.0; // 增大Scale速度
    this.controls.panSpeed = 2.0; // 增大平移速度
    // 禁用右键拖动
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    // 设置初始观察点
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    // 创建 ViewHelper
    this.viewHelper = new ViewportGizmo(this.camera, this.renderer, {
      size: 90,
      placement: 'bottom-right',
      container: document.querySelector('#scene-render') as HTMLElement,
      font: {
        family: 'helvetica',
        weight: 300,
      },
    });
    this.viewHelper.attachControls(this.controls);

    return Promise.resolve();
  }
  /**
   * 初始化第一人称控制器
   */
  createPointerLockControls() {
    if (!this.camera || !this.renderer || !this.container) return;

    this.pointerLockControls = new PointerLockControls(
      this.camera,
      this.container
    );
    this.scene?.add(this.pointerLockControls.object);

    // 计算合适的相机Height
    const currentPosition = this.camera.position.clone();
    const idealHeight = 2; // 理想的人眼Height（单位）

    // 保持当前的 x 和 z 坐标，但调整 y 坐标到合适的Height
    if (currentPosition.y < idealHeight) {
      // 如果当前Height太低，提升到理想Height
      currentPosition.y = idealHeight;
    } else if (currentPosition.y > idealHeight * 3) {
      // 如果当前Height太高，降低到理想Height的3倍以内
      currentPosition.y = idealHeight * 3;
    }

    this.camera.position.copy(currentPosition);

    // 添加事件监听器
    this.onKeyDownListener = this.keyboardDownControls.bind(this);
    window.addEventListener('keydown', this.onKeyDownListener);

    this.onKeyUpListener = this.keyboardUpControls.bind(this);
    window.addEventListener('keyup', this.onKeyUpListener);

    this.onPointerUnLockListener = this.pointerUnLockControls.bind(this);
    this.pointerLockControls.addEventListener(
      'unlock',
      this.onPointerUnLockListener
    );
    this.pointerLockControls.lock();

    ElNotification({
      title: 'Notice',
      message: 'View: first person,按ESC键退出。W,S,A,D键控制相机Move',
      type: 'success',
      position: 'top-left',
    });
  }
  /**
   * 销毁第一人称控制器
   */
  destroyPointerLockControls() {
    if (this.pointerLockControls) {
      this.pointerLockControls.removeEventListener(
        'unlock',
        this.onPointerUnLockListener
      );
      this.scene?.remove(this.pointerLockControls.object);
      this.pointerLockControls.dispose();
      this.pointerLockControls = null;
    }
    window.removeEventListener('keydown', this.onKeyDownListener);
    window.removeEventListener('keyup', this.onKeyUpListener);
    Object.keys(this.keys).forEach((key) => {
      this.keys[key] = false;
    });
  }
  /**
   * 键盘按下事件监听
   * @param event - 键盘事件
   */
  keyboardDownControls(event: KeyboardEvent) {
    if (event.key in this.keys) {
      this.keys[event.key] = true;
    }
  }
  /**
   * 键盘松开事件监听
   * @param event - 键盘事件
   */
  keyboardUpControls(event: KeyboardEvent) {
    if (event.key in this.keys) {
      this.keys[event.key] = false;
    }
  }
  /**
   * 鼠标点击事件监听
   * @param event - 鼠标事件
   */
  pointerUnLockControls() {
    this.destroyPointerLockControls();
  }

  /**
   * 计算合适的Move速度
   * @returns number
   */
  calculateMoveSpeed(): number {
    if (!this.camera) return 1;
    // 获取相机的Scale值
    const zoom = this.camera.zoom;

    // 计算相机到目标点的距离
    const distance = this.camera.position.distanceTo(
      this.controls?.target || new THREE.Vector3()
    );

    // 基础速度
    const baseSpeed = 0.1;
    // 根据Scale值和距离计算速度
    // 当Scale值越大（拉近）时，Move速度应该越小
    // 当距离越远时，Move速度应该越大
    const speed = baseSpeed * (distance / zoom);
    // 限制速度在合理范围内
    return Math.max(0.05, Math.min(speed, 2));
  }

  /**
   * 更新第一人称控制器Move
   */
  updatePointerLockControls() {
    if (!this.pointerLockControls) return;
    // 计算当前合适的Move速度
    this.moveSpeed = this.calculateMoveSpeed();
    // 根据按键状态Move相机
    if (this.keys.w) this.pointerLockControls.moveForward(this.moveSpeed);
    if (this.keys.s) this.pointerLockControls.moveForward(-this.moveSpeed);
    if (this.keys.a) this.pointerLockControls.moveRight(-this.moveSpeed);
    if (this.keys.d) this.pointerLockControls.moveRight(this.moveSpeed);
  }

  /**
   * SceneAnimation循环
   */
  sceneAnimation(): void {
    if (!this.controls || !this.renderer || !this.scene || !this.camera) return;
    // 确保Animation循环持续进行
    this.renderAnimation = requestAnimationFrame(() => this.sceneAnimation());
    if (this.loadingStatus || this.controls.enabled) {
      // 更新 TWEEN
      TWEEN.update();
      // 更新控制器 如果当前是第一人称控制器则不更新
      if (!this.pointerLockControls) {
        this.controls.update();
      }
      // 更新包围盒
      this.boxHelper?.update();
      // 渲染Scene
      this.renderer.render(this.scene, this.camera);
      this.viewHelper?.render();
      // 更新第一人称控制器
      if (this.pointerLockControls) {
        this.updatePointerLockControls();
      }
    }
  }
  /**
   * 添加事件监听器
   */
  addEvenListMouseListener(): void {
    this.onWindowResizesListener = this.onWindowResizes.bind(this);
    window.addEventListener('resize', this.onWindowResizesListener);
  }

  /**
   * 监听窗口变化
   */
  onWindowResizes() {
    if (!this.container || !this.camera || !this.renderer) return false;
    const { offsetWidth, offsetHeight } = this.container;
    this.camera.aspect = offsetWidth / offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(offsetWidth, offsetHeight);
    this.viewHelper?.update();
  }

  /**
   * 加载Models
   * @param filePath - Models文件Path
   * @param fileType - Models文件类型
   * @returns Promise<void>
   */
  loadModel(
    filePath: string,
    fileType: MODEL_TYPE,
    clientX: number,
    clientY: number,
    name: string,
    opts?: {
      group?: string;
      sectorId?: string;
      terrainId?: string;
      isTerrain?: boolean;
      playUrl?: string;
    }
  ): Promise<void | boolean> {
    return new Promise((resolve, reject) => {
      if (!this.scene) {
        reject(new Error('Scene not initialized'));
        return;
      }

      this.loadingStatus = false;
      // 获取合适的加载器
      const loader = ['glb', 'gltf'].includes(fileType)
        ? this.getDracoLoader()
        : this.fileLoaderMap[fileType];
      const kind: PlaceKind = kindFromGroup(opts?.group, filePath);

      loader.load(
        filePath,
        (result: unknown) => {
          let model = createModelFromResult(result, fileType);
          if (model && model.animations.length == 0) {
            model.animations = (result as GLTF).animations;
          }

          const mousePosition = getMousePosition(clientX, clientY);

          if (this.scene && model) {
            model.name = name;
            if (kind === 'captain' || kind === 'unit') {
              bootstrapRaceKit(model, raceIdFromName(name, filePath));
            }
            setModelPositionSize(model, mousePosition, kind);
            if (opts?.isTerrain || kind === 'island') {
              tagTerrain(model, {
                terrainId: opts?.terrainId || opts?.sectorId || name,
                sectorId: opts?.sectorId,
                kind:
                  opts?.group === 'sectors'
                    ? 'sector'
                    : opts?.group === 'scenes'
                      ? 'map'
                      : 'island',
                playUrl: opts?.playUrl,
              });
            }
            this.scene.add(model);
            this.setObjectHighlight(model);
            this.bindRaceKitHover();
          }

          this.loadingStatus = true;
          resolve(true);
        },
        this.handleLoadProgress.bind(this),
        (err: unknown) => {
          this.loadingStatus = false;
          ElMessage.error('Failed to load model');
          resolve(true);
        }
      );
    });
  }

  /**
   * Hard Road DS2 heightfield (SI metres). Do not run setModelPositionSize —
   * that would squash a 400 m zone to 1.2 m.
   */
  async loadHdTerrain(
    preset: Ds2PresetId,
    clientX: number,
    clientY: number,
    name: string,
    onProgress?: (pct: number, msg: string) => void,
    quality: Ds2Quality = 'edit',
    stamp?: { sectorId?: string; terrainId?: string; playUrl?: string }
  ): Promise<void> {
    if (!this.scene) throw new Error('Scene not initialized');
    this.loadingStatus = false;
    try {
      const root = await generateDs2Terrain(preset, onProgress, quality);
      const mouse = getMousePosition(clientX, clientY);
      root.name = name;
      this.scene.add(root);
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      root.position.x += mouse.x - center.x;
      root.position.z += mouse.z - center.z;
      root.position.y += mouse.y - box.min.y;
      root.updateMatrixWorld(true);
      tagTerrain(root, {
        terrainId: stamp?.terrainId || stamp?.sectorId || `hd-${preset}`,
        sectorId: stamp?.sectorId,
        kind: stamp?.sectorId ? 'sector' : 'hd',
        playUrl: stamp?.playUrl,
      });
      this.setObjectHighlight(root);
    } finally {
      this.loadingStatus = true;
    }
  }

  /**
   * 加载Geometry
   * @param dragGeometry - 拖拽Models
   */
  loadGeometry(dragGeometry: CurrentDragModelData) {
    if (!this.scene || !dragGeometry.modelData) return;

    // 不需要作为Geometry的Properties
    const notGeometryKey = [
      'id',
      'name',
      'modelType',
      'type',
      'clientX',
      'clientY',
    ];
    try {
      let geometry;
      const geometryType = (
        dragGeometry.modelData as unknown as TubeGeometryType
      ).type;

      // 处理其他Geometry
      const geometryData = Object.keys(dragGeometry.modelData as GeometryType)
        .filter((key) => !notGeometryKey.includes(key))
        .map((key) => (dragGeometry.modelData as GeometryType)[key]);

      geometry = new THREE[(dragGeometry?.modelData as GeometryType).type](
        ...(geometryData as unknown as number[])
      );

      // 创建标准物理Material
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#fff'), // 使用一个柔和的蓝色
        side: THREE.DoubleSide,
        metalness: 0.3, // 降低金属感,让Material更自然
        roughness: 0.7, // 增加Roughness,减少反光
        emissive: new THREE.Color('#1B3A5A'), // 添加暗蓝色自发光
        emissiveIntensity: 0.2, // 较低的emissive intensity
      });

      // 创建网格
      const mesh = new THREE.Mesh(geometry, material);
      // 设置Shadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // 添加到Scene

      this.scene.add(mesh);
      // 设置高亮对象
      this.setObjectHighlight(mesh);

      const mousePosition = getMousePosition(
        dragGeometry.clientX,
        dragGeometry.clientY
      );
      mesh.position.copy(mousePosition);
      //添加current model内容是否可以被变换控制器控制
      mesh.name = geometryType;
      mesh.userData = {
        ...mesh.userData,
        isTransformControls: true,
      };
      // // 更新Models的世界矩阵
      mesh.updateMatrixWorld();
      // 计算Models包围盒并调整大小
      const box = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const scale = 0.5 / (maxSize > 1 ? maxSize : 0.5);
      // 应用Scale
      mesh.scale.set(scale, scale, scale);
    } catch (error) {
      console.error('创建Geometry失败:', error);
    }
  }
  /**
   * 加载Lights
   * @param dragLight - 拖拽Lights
   */
  loadLight(dragLight: CurrentDragModelData) {
    if (!this.scene || !dragLight.modelData) return;
    const { modelData } = dragLight;
    const position = getMousePosition(dragLight.clientX, dragLight.clientY);

    const lightType = (modelData as unknown as LightType).type;
    this.lightModules.createLight(lightType, position || new THREE.Vector3());
    if (this.boxHelper) this.boxHelper.visible = false;
  }
  /**
   * 加载indexDbScene数据
   * @param indexDbSceneData - Scene数据
   * @returns Promise<void>
   */
  async loadIndexDbSceneData(
    indexDbSceneData: IndexDbSceneData
  ): Promise<boolean> {
    try {
      const { camera, scene, controls } = indexDbSceneData;
      // 1. 清理旧Scene资源
      if (this.scene) {
        disposeScene(this.scene);
        this.scene.clear();
      }
      // 2. 创建加载器（可以考虑缓存loader实例）
      const loader = new ObjectLoader();

      // 3. 并行加载Scene和相机数据
      const [parseScene, parseCamera] = await Promise.all([
        loader.parseAsync(scene),
        loader.parseAsync(camera),
      ]);

      // 4. 更新Scene
      this.scene = parseScene as THREE.Scene;
      if (this.boxHelper) {
        this.boxHelper.visible = false;
        this.scene?.add(this.boxHelper);
      }

      // 清理旧Scene资源;
      disposeScene(parseScene as THREE.Scene);

      // 5. 更新相机（避免创建不必要的克隆）
      if (this.camera) {
        this.camera.clear();
        this.camera.copy(parseCamera as THREE.PerspectiveCamera);
      } else {
        this.camera = parseCamera as THREE.PerspectiveCamera;
      }

      this.camera.updateProjectionMatrix();

      // 恢复控制器目标
      if (this.controls) {
        this.controls.target.set(controls.x, controls.y, controls.z);
      }
      // 6. 初始化Lights
      this.lightModules.initLight();
      // 6. 初始化地面
      this.initPlaneGround(indexDbSceneData);
      // 7. 创建变换控制器
      this.transformControlsModules.createTransformControls();
      // 8. 更新窗口大小
      this.onWindowResizes();
      // 9. 清理临时对象
      parseCamera?.clear();
      // 10. 初始化Animation
      this.animationModules.initializeAnimations();
      return Promise.resolve(true);
    } catch (error) {
      console.error('加载indexDbScene数据失败:', error);
      return Promise.resolve(false);
    }
  }
  /**
   * 获取draco加载器
   */
  getDracoLoader() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('draco/');
    dracoLoader.preload();
    return new GLTFLoader().setDRACOLoader(dracoLoader);
  }

  /**
   * 处理加载进度
   * @param xhr - 加载进度事件
   */
  handleLoadProgress(xhr: ProgressEvent): void {
    if (xhr.lengthComputable && this.modelProgressCallback) {
      this.modelProgressCallback(xhr.loaded, xhr.total);
    }
  }

  /**
   * 处理加载错误
   * @param err - 错误信息
   * @returns boolean
   */
  handleLoadError(err: unknown) {
    console.error('加载Models出错:', err);
    if (err instanceof Error) {
      ElMessage.error('Invalid file');
    }
    return Promise.resolve(true);
  }

  /**
   * 设置Models加载进度回调函数
   * @param callback - 回调函数
   */
  onProgress(callback: (progressNum: number, totalSize: number) => void) {
    if (typeof callback === 'function') {
      this.modelProgressCallback = callback;
    }
  }

  /**
   * select object
   * @param node - Material节点
   */
  chooseMaterial(node: MaterialNode) {
    const material = this.scene?.getObjectByProperty('uuid', node.uuid);
    if (!material) return;
    this.transformControlsModules?.transformControls?.attach(material);
    store.setCurrentTransformMaterialUuid(material.uuid);
    this.setObjectHighlight(material);
  }
  /**
   * delete object
   * @param node - Material节点
   * @returns Promise<boolean>
   */
  deleteSceneMaterial(node: MaterialNode) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        // 根据uuid获取Scene中的对象
        const material = this.scene?.getObjectByProperty('uuid', node.uuid);

        if (!material) return;

        // 如果是光源，则删除光源的辅助线
        if (material instanceof THREE.Light) {
          const helper = this.scene?.getObjectByProperty(
            'uuid',
            material.userData.helperUuid
          );
          helper?.clear();
          if (helper) {
            this.scene?.remove(helper);
          }
        }

        if (this.boxHelper) this.boxHelper.visible = false;
        // 处理Material释放和对象移除
        const disposeMaterialAndRemove = () => {
          if (node.children) {
            // 遍历并释放所有子网格的Material
            material.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh && child.material) {
                child.material.dispose();
              }
            });
            this.scene?.remove(material);
          } else {
            material.parent?.remove(material);
          }
        };
        disposeMaterialAndRemove();
        this.transformControlsModules.transformControls?.detach();

        resolve(true);
      } catch {
        reject(new Error('delete object失败'));
      }
    });
  }
  /**
   * copy object
   * @param node - Material节点
   */
  copySceneMaterial(
    uuid: string,
    offset: THREE.Vector3 = new THREE.Vector3(-2, 0, 0)
  ): void {
    if (!store.sceneApi?.scene) return;

    const originalObject = store.sceneApi.scene.getObjectByProperty(
      'uuid',
      uuid
    ) as THREE.Mesh | THREE.Group | THREE.SkinnedMesh | null;

    if (!originalObject) return;

    // 克隆对象
    const clonedObject = clone(originalObject);

    if (clonedObject) {
      // Depth克隆Material
      clonedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            // 处理Material数组
            child.material = child.material.map((mat) => {
              const newMat = mat.clone() as THREE.Material & MaterialType;
              // 确保纹理也被克隆
              if (newMat.map) newMat.map = newMat.map.clone();
              if (newMat.normalMap) newMat.normalMap = newMat.normalMap.clone();
              if (newMat.roughnessMap)
                newMat.roughnessMap = newMat.roughnessMap.clone();
              if (newMat.metalnessMap)
                newMat.metalnessMap = newMat.metalnessMap.clone();
              if (newMat.alphaMap) newMat.alphaMap = newMat.alphaMap.clone();
              if (newMat.aoMap) newMat.aoMap = newMat.aoMap.clone();
              if (newMat.emissiveMap)
                newMat.emissiveMap = newMat.emissiveMap.clone();
              return newMat;
            });
          } else {
            // 处理单个Material
            const newMat = child.material.clone() as THREE.Material &
              MaterialType;
            // 确保纹理也被克隆
            if (newMat.map) newMat.map = newMat.map.clone();
            if (newMat.normalMap) newMat.normalMap = newMat.normalMap.clone();
            if (newMat.roughnessMap)
              newMat.roughnessMap = newMat.roughnessMap.clone();
            if (newMat.metalnessMap)
              newMat.metalnessMap = newMat.metalnessMap.clone();
            if (newMat.alphaMap) newMat.alphaMap = newMat.alphaMap.clone();
            if (newMat.aoMap) newMat.aoMap = newMat.aoMap.clone();
            if (newMat.emissiveMap)
              newMat.emissiveMap = newMat.emissiveMap.clone();
            child.material = newMat;
          }
        }
      });

      // 设置位置和UUID
      const originalPosition = originalObject.position.clone();
      clonedObject.position.copy(originalPosition).add(offset);
      clonedObject.uuid = THREE.MathUtils.generateUUID();

      // 添加到Scene
      this.scene?.add(clonedObject);

      // 清理资源
      if (originalObject instanceof THREE.Mesh) {
        disposeMaterial(originalObject);
      }
    }
  }
  /**
   * 设置对象的高亮效果
   * @param object - 要高亮的对象
   * @param isGroup - 是否是组对象
   */
  setObjectHighlight(object: THREE.Object3D) {
    store.setCurrentTransformMaterialUuid(object.uuid);
    this.transformControlsModules.transformControls?.attach(object);
    // 创建新的 BoxHelper
    if (!this.boxHelper) {
      this.boxHelper = new THREE.BoxHelper(object, 0xffff00);
      this.boxHelper.setFromObject(object);
      this.scene?.add(this.boxHelper);
    } else {
      this.boxHelper.setFromObject(object);
    }
    if (object instanceof THREE.Light) {
      this.boxHelper.visible = false;
    } else {
      this.boxHelper.visible = true;
    }
  }

  /** Hover armour pieces on the selected race kit (emissive preview). */
  bindRaceKitHover() {
    const canvas = this.renderer?.domElement;
    if (!canvas || (canvas as HTMLCanvasElement).dataset.raceHover === '1')
      return;
    (canvas as HTMLCanvasElement).dataset.raceHover = '1';
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    canvas.addEventListener('pointermove', (ev: PointerEvent) => {
      const uuid = store.currentTransformMaterialUuid;
      const selected = uuid
        ? this.scene?.getObjectByProperty('uuid', uuid) || null
        : null;
      const root = findRaceKitRoot(selected);
      if (!root || !this.camera || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.camera);
      const hits = raycaster.intersectObject(root, true);
      const mesh = hits.find((h) => (h.object as THREE.Mesh).isMesh)?.object;
      const name = mesh?.name || null;
      const kit = root.userData.raceKit as { hoverMesh?: string | null } | undefined;
      if (kit && kit.hoverMesh === name) return;
      setHoverMesh(root, name);
      store.setTransformMaterialRandomId();
    });
  }

  /** Asset-to-ground: snap selection onto stamped terrain (or y=0). */
  snapSelectedToGround(): { ok: boolean; terrainId: string } {
    if (!this.scene) return { ok: false, terrainId: '' };
    const uuid = store.currentTransformMaterialUuid;
    const obj = uuid
      ? this.scene.getObjectByProperty('uuid', uuid) || null
      : null;
    if (!obj) return { ok: false, terrainId: '' };
    const root = findRaceKitRoot(obj) || obj;
    const result = snapObjectToTerrain(root, this.scene);
    this.setObjectHighlight(root);
    return result;
  }
  /**
   * update geometry
   * @param labelKey - 参数标签
   * @param value - 参数值
   * @param uuid - Materialuuid
   */
  updateGeometryParameter(
    labelKey: string,
    value: number | boolean,
    uuid: string
  ) {
    const material = store.sceneApi?.scene?.getObjectByProperty(
      'uuid',
      uuid
    ) as THREE.Mesh;
    if (!material || !material.geometry) return;

    try {
      const geometryType = material.geometry.type as GeometryType['type'];

      let currentParams = (material.geometry as THREE.BoxGeometry)
        .parameters as ParametersType;
      if (!currentParams) return;

      currentParams[labelKey] = value;
      const newGeometry = new THREE[geometryType](
        ...(Object.values(currentParams) as unknown as number[])
      );

      material.geometry.dispose();
      material.geometry = newGeometry;
    } catch (error) {
      console.error('update geometry失败:', error);
      ElMessage.error('Failed to update geometry');
    }
    disposeMaterial(material);
  }
  /**
   * update material类型
   * @param type - material types
   * @returns THREE.Material | null
   */
  updateMaterialType(type: string) {
    const uuid = store.currentTransformMaterialUuid;
    if (!uuid) return;
    const object = this.scene?.getObjectByProperty('uuid', uuid) as THREE.Mesh;
    if (!object) return;
    const oldMaterial = object.material as THREE.Material;
    const material = createMaterial(type, {
      ...(oldMaterial as unknown as MaterialConfig),
    });
    object.material = material;
    disposeMaterial(oldMaterial);
    return object;
  }
  /**
   * 销毁Models
   */
  renderDestroy() {
    // CancelAnimation循环
    if (this.renderAnimation) {
      cancelAnimationFrame(this.renderAnimation);
      this.renderAnimation = null;
    }

    disposeScene(this.scene);
    TWEEN.removeAll();
    // TWEEN.removeAll()清理Scene
    this.scene?.clear();
    // 释放控制器
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    // 移除事件监听器
    if (this.onWindowResizesListener) {
      window.removeEventListener('resize', this.onWindowResizesListener);
      this.onWindowResizesListener = null;
    }

    // 释放变换控制器
    this.transformControlsModules?.destroy();

    // 释放 ViewHelper
    if (this.viewHelper) {
      this.viewHelper.dispose();
      this.viewHelper = null;
    }

    // 清空其他引用
    this.camera = null;
    this.scene = null;
    this.container = null;
    this.destroyPointerLockControls();
  }
}
export default renderScene;
