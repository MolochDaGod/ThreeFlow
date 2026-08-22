import * as THREE from 'three';
import { toRaw } from 'vue';
import * as TWEEN from '@tweenjs/tween.js';
import { type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { USDLoader } from 'three/addons/loaders/USDLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { bindProductionKtx2, getProductionGltfLoader } from './gltfProdLoader';
import { assetUrl, isRasterImage } from '@/config/assetApi';
import { loadCdnImage, meshFromImage } from './imageLoader';
import { ObjectLoader } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ElMessage, ElNotification } from 'element-plus';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ViewportGizmo } from 'three-viewport-gizmo';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import AnimationModules from './sceneModules/animationModules';
import TransformControlsModules from './sceneModules/transformControlsModules';
import LightModules from './sceneModules/lightModules';
import HistoryModules from './historyModules';
import { TransformCommand } from './historyModules/transformCommand';
import { bindMeasureScale } from './measureScale';
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
import {
  createMaterial,
  disposeMaterial,
  disposeScene,
  firstEditableMesh,
  materialOf,
} from './utils';
import type { IndexDbSceneData } from '@/types/indexDbTypes';
import type { ActionParams } from '@/types/rightPanelTypes';
import { STUDIO_BG_COLOR } from '@/config/constant';
import type { LIGHT_TYPE, MODEL_TYPE } from '@/enums/enum';
import {
  createModelFromResult,
  getMousePosition,
  setModelPositionSize,
} from './sceneModules';
import { kindFromGroup, type PlaceKind } from './siPlace';
import { isolateNamedMesh } from './isolateMesh';
import {
  bootstrapRaceKit,
  findRaceKitRoot,
  hideCarryVisuals,
  isPlayBody,
  raceIdFromName,
  setHoverMesh,
} from './raceKit';
import { bindKitAnims, getKitAnimBind, playKitRole } from './kitAnim';
import {
  isAutoHarvestNpc,
  stampAutoHarvest,
  tickNpcHarvest,
} from './npcHarvest';
import {
  spawnEnemyCamp as spawnEnemyCampPrefab,
  tickLookouts,
} from './enemyCampPrefab';
import { tickLootFall } from './lootChest';
import {
  parentToNearestIsland,
  snapObjectToTerrain,
  tagTerrain,
  weldIslandToSeafloor,
} from './terrainGround';
import { applyTerrainLook, lookFromHdPreset } from './terrainLook';
import { stampWarlordsPrefab, type PrefabKind } from './prefabStamp';
import { seedForTarget } from '@/config/hdTerrainDeploy';
import { mountWorldAtmosphere, tickWorldAtmosphere } from './worldAtmosphere';
import { dedupeSceneLights } from './dedupeLights';
import { isLayerPrefab, spawnLayerPrefab } from './layerPrefabs';
import { SEAFLOOR_ROOT, spawnSeafloorGrid } from './sceneModules/seafloorGrid';
import {
  spawnWorldIslands,
  tickWorldIslands,
} from './sceneModules/worldIslandsSpawn';
import { PLAY_PERF, WORLD_STACK } from '@/config/fleetSystems';
import { startFlyBy, stopFlyBy } from './flyBy';
import { clearSystemHelpers } from './systemsRuntime';
import { stopGamesAiPreview } from './gamesAiRuntime';
import {
  applyPlayGpuLaw,
  enterPlayBake,
  exitPlayBake,
  tickPlayBake,
} from './playBake';
import {
  disposePlayComposer,
  mountPlayComposer,
  renderPlayComposer,
  resizePlayComposer,
} from './playComposer';
import { tickGrassField } from './grassField';
import {
  DS2_PRESETS,
  generateDs2Terrain,
  type Ds2PresetId,
  type Ds2Quality,
} from './sceneModules/ds2Terrain';
import {
  applyLayerRender,
  getPlayAs,
  getPlayAsCached,
  hydrateContentLayers,
  inferContentLayer,
  loadLayerRender,
  setPlayAs,
  stampContentLayer,
} from './contentLayers';
import {
  isMapSurfaceLayer,
  type ContentLayerId,
  type MapSurfaceLayerId,
} from '@/config/fleetSystems';
import {
  createMapSurfaceMesh,
  hydrateMapSurfaces,
  listMapSurfaces,
  spawnMapSurface,
  STUDIO_PLANE_NAME,
} from './mapSurface';
import {
  applyLook,
  createPlayCombat,
  cycleTarget,
  tryTraverse,
  disposePlayCombat,
  inferWeaponCat,
  nudgeCamDist,
  setAiming,
  tickPlayCombat,
  toggleFirstPerson,
  tryAttack,
  type PlayCombat,
} from './playCombat';

const store = useSceneStore();

class renderScene {
  // camera
  camera: THREE.PerspectiveCamera | null;
  // Renderer
  renderer: THREE.WebGLRenderer | null;
  // Scene
  scene: THREE.Scene | null;
  // controls
  controls: OrbitControls | null;
  // pointer-lock controls
  pointerLockControls: PointerLockControls | null;
  playCombat: PlayCombat | null;
  playReticle: HTMLDivElement | null;
  moveSpeed: number;
  keys: { [key: string]: boolean };
  // containerDOMelement
  container: HTMLElement | null;
  // file loader map
  fileLoaderMap: Record<string, THREE.Loader>;
  // Modelsload-progress callback
  modelProgressCallback: ((loaded: number, total: number) => void) | null;
  // resize listener
  onWindowResizesListener: (() => void) | null;
  // keydown listener
  onKeyDownListener: (event: KeyboardEvent) => void;
  // keyup listener
  onKeyUpListener: (event: KeyboardEvent) => void;
  // click listener
  onPointerUnLockListener: () => void;
  // AnimationrafID
  renderAnimation: number | null;
  // Modelsloading state
  loadingStatus: boolean;
  harvestLast: number;
  boxHelper: THREE.BoxHelper | null;
  // Animationmodule
  animationModules: {
    playAnimation: (
      animation: THREE.AnimationClip,
      model: THREE.Object3D
    ) => void;
    playExclusive: (
      animation: THREE.AnimationClip,
      model: THREE.Object3D,
      opts?: { loopOnce?: boolean }
    ) => void;
    crossFadeGait: (
      clip: THREE.AnimationClip,
      model: THREE.Object3D,
      fade?: number
    ) => void;
    playOverlay: (
      clip: THREE.AnimationClip,
      model: THREE.Object3D,
      opts?: { fade?: number }
    ) => void;
    updateAnimationParams: (action: ActionParams, uuid: string) => void;
    updateActionAnimationMap: (mapId: string, uuid: string) => void;
    currentActions: Map<string, THREE.AnimationAction[]>;
    animationMixers: Map<string, THREE.AnimationMixer>;
    clear: () => void;
    initializeAnimations: () => void;
  };
  // light module
  lightModules: {
    createLight: (type: LIGHT_TYPE, position: THREE.Vector3) => void;
    updateHelper: (uuid?: string) => void;
    initLight: () => void;
  };
  // transform-controls module
  transformControlsModules: {
    init: () => void;
    transformControls: TransformControls | null;
    transformControlsHelper: THREE.Object3D | null;
    focusOnObject: (object: THREE.Object3D) => void;
    frameSelection: () => void;
    destroy: () => void;
    createTransformControls: () => void;
    clearCurrentSelection: () => void;
  };
  // history module
  historyModules: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    execute: (command: Command) => void;
  };
  // view helper
  viewHelper: ViewportGizmo | null;
  measureUnbind: (() => void) | null;
  constructor(selector: string) {
    this.container = document.querySelector(selector);
    this.camera = null;
    this.renderer = null;
    this.scene = null;
    this.controls = null;
    this.pointerLockControls = null;
    this.playCombat = null;
    this.playReticle = null;
    this.moveSpeed = 1;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false,
      ' ': false,
    };
    this.fileLoaderMap = {
      glb: getProductionGltfLoader(),
      fbx: new FBXLoader(),
      gltf: getProductionGltfLoader(),
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
    this.harvestLast = performance.now();
    this.boxHelper = null;
    this.animationModules = new AnimationModules();
    this.lightModules = new LightModules();
    this.transformControlsModules = new TransformControlsModules();
    this.historyModules = new HistoryModules();
    this.viewHelper = null;
    this.measureUnbind = null;
  }
  /**
   * initScene
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
      // load IndexedDB scene
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
      this.measureUnbind = bindMeasureScale(this);
      resolve(true);
    });
  }
  /**
   * initRenderer
   */
  initRender(): void {
    if (!this.container) return;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(new THREE.Color(STUDIO_BG_COLOR));
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, PLAY_PERF.pixelRatioMax)
    );
    const { offsetWidth, offsetHeight } = this.container;
    this.renderer.setSize(offsetWidth, offsetHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);
    void bindProductionKtx2(this.renderer);
  }
  /**
   * init camera
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
   * initScene
   */
  async initScene(): Promise<void> {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(STUDIO_BG_COLOR);
    this.scene.backgroundIntensity = 1;
    this.scene.fog = null;
    this.scene.userData.fogEnabled = false;
    this.ensureCameraInScene();
    const { ensureSceneManagers } = await import('./sceneManagers');
    const { ensureHudRoot, syncHudToScene } = await import('./hudScene');
    const { loadHud } = await import('@/config/hudKits');
    ensureSceneManagers(this.scene);
    ensureHudRoot(this.scene);
    syncHudToScene(this.scene, loadHud().frames);
    dedupeSceneLights(this.scene);
    if (this.renderer) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;
      pmrem.dispose();
    }
    return Promise.resolve();
  }
  /** Camera stays a scene child. Tree reads this graph — never detach on refresh. */
  ensureCameraInScene(): void {
    if (!this.scene || !this.camera) return;
    if (this.camera.parent !== this.scene) this.scene.add(this.camera);
  }
  /**
   * init ground
   */
  async initPlaneGround(loadSceneData?: IndexDbSceneData) {
    try {
      let planeGeometryType: string;
      // ground type
      planeGeometryType = loadSceneData?.weather?.planeGeometry || 'brick';
      if (planeGeometryType === 'none') return;
      if (!this.scene) return;
      if (
        this.scene.getObjectByName(STUDIO_PLANE_NAME) ||
        listMapSurfaces(this.scene).length
      ) {
        hydrateMapSurfaces(this.scene);
        applyLayerRender(this.scene, loadLayerRender());
        return;
      }

      const ground = await createMapSurfaceMesh('terrain');
      ground.name = STUDIO_PLANE_NAME;
      this.scene.add(ground);
      applyLayerRender(this.scene, loadLayerRender());
    } finally {
      Promise.resolve();
    }
  }
  /**
   * init orbit controls
   */
  async initControls(): Promise<void> {
    if (!this.camera || !this.renderer || !this.scene) return;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // enable pan
    this.controls.screenSpacePanning = false;
    // enable smoothScale
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.0; // increaseScalespeed
    this.controls.panSpeed = 2.0; // faster pan
    // disable RMB orbit
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.renderer.domElement.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
    });
    // initial look-at
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    // create ViewHelper
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
   * init first-person controls
   */
  /** Guest WASD fly only. Does not touch play-as TPS or Orbit flags. */
  stopGuestFly() {
    if (!this.pointerLockControls) return;
    this.pointerLockControls.removeEventListener(
      'unlock',
      this.onPointerUnLockListener
    );
    this.scene?.remove(this.pointerLockControls.object);
    this.pointerLockControls.dispose();
    this.pointerLockControls = null;
    window.removeEventListener('keydown', this.onKeyDownListener);
    window.removeEventListener('keyup', this.onKeyUpListener);
    Object.keys(this.keys).forEach((key) => {
      this.keys[key] = false;
    });
  }

  createPointerLockControls() {
    if (!this.camera || !this.renderer || !this.container || !this.scene)
      return;
    const body = getPlayAs(this.scene);
    if (body) {
      if (!isPlayBody(body)) {
        ElMessage.warning(
          'Play as a Toon RTS captain (loadRaceKit). Foundry creates the play body.'
        );
        return;
      }
      this.startPlayCombat(body);
      return;
    }

    this.stopGuestFly();
    this.pointerLockControls = new PointerLockControls(
      this.camera,
      this.container
    );
    this.scene.add(this.pointerLockControls.object);

    const currentPosition = this.camera.position.clone();
    const idealHeight = 2;
    if (currentPosition.y < idealHeight) currentPosition.y = idealHeight;
    else if (currentPosition.y > idealHeight * 3)
      currentPosition.y = idealHeight * 3;
    this.camera.position.copy(currentPosition);

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
      message:
        'No Player-layer character. Stamp Player / Play as first. WASD moves camera.',
      type: 'warning',
      position: 'top-left',
    });
  }

  startPlayCombat(body: THREE.Object3D) {
    if (!this.camera || !this.renderer || !this.scene || !this.container)
      return;
    if (this.playCombat?.playing) return;
    if (!isPlayBody(body)) {
      ElMessage.warning(
        'Play as a Toon RTS captain (loadRaceKit). Foundry creates the play body.'
      );
      return;
    }
    this.stopGuestFly();
    TWEEN.removeAll();
    stopFlyBy(this.controls);
    stopGamesAiPreview(this.scene);
    clearSystemHelpers(this.scene);
    if (this.viewHelper) this.viewHelper.enabled = false;
    if (this.controls) this.controls.enabled = false;
    store.setPlayMode(true);
    if (this.boxHelper) this.boxHelper.visible = false;
    this.transformControlsModules.transformControls?.detach();
    if (this.transformControlsModules.transformControlsHelper) {
      this.transformControlsModules.transformControlsHelper.visible = false;
    }
    applyPlayGpuLaw(this.scene, this.camera, this.renderer);
    void enterPlayBake(this.scene, this.animationModules);
    if (this.renderer && this.camera) {
      mountPlayComposer(this.renderer, this.scene, this.camera);
    }
    this.playCombat = createPlayCombat();
    this.playCombat.playing = true;
    void import('@/config/harvestBag').then((m) => m.hydrateHarvestBag());
    const kit = findRaceKitRoot(body) || body;
    const pack = (kit.userData?.animPack || kit.userData?.raceKit?.animPack) as
      | 'sword_shield'
      | '2h_melee'
      | 'longbow'
      | 'magic'
      | 'spear_melee'
      | 'unarmed'
      | undefined;
    if (pack && !getKitAnimBind(kit)) {
      void bindKitAnims(kit, pack).then((bind) => {
        if (bind.roles.idle) {
          this.animationModules.playExclusive(bind.roles.idle, kit);
          kit.userData.kitGait = 'idle';
        }
      });
    } else if (getKitAnimBind(kit)?.roles.idle) {
      playKitRole(kit, 'idle', this.animationModules);
    }
    if (this.controls) this.controls.enabled = false;
    if (this.viewHelper) this.viewHelper.enabled = false;
    this.onKeyDownListener = this.playKeyDown.bind(this);
    this.onKeyUpListener = this.keyboardUpControls.bind(this);
    window.addEventListener('keydown', this.onKeyDownListener);
    window.addEventListener('keyup', this.onKeyUpListener);
    this.renderer.domElement.addEventListener('mousemove', this.playMouseMove);
    this.renderer.domElement.addEventListener('mousedown', this.playMouseDown);
    this.renderer.domElement.addEventListener('mouseup', this.playMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.playWheel, {
      passive: false,
    });
    this.renderer.domElement.addEventListener('contextmenu', this.playContext);
    document.addEventListener('pointerlockchange', this.playLockChange);
    try {
      const p = this.renderer.domElement.requestPointerLock?.() as unknown;
      (p as Promise<void> | undefined)?.catch?.(() => {});
    } catch {
      /* click to lock */
    }
    this.showPlayReticle(true);
    requestAnimationFrame(() => this.onWindowResizes());
  }

  playMouseMove = (e: MouseEvent) => {
    if (!this.playCombat?.playing) return;
    if (document.pointerLockElement !== this.renderer?.domElement) return;
    applyLook(this.playCombat, e.movementX, e.movementY);
  };

  playMouseDown = (e: MouseEvent) => {
    if (!this.playCombat?.playing || !this.scene || !this.camera) return;
    const canvas = this.renderer?.domElement;
    if (document.pointerLockElement !== canvas) {
      try {
        const p = canvas?.requestPointerLock?.() as unknown;
        (p as Promise<void> | undefined)?.catch?.(() => {});
      } catch {
        /* */
      }
      return;
    }
    const body = getPlayAs(this.scene);
    if (!body) return;
    if (e.button === 0)
      tryAttack(this.scene, this.camera, body, this.playCombat);
    else if (e.button === 2) setAiming(this.playCombat, true);
  };

  playMouseUp = (e: MouseEvent) => {
    if (!this.playCombat?.playing) return;
    if (e.button === 2) setAiming(this.playCombat, false);
  };

  playWheel = (e: WheelEvent) => {
    if (!this.playCombat?.playing) return;
    e.preventDefault();
    nudgeCamDist(this.playCombat, e.deltaY > 0 ? 0.45 : -0.45);
  };

  playContext = (e: Event) => e.preventDefault();

  playLockChange = () => {
    /* Stay in play if the pointer unlocks. Esc exits. Click canvas to re-lock. */
  };

  playKeyDown(event: KeyboardEvent) {
    const k = event.key.toLowerCase();
    if (
      (k === ' ' || k === 'spacebar') &&
      this.scene &&
      this.playCombat &&
      !this.keys[' ']
    ) {
      event.preventDefault();
      this.keys[' '] = true;
      const body = getPlayAs(this.scene);
      if (body) tryTraverse(this.scene, body, this.playCombat);
    }
    if (k in this.keys) this.keys[k] = true;
    if (k === 'v' && this.scene && this.playCombat) {
      const body = getPlayAs(this.scene);
      if (body) toggleFirstPerson(this.playCombat, body);
    }
    if (k === 'tab' && this.scene && this.playCombat) {
      event.preventDefault();
      const body = getPlayAs(this.scene);
      if (body) cycleTarget(this.scene, body, this.playCombat);
    }
    if (k === 'escape') this.destroyPointerLockControls();
  }

  showPlayReticle(on: boolean) {
    if (!this.container) return;
    if (!this.playReticle) {
      const el = document.createElement('div');
      el.style.cssText =
        'position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border:1.5px solid #e8c56b;border-radius:50%;pointer-events:none;z-index:40;box-shadow:0 0 0 1px #0008';
      this.container.style.position = 'relative';
      this.container.appendChild(el);
      this.playReticle = el;
    }
    this.playReticle.style.display = on ? 'block' : 'none';
    let hint = this.container.querySelector(
      '.play-esc-hint'
    ) as HTMLDivElement | null;
    if (on) {
      if (!hint) {
        hint = document.createElement('div');
        hint.className = 'play-esc-hint';
        hint.textContent =
          'Esc exit · V view · RMB aim · wheel zoom · Tab lock';
        hint.style.cssText =
          'position:absolute;right:12px;bottom:10px;color:#d8c9a0;font:12px/1.2 sans-serif;opacity:.55;pointer-events:none;z-index:40';
        this.container.appendChild(hint);
      }
      hint.style.display = 'block';
    } else if (hint) hint.style.display = 'none';
  }

  playAsSelected(uuid?: string | null): { ok: boolean; name: string } {
    if (!this.scene) return { ok: false, name: '' };
    const obj = uuid
      ? this.scene.getObjectByProperty('uuid', uuid)
      : this.scene.getObjectByProperty(
          'uuid',
          store.currentTransformMaterialUuid
        );
    if (!obj) return { ok: false, name: '' };
    if (!isPlayBody(obj)) {
      return { ok: false, name: '' };
    }
    setPlayAs(this.scene, obj);
    this.setObjectHighlight(obj);
    return { ok: true, name: obj.name || 'character' };
  }

  snapCameraToPlayAs(body: THREE.Object3D) {
    if (!this.camera) return;
    const pos = new THREE.Vector3();
    body.getWorldPosition(pos);
    const si = Number(body.userData.siHeightM) || 1.8;
    this.camera.position.set(pos.x, pos.y + si * 0.88, pos.z);
    this.controls?.target.set(pos.x, pos.y + si * 0.55, pos.z);
  }

  tickPlayAs(dt: number) {
    if (!this.scene || !this.camera || !this.playCombat?.playing) return;
    tickPlayBake(dt, this.scene);
    const body = getPlayAsCached(this.scene);
    if (!body) return;
    tickPlayCombat(
      this.scene,
      this.camera,
      body,
      this.playCombat,
      this.keys,
      dt
    );
  }
  /**
   * destroy first-person controls
   */
  destroyPointerLockControls() {
    if (this.playCombat && this.scene) {
      if (this.playCombat.firstPerson) {
        const body = getPlayAs(this.scene);
        if (body) toggleFirstPerson(this.playCombat, body);
      }
      disposePlayCombat(this.scene, this.playCombat);
      this.playCombat = null;
    }
    if (this.scene) exitPlayBake(this.scene, this.camera || undefined);
    disposePlayComposer();
    store.setPlayMode(false);
    if (this.transformControlsModules.transformControlsHelper) {
      this.transformControlsModules.transformControlsHelper.visible = true;
    }
    requestAnimationFrame(() => this.onWindowResizes());
    this.showPlayReticle(false);
    this.renderer?.domElement.removeEventListener(
      'mousemove',
      this.playMouseMove
    );
    this.renderer?.domElement.removeEventListener(
      'mousedown',
      this.playMouseDown
    );
    this.renderer?.domElement.removeEventListener('mouseup', this.playMouseUp);
    this.renderer?.domElement.removeEventListener('wheel', this.playWheel);
    this.renderer?.domElement.removeEventListener(
      'contextmenu',
      this.playContext
    );
    document.removeEventListener('pointerlockchange', this.playLockChange);
    if (document.pointerLockElement) document.exitPointerLock?.();
    if (this.viewHelper) this.viewHelper.enabled = true;
    if (this.controls) this.controls.enabled = true;
    this.stopGuestFly();
  }
  /**
   * keydown handler
   * @param event - keyboard event
   */
  keyboardDownControls(event: KeyboardEvent) {
    const k = event.key.toLowerCase();
    if (k in this.keys) {
      this.keys[k] = true;
    }
  }
  /**
   * keyup handler
   * @param event - keyboard event
   */
  keyboardUpControls(event: KeyboardEvent) {
    const k = event.key.toLowerCase();
    if (k in this.keys) {
      this.keys[k] = false;
    }
  }
  /**
   * click handler
   * @param event - mouse event
   */
  pointerUnLockControls() {
    this.destroyPointerLockControls();
  }

  /**
   * compute a fittingMovespeed
   * @returns number
   */
  calculateMoveSpeed(): number {
    if (!this.camera) return 1;
    // cameraScalevalue
    const zoom = this.camera.zoom;

    // distance from camera to target
    const distance = this.camera.position.distanceTo(
      this.controls?.target || new THREE.Vector3()
    );

    // base speed
    const baseSpeed = 0.1;
    // fromScaleand distance to compute speed
    // when zoomed in, move speed should drop
    // when farther, move speed should rise
    const speed = baseSpeed * (distance / zoom);
    // clamp speed to a sane range
    return Math.max(0.05, Math.min(speed, 2));
  }

  /**
   * update first-person controlsMove
   */
  updatePointerLockControls() {
    if (!this.pointerLockControls) return;
    // compute currentMovespeed
    this.moveSpeed = this.calculateMoveSpeed();
    // from pressed keysMovecamera
    if (this.keys.w) this.pointerLockControls.moveForward(this.moveSpeed);
    if (this.keys.s) this.pointerLockControls.moveForward(-this.moveSpeed);
    if (this.keys.a) this.pointerLockControls.moveRight(-this.moveSpeed);
    if (this.keys.d) this.pointerLockControls.moveRight(this.moveSpeed);
  }

  /**
   * SceneAnimationloop
   */
  sceneAnimation(): void {
    if (!this.controls || !this.renderer || !this.scene || !this.camera) return;
    // ensureAnimationkeep the loop running
    this.renderAnimation = requestAnimationFrame(() => this.sceneAnimation());
    if (
      this.loadingStatus ||
      this.controls.enabled ||
      this.playCombat?.playing
    ) {
      if (!this.playCombat?.playing) TWEEN.update();
      // update controls; skip while first-person is active
      if (!this.pointerLockControls && !this.playCombat?.playing) {
        this.controls.update();
      }
      // update box helper
      if (!store.playMode) this.boxHelper?.update();
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.harvestLast) / 1000);
      this.harvestLast = now;
      if (store.playMode && renderPlayComposer(dt)) {
        /* play composer owns the frame */
      } else {
        toRaw(this.renderer).render(toRaw(this.scene), toRaw(this.camera));
        this.viewHelper?.render();
      }
      // update first-person controls
      if (this.pointerLockControls && !getPlayAs(this.scene)) {
        this.updatePointerLockControls();
      }
      tickNpcHarvest(this.scene, dt);
      tickLookouts(this.scene, dt);
      tickLootFall(this.scene, dt);
      this.tickPlayAs(dt);
      tickWorldAtmosphere(dt, this.camera);
      tickGrassField(dt, this.scene);
      if (this.scene && this.camera) tickWorldIslands(this.scene, this.camera);
    }
  }

  mountWorldAtmosphere(): string {
    if (!this.scene) return 'No scene';
    return mountWorldAtmosphere(this.scene);
  }

  startFlyBy(): string {
    if (!this.camera || !this.controls || !this.scene) return 'No camera';
    return startFlyBy(
      this.camera,
      this.controls,
      this.scene,
      Boolean(this.playCombat?.playing)
    );
  }
  /**
   * add listeners
   */
  addEvenListMouseListener(): void {
    this.onWindowResizesListener = this.onWindowResizes.bind(this);
    window.addEventListener('resize', this.onWindowResizesListener);
  }

  /**
   * on window resize
   */
  onWindowResizes() {
    if (!this.container || !this.camera || !this.renderer) return false;
    const { offsetWidth, offsetHeight } = this.container;
    this.camera.aspect = offsetWidth / offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, PLAY_PERF.pixelRatioMax)
    );
    this.renderer.setSize(offsetWidth, offsetHeight);
    resizePlayComposer(offsetWidth, offsetHeight);
    this.viewHelper?.update();
  }

  /**
   * loadModels
   * @param filePath - ModelsfilePath
   * @param fileType - Modelsfile type
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
      prefabId?: string;
      prefabKind?: PrefabKind;
      siHeightM?: number;
      assetUuid?: string;
      iconUuid?: string;
      r2Key?: string;
      iconUrl?: string;
      contentLayer?: string;
      harvestKind?: string;
      harvestDrops?: string[];
      animalRole?: 'prey' | 'predator';
      air?: boolean;
      islandKind?: 'static' | 'faction' | 'prefab';
      meshName?: string;
      playScript?: string;
    }
  ): Promise<void | boolean> {
    return new Promise((resolve, reject) => {
      if (!this.scene) {
        reject(new Error('Scene not initialized'));
        return;
      }

      this.loadingStatus = false;
      const kind: PlaceKind = kindFromGroup(opts?.group, filePath);
      const url = filePath.startsWith('blob:')
        ? filePath
        : /^https?:\/\//i.test(filePath)
          ? filePath
          : assetUrl(opts?.r2Key || filePath);
      if (!url || /^(prefab|hardroad):/i.test(url)) {
        reject(new Error(`Not a CDN mesh: ${filePath}`));
        return;
      }

      if (
        isRasterImage(url, fileType) ||
        (opts?.group === 'textures' && isRasterImage(url))
      ) {
        void loadCdnImage(url)
          .then((img) => {
            if (!this.scene) throw new Error('Scene not initialized');
            const model = meshFromImage(img, opts?.siHeightM);
            model.name = name || model.name;
            const mousePosition = getMousePosition(clientX, clientY);
            model.position.copy(mousePosition);
            model.position.y += (opts?.siHeightM || img.metersH) * 0.5;
            if (opts?.siHeightM) model.userData.siHeightM = opts.siHeightM;
            model.userData.assetUuid = opts?.assetUuid;
            model.userData.iconUuid = opts?.iconUuid;
            model.userData.r2Key = opts?.r2Key || img.url;
            model.userData.iconUrl = opts?.iconUrl;
            model.userData.catalogKey = name;
            model.userData.siPlace = {
              kind: 'mesh',
              beforeH: img.pxH,
              afterH: opts?.siHeightM || img.metersH,
              unitFix: 1,
              diagnosis: 'ok',
              method: 'world',
              pxW: img.pxW,
              pxH: img.pxH,
            };
            stampContentLayer(model, 'weather', {
              siHeightM: opts?.siHeightM || img.metersH,
            });
            this.scene.add(model);
            this.setObjectHighlight(model);
            store.setTransformMaterialRandomId();
            ElMessage.success(
              `${name} · ${img.pxW}×${img.pxH} px · ${(opts?.siHeightM || img.metersH).toFixed(2)} m`
            );
            this.loadingStatus = true;
            resolve(true);
          })
          .catch(reject);
        return;
      }

      // pick the loader
      const loader = ['glb', 'gltf'].includes(fileType)
        ? this.getDracoLoader()
        : this.fileLoaderMap[fileType];
      if (!loader) {
        reject(new Error(`No loader for ${fileType}: ${filePath}`));
        return;
      }

      loader.load(
        url,
        (result: unknown) => {
          let model = createModelFromResult(result, fileType);
          if (model && opts?.meshName) {
            model = isolateNamedMesh(model, opts.meshName);
          }
          const animHost = model as THREE.Object3D & {
            animations?: THREE.AnimationClip[];
          };
          if (
            animHost &&
            Array.isArray(animHost.animations) &&
            animHost.animations.length === 0
          ) {
            animHost.animations = (result as GLTF).animations;
          }

          const mousePosition = getMousePosition(clientX, clientY);

          if (this.scene && model) {
            model.name = name;
            if (kind === 'captain' || kind === 'unit') {
              bootstrapRaceKit(model, raceIdFromName(name, filePath));
              if (kind === 'captain') {
                model.userData.player = true;
                if (!getPlayAs(this.scene)) setPlayAs(this.scene, model);
              }
            }
            if (kind === 'captain' || kind === 'unit' || kind === 'enemy') {
              hideCarryVisuals(model);
            }
            if (opts?.siHeightM) model.userData.siHeightM = opts.siHeightM;
            if (opts?.harvestDrops)
              model.userData.harvestDrops = opts.harvestDrops;
            if (opts?.animalRole) model.userData.animalRole = opts.animalRole;
            if (opts?.air) model.userData.air = true;
            if (
              opts?.animalRole === 'predator' ||
              opts?.contentLayer === 'monster'
            ) {
              model.userData.hp = Number(model.userData.hp) || 90;
            } else if (opts?.contentLayer === 'animal') {
              model.userData.hp = Number(model.userData.hp) || 35;
            }
            if (opts?.meshName) model.userData.meshName = opts.meshName;
            if (opts?.playScript) model.userData.playScript = opts.playScript;
            setModelPositionSize(model, mousePosition, kind);
            const placed = model.userData.siPlace as
              { afterH?: number } | undefined;
            if (opts?.group === 'sectors') {
              ElMessage.success(
                `${name} · DS2 sector bake (author ${opts.siHeightM || 420} m · 10 km in the 3×3)`
              );
            } else if (placed?.afterH) {
              ElMessage.success(
                `${name} · ${placed.afterH.toFixed(2)} m · ${(placed.afterH / 1.8).toFixed(2)}× human`
              );
            }
            model.userData.assetUuid = opts?.assetUuid;
            model.userData.iconUuid = opts?.iconUuid;
            model.userData.r2Key = opts?.r2Key;
            model.userData.iconUrl = opts?.iconUrl;
            model.userData.catalogKey = name;
            if (opts?.prefabId && opts.prefabKind) {
              stampWarlordsPrefab(model, {
                prefabId: opts.prefabId,
                prefabKind: opts.prefabKind,
                siHeightM: opts.siHeightM,
              });
            }
            if (isAutoHarvestNpc(model)) stampAutoHarvest(model);
            if (opts?.isTerrain || kind === 'island') {
              const islandKind =
                opts?.islandKind ||
                (opts?.group === 'scenes' ? 'faction' : 'static');
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
                islandKind: opts?.group === 'sectors' ? undefined : islandKind,
              });
              if (
                opts?.group !== 'sectors' &&
                opts?.contentLayer !== 'seafloor'
              ) {
                weldIslandToSeafloor(model);
              }
              if (
                opts?.terrainId === 'home-island' ||
                /home.?island/i.test(name)
              ) {
                model.userData.homeIslandContract = '1.3.0';
                model.userData.worldSizeM = 1024;
                model.userData.characterHeightM = 2;
                model.userData.foundation = 'driftwood_bay';
                model.userData.infoSsot =
                  'https://info.grudge-studio.com/api/v1/home-island-contract.json';
              }
            }
            stampContentLayer(
              model,
              (opts?.contentLayer as ContentLayerId | undefined) ||
                inferContentLayer({
                  name,
                  group: opts?.group,
                  prefabKind: opts?.prefabKind,
                  harvestKind: opts?.harvestKind,
                  isTerrain: Boolean(opts?.isTerrain || kind === 'island'),
                  player: Boolean(model.userData.player),
                }),
              { siHeightM: opts?.siHeightM, harvestKind: opts?.harvestKind }
            );
            this.scene.add(model);
            if (opts?.harvestKind || opts?.contentLayer === 'harvestable') {
              parentToNearestIsland(this.scene, model);
            }
            applyLayerRender(this.scene, loadLayerRender());
            this.setObjectHighlight(model);
            store.setTransformMaterialRandomId();
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
      const seedId = stamp?.sectorId || stamp?.terrainId;
      const seed = seedId
        ? seedForTarget(seedId, DS2_PRESETS[preset].seed)
        : undefined;
      const root = await generateDs2Terrain(preset, onProgress, quality, seed);
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
      root.userData.r2Key = stamp?.sectorId
        ? `models/environment/sectors/${stamp.sectorId}/ds2-terrain.glb`
        : `hardroad://ds2-terrain?preset=${preset}`;
      root.userData.siHeightM = Number(root.userData.worldMeters) || 420;
      tagTerrain(root, {
        terrainId: stamp?.terrainId || stamp?.sectorId || `hd-${preset}`,
        sectorId: stamp?.sectorId,
        kind: stamp?.sectorId ? 'sector' : 'hd',
        playUrl: stamp?.playUrl,
      });
      stampContentLayer(root, 'terrain', {
        siHeightM: Number(root.userData.worldMeters) || 420,
      });
      applyTerrainLook(root, lookFromHdPreset(preset), {
        terrainId: stamp?.terrainId || stamp?.sectorId || `hd-${preset}`,
        sectorId: stamp?.sectorId,
        kind: stamp?.sectorId ? 'sector' : 'hd',
      });
      applyLayerRender(this.scene, loadLayerRender());
      this.setObjectHighlight(root);
    } finally {
      this.loadingStatus = true;
    }
  }

  async spawnLayerPrefab(
    scheme: string,
    clientX: number,
    clientY: number,
    onProgress?: (pct: number, msg: string) => void
  ): Promise<THREE.Object3D | null> {
    if (!this.scene || !isLayerPrefab(scheme)) return null;
    if (scheme === 'prefab://seafloor-grid') {
      const root = await spawnSeafloorGrid(this.scene, (p, m) =>
        onProgress?.(p * 0.55, m)
      );
      await spawnWorldIslands(this.scene, (p, m) =>
        onProgress?.(55 + p * 0.45, m)
      );
      mountWorldAtmosphere(this.scene);
      dedupeSceneLights(this.scene);
      applyLayerRender(this.scene, loadLayerRender());
      this.setObjectHighlight(root);
      return root;
    }
    const mapKind = scheme.replace('prefab://map-surface-', '');
    if (
      scheme.startsWith('prefab://map-surface-') &&
      isMapSurfaceLayer(mapKind)
    ) {
      const root = await spawnMapSurface(
        this.scene,
        mapKind as MapSurfaceLayerId
      );
      applyLayerRender(this.scene, loadLayerRender());
      this.setObjectHighlight(root);
      return root;
    }
    const mouse = getMousePosition(clientX, clientY);
    const obj = spawnLayerPrefab(this.scene, scheme, mouse);
    if (obj) {
      applyLayerRender(this.scene, loadLayerRender());
      this.setObjectHighlight(obj);
    }
    return obj;
  }

  lookAtWorld(x: number, y: number, z: number) {
    if (!this.camera || !this.controls) return;
    this.controls.target.set(x, y, z);
    this.camera.position.set(x + 48, y + 32, z + 48);
    this.controls.update();
  }

  async openSeaPlay(look?: {
    x: number;
    y: number;
    z: number;
  }): Promise<string> {
    if (!this.scene) return 'No scene';
    if (!this.scene.getObjectByName(SEAFLOOR_ROOT)) {
      await spawnSeafloorGrid(this.scene);
      await spawnWorldIslands(this.scene);
      mountWorldAtmosphere(this.scene);
      dedupeSceneLights(this.scene);
      applyLayerRender(this.scene, loadLayerRender());
    }
    const at = look || { x: 0, y: WORLD_STACK.waterY + 8, z: 0 };
    this.lookAtWorld(at.x, at.y, at.z);
    const player = getPlayAs(this.scene);
    if (player) {
      player.position.set(at.x, WORLD_STACK.waterY + 0.35, at.z);
      player.updateMatrixWorld(true);
      if (!this.playCombat?.playing) this.startPlayCombat(player);
      if (this.playCombat) {
        this.playCombat.sailing = true;
        this.playCombat.heading = player.rotation.y;
      }
    }
    return player
      ? 'Open sea · DS2 seafloor · islands · wind sail (W/A/D, Shift with the wind)'
      : 'Open sea · 9 DS2 cells under water. Stamp Play as a captain, then Play to sail.';
  }

  async spawnEnemyCamp(clientX: number, clientY: number): Promise<THREE.Group> {
    if (!this.scene) throw new Error('Scene not initialized');
    this.loadingStatus = false;
    try {
      const mouse = getMousePosition(clientX, clientY);
      const camp = await spawnEnemyCampPrefab(this.scene, mouse);
      applyLayerRender(this.scene, loadLayerRender());
      this.setObjectHighlight(camp);
      return camp;
    } finally {
      this.loadingStatus = true;
    }
  }

  /**
   * loadGeometry
   * @param dragGeometry - dragModels
   */
  loadGeometry(dragGeometry: CurrentDragModelData) {
    if (!this.scene || !dragGeometry.modelData) return;

    // keys that are not geometry constructor args
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

      // handle otherGeometry
      const geometryData = Object.keys(dragGeometry.modelData as GeometryType)
        .filter((key) => !notGeometryKey.includes(key))
        .map((key) => (dragGeometry.modelData as GeometryType)[key]);

      geometry = new THREE[(dragGeometry?.modelData as GeometryType).type](
        ...(geometryData as unknown as number[])
      );

      // create physicalMaterial
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#fff'), // soft blue
        side: THREE.DoubleSide,
        metalness: 0.3, // less metal, more natural
        roughness: 0.7, // increaseRoughness,less glare
        emissive: new THREE.Color('#1B3A5A'), // add dark-blue emissive
        emissiveIntensity: 0.2, // lowemissive intensity
      });

      // create mesh
      const mesh = new THREE.Mesh(geometry, material);
      // setShadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // add toScene

      this.scene.add(mesh);
      // highlight object
      this.setObjectHighlight(mesh);

      const mousePosition = getMousePosition(
        dragGeometry.clientX,
        dragGeometry.clientY
      );
      mesh.name = geometryType;
      mesh.updateMatrixWorld(true);
      const author = new THREE.Box3().setFromObject(mesh);
      const authorH = author.isEmpty()
        ? 1
        : Math.max(author.getSize(new THREE.Vector3()).y, 0.2);
      mesh.userData = {
        ...mesh.userData,
        isTransformControls: true,
        siHeightM: authorH,
      };
      setModelPositionSize(mesh, mousePosition, 'mesh');
    } catch (error) {
      console.error('Failed to create geometry:', error);
    }
  }
  /**
   * loadLights
   * @param dragLight - dragLights
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
   * loadindexDbScenedata
   * @param indexDbSceneData - Scenedata
   * @returns Promise<void>
   */
  async loadIndexDbSceneData(
    indexDbSceneData: IndexDbSceneData
  ): Promise<boolean> {
    try {
      const { camera, scene, controls } = indexDbSceneData;
      // 1. dispose oldSceneresource
      if (this.scene) {
        disposeScene(this.scene);
        this.scene.clear();
      }
      // 2. create loader (cache later)
      const loader = new ObjectLoader();

      // 3. load in parallelSceneand camera data
      const [parseScene, parseCamera] = await Promise.all([
        loader.parseAsync(scene),
        loader.parseAsync(camera),
      ]);

      // 4. updateScene
      this.scene = parseScene as THREE.Scene;
      if (this.boxHelper) {
        this.boxHelper.visible = false;
        this.scene?.add(this.boxHelper);
      }

      // dispose oldSceneresource;
      disposeScene(parseScene as THREE.Scene);

      // 5. update camera (avoid an extra clone)
      if (this.camera) {
        this.camera.clear();
        this.camera.copy(parseCamera as THREE.PerspectiveCamera);
      } else {
        this.camera = parseCamera as THREE.PerspectiveCamera;
      }

      this.camera.updateProjectionMatrix();
      if (this.scene) {
        for (const child of [...this.scene.children]) {
          if ((child as THREE.Camera).isCamera) this.scene.remove(child);
        }
      }
      this.ensureCameraInScene();

      // restore controls target
      if (this.controls) {
        this.controls.target.set(controls.x, controls.y, controls.z);
      }
      // 6. initLights — one sun, helpers off
      this.lightModules.initLight();
      dedupeSceneLights(this.scene);
      hydrateContentLayers(this.scene);
      hydrateMapSurfaces(this.scene);
      // 6. init ground
      this.initPlaneGround(indexDbSceneData);
      // 7. create transform controls
      this.transformControlsModules.createTransformControls();
      // 8. resize
      this.onWindowResizes();
      // 9. drop temps
      parseCamera?.clear();
      // 10. initAnimation
      this.animationModules.initializeAnimations();
      return Promise.resolve(true);
    } catch (error) {
      console.error('Failed to load IndexedDB scene:', error);
      return Promise.resolve(false);
    }
  }
  getDracoLoader() {
    void bindProductionKtx2(this.renderer);
    return getProductionGltfLoader();
  }

  /**
   * on progress
   * @param xhr - progress event
   */
  handleLoadProgress(xhr: ProgressEvent): void {
    if (xhr.lengthComputable && this.modelProgressCallback) {
      this.modelProgressCallback(xhr.loaded, xhr.total);
    }
  }

  /**
   * on load error
   * @param err - error
   * @returns boolean
   */
  handleLoadError(err: unknown) {
    console.error('Failed to load model:', err);
    if (err instanceof Error) {
      ElMessage.error('Invalid file');
    }
    return Promise.resolve(true);
  }

  /**
   * setModelsload-progress callback
   * @param callback - callback
   */
  onProgress(callback: (progressNum: number, totalSize: number) => void) {
    if (typeof callback === 'function') {
      this.modelProgressCallback = callback;
    }
  }

  /**
   * select object
   * @param node - Materialnode
   */
  chooseMaterial(node: MaterialNode) {
    const material = this.scene?.getObjectByProperty('uuid', node.uuid);
    if (!material) return;
    this.transformControlsModules?.transformControls?.attach(material);
    store.setCurrentTransformMaterialUuid(material.uuid);
    this.setObjectHighlight(material);
    store.setTransformMaterialRandomId();
  }
  /**
   * delete object
   * @param node - Materialnode
   * @returns Promise<boolean>
   */
  deleteSceneMaterial(node: MaterialNode) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        // look up the scene object by uuid
        const material = this.scene?.getObjectByProperty('uuid', node.uuid);

        if (!material) return;
        if (material.userData?.lockedRoot) {
          reject(new Error('Scene manager / HUD root stays'));
          return;
        }

        // if a light, remove its helper
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
        // dispose material and remove object
        const disposeMaterialAndRemove = () => {
          if (node.children) {
            // dispose every childMaterial
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
        store.setTransformMaterialRandomId();

        resolve(true);
      } catch {
        reject(new Error('Failed to delete object'));
      }
    });
  }
  /**
   * copy object
   * @param node - Materialnode
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

    // clone object
    const clonedObject = clone(originalObject);

    if (clonedObject) {
      // DepthcloneMaterial
      clonedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            // handle material array
            child.material = child.material.map((mat) => {
              const newMat = mat.clone() as THREE.Material & MaterialType;
              // clone textures too
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
            // handle singleMaterial
            const newMat = child.material.clone() as THREE.Material &
              MaterialType;
            // clone textures too
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

      // set position andUUID
      const originalPosition = originalObject.position.clone();
      clonedObject.position.copy(originalPosition).add(offset);
      clonedObject.uuid = THREE.MathUtils.generateUUID();

      // add toScene
      this.scene?.add(clonedObject);
      store.setTransformMaterialRandomId();

      // dispose resources
      if (originalObject instanceof THREE.Mesh) {
        disposeMaterial(originalObject);
      }
    }
  }
  /**
   * highlight the object
   * @param object - object to highlight
   * @param isGroup - whether it is a group
   */
  setObjectHighlight(object: THREE.Object3D) {
    store.setCurrentTransformMaterialUuid(object.uuid);
    this.transformControlsModules.transformControls?.attach(object);
    // create new BoxHelper
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
      const kit = root.userData.raceKit as
        { hoverMesh?: string | null } | undefined;
      if (kit && kit.hoverMesh === name) return;
      setHoverMesh(root, name);
      store.setTransformMaterialRandomId();
    });
  }

  getSelectedObject(): THREE.Object3D | null {
    if (!this.scene) return null;
    const uuid = store.currentTransformMaterialUuid;
    if (!uuid) return null;
    return this.scene.getObjectByProperty('uuid', uuid) || null;
  }

  /** Asset-to-ground: snap selection onto stamped terrain (or y=0). */
  snapSelectedToGround(): { ok: boolean; terrainId: string } {
    if (!this.scene) return { ok: false, terrainId: '' };
    const obj = this.getSelectedObject();
    if (!obj) return { ok: false, terrainId: '' };
    const root = findRaceKitRoot(obj) || obj;
    const before = root.position.clone();
    const result = snapObjectToTerrain(root, this.scene);
    if (result.ok) {
      const after = root.position.clone();
      root.position.copy(before);
      this.historyModules.execute(
        new TransformCommand(
          root,
          after,
          root.rotation.clone(),
          root.scale.clone()
        )
      );
    }
    this.setObjectHighlight(root);
    return result;
  }

  /** Hierarchy Ctrl+Alt+LMB: put the selected asset in front of the current camera view. */
  placeSelectedInFrontOfCamera(): { ok: boolean } {
    if (!this.scene || !this.camera) return { ok: false };
    const obj = this.getSelectedObject();
    if (!obj || obj === this.camera) return { ok: false };
    const root = findRaceKitRoot(obj) || obj;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    const dist = Math.max(3, maxDim * 1.6);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const desiredCenter = this.camera.position
      .clone()
      .addScaledVector(dir, dist);
    const currentCenter = box.isEmpty()
      ? root.getWorldPosition(new THREE.Vector3())
      : box.getCenter(new THREE.Vector3());
    const worldPos = root
      .getWorldPosition(new THREE.Vector3())
      .add(desiredCenter.sub(currentCenter));
    const local = root.parent
      ? root.parent.worldToLocal(worldPos.clone())
      : worldPos;
    this.historyModules.execute(
      new TransformCommand(
        root,
        local,
        root.rotation.clone(),
        root.scale.clone()
      )
    );
    this.setObjectHighlight(root);
    return { ok: true };
  }
  /**
   * update geometry
   * @param labelKey - param label
   * @param value - param value
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
      console.error('Failed to update geometry:', error);
      ElMessage.error('Failed to update geometry');
    }
    disposeMaterial(material);
  }
  /**
   * update materialtype
   * @param type - material types
   * @returns THREE.Material | null
   */
  updateMaterialType(type: string, meshUuid?: string) {
    const uuid = meshUuid || store.currentTransformMaterialUuid;
    if (!uuid) return;
    const object = this.scene?.getObjectByProperty('uuid', uuid);
    if (!object) return;
    const mesh = firstEditableMesh(object);
    if (!mesh) return;
    const oldMaterial = materialOf(mesh);
    if (!oldMaterial) return;
    const material = createMaterial(type, {
      ...(oldMaterial as unknown as MaterialConfig),
    });
    mesh.material = material;
    disposeMaterial(oldMaterial);
    return mesh;
  }
  /**
   * destroyModels
   */
  renderDestroy() {
    this.measureUnbind?.();
    this.measureUnbind = null;
    // CancelAnimationloop
    if (this.renderAnimation) {
      cancelAnimationFrame(this.renderAnimation);
      this.renderAnimation = null;
    }

    disposeScene(this.scene);
    TWEEN.removeAll();
    // TWEEN.removeAll()cleanScene
    this.scene?.clear();
    // dispose controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    // remove listeners
    if (this.onWindowResizesListener) {
      window.removeEventListener('resize', this.onWindowResizesListener);
      this.onWindowResizesListener = null;
    }

    // dispose transform controls
    this.transformControlsModules?.destroy();

    // dispose ViewHelper
    if (this.viewHelper) {
      this.viewHelper.dispose();
      this.viewHelper = null;
    }

    // null remaining refs
    this.camera = null;
    this.scene = null;
    this.container = null;
    this.destroyPointerLockControls();
  }
}
export default renderScene;
