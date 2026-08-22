import { nextTick } from 'vue';
import type { ElTree, ElScrollbar } from 'element-plus';
import type {
  MaterialConfig,
  MaterialWithUniforms,
} from '@/types/rightPanelTypes';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import * as THREE from 'three';
import type { MODEL_TYPE } from '@/enums/enum';
import { LIGHT_ICON_TYPE } from '@/enums/enum';
import { ElNotification } from 'element-plus';

/**
 * file extension
 * @param fileName file name
 * @returns file extension(lowercase)
 */
export function getFileType(fileName: string): MODEL_TYPE {
  return fileName.split('.').pop()?.toLowerCase() as MODEL_TYPE;
}

/**
 * light position from angles
 * @param horizontal horizontal angle(Arc)
 * @param vertical vertical angle(Arc)
 * @param distance light distance
 * @returns light position
 */
export function lightPosition(
  horizontal: number,
  vertical: number,
  distance: number
): { x: number; y: number; z: number } {
  return {
    x: distance * Math.sin(horizontal) * Math.cos(vertical),
    y: distance * Math.sin(vertical),
    z: distance * Math.cos(horizontal) * Math.cos(vertical),
  };
}

/**
 * resolve assetPath
 * @param url resourcePath
 * @returns resourcePath
 */
export const getAssetUrl = (url: string) => {
  return new URL(`/src/assets/${url}`, import.meta.url).href;
};

/**
 * uniqueID
 * @param prefix optional prefix
 * @returns uniqueIDstring
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * getSceneMateriallist
 * @param mesh Scene
 * @returns
 */
export const isLight = (mesh: THREE.Object3D): boolean => {
  return (
    mesh instanceof THREE.DirectionalLight ||
    mesh instanceof THREE.PointLight ||
    mesh instanceof THREE.SpotLight ||
    mesh instanceof THREE.HemisphereLight ||
    mesh instanceof THREE.AmbientLight
  );
};
// Local scene material interfaces
interface SceneMaterialItem {
  uuid: string;
  name: string;
  iconClass: string;
  type: string;
  kind?: string;
}

interface SceneModelItem extends SceneMaterialItem {
  children?: SceneModelItem[];
}

/**
 * checkModelswhetherGeometry
 * @param model Models
 * @returns whetherGeometry
 */
const isGeometry = (model: THREE.Object3D): boolean =>
  model instanceof THREE.Mesh && model.geometry instanceof THREE.BufferGeometry;

/**
 * checkModelswhether it is an effect
 * @param model Models
 * @returns whether it is an effect
 */
const isEffect = (model: THREE.Object3D): boolean =>
  model instanceof THREE.Points;

/**
 * whether this type is a light
 * @param type type
 * @returns whether it is a light type
 */
const isLightIconType = (type: string): type is keyof typeof LIGHT_ICON_TYPE =>
  type in LIGHT_ICON_TYPE;

/**
 * light icon class
 * @param type type
 * @returns light icon class
 */
const getLightIconClass = (type: string) =>
  (isLightIconType(type) ? LIGHT_ICON_TYPE[type] : undefined) || 'icon-light';

/**
 * getSceneMateriallist
 * @param scene Scene
 * @returns SceneMateriallist
 */
export function skipInTree(o: THREE.Object3D): boolean {
  if (!o) return true;
  if (o.userData?.editorGizmo || o.userData?.isHelper || o.userData?.lightHelper)
    return true;
  if (/^__(char|tf|fleet|cdn)/i.test(o.name)) return true;
  const kind = o.type || '';
  if (/TransformControls|ViewportGizmo|CSS2D|CSS3D/i.test(kind)) return true;
  if (/transformcontrols|viewportgizmo/i.test(o.name || '')) return true;
  if (
    o instanceof THREE.SkeletonHelper ||
    o instanceof THREE.BoxHelper ||
    o instanceof THREE.AxesHelper ||
    o instanceof THREE.GridHelper ||
    o instanceof THREE.CameraHelper
  )
    return true;
  return false;
}

/** Walk a viewport hit up to the dropped asset root (gizmo + hierarchy uuid). */
export function pickableRoot(obj: THREE.Object3D | null | undefined): THREE.Object3D | null {
  if (!obj) return null;
  let o: THREE.Object3D | null = obj;
  let last = obj;
  while (o) {
    if (skipInTree(o)) {
      o = o.parent;
      continue;
    }
    last = o;
    if (o.userData?.isTransformControls) return o;
    if (!o.parent || o.parent.type === 'Scene') return o;
    o = o.parent;
  }
  return last;
}

export function clipsOnObject(obj: THREE.Object3D | null | undefined): THREE.AnimationClip[] {
  let o: THREE.Object3D | null | undefined = obj;
  while (o) {
    const anims = (o as THREE.Object3D & { animations?: THREE.AnimationClip[] }).animations;
    if (Array.isArray(anims) && anims.length) return anims;
    o = o.parent;
  }
  return [];
}

function treeIcon(model: THREE.Object3D): string {
  const role = String(model.userData?.grudgeRole || model.userData?.kind || '');
  if (role === 'hud-root' || role === 'hud-frame' || role === 'hud-slot')
    return 'icon-changjing2';
  if (role === 'game-manager') return 'icon-zhuti';
  if (role === 'network-manager') return 'icon-zhuti1';
  if (model instanceof THREE.SkinnedMesh) return 'icon-donghua';
  if (model instanceof THREE.Bone || model.type === 'Bone') return 'icon-a-tree_icon_py1x';
  if (model instanceof THREE.Group) return 'icon-brankiclayout';
  return 'icon-moxing';
}

export const getSceneMaterialList = (scene: THREE.Scene): SceneModelItem[] => {
  const createModelData = (model: THREE.Object3D): SceneModelItem => {
    const kids = model.children
      .filter((c) => !skipInTree(c))
      .map(createModelData);
    const role = model.userData?.grudgeRole || model.userData?.kind;
    const baseData: SceneModelItem = {
      uuid: model.uuid,
      type: model.type,
      iconClass: treeIcon(model),
      name: model.name || model.type || 'node',
      kind: role,
    };
    if (kids.length) baseData.children = kids;

    if (
      model instanceof THREE.PerspectiveCamera ||
      model instanceof THREE.OrthographicCamera
    ) {
      return {
        ...baseData,
        name: model.name || 'Camera',
        iconClass: 'icon-24gf-camera2',
      };
    }
    if (isLight(model)) {
      return {
        ...baseData,
        name: model.name || 'Light',
        iconClass: getLightIconClass(model.type),
      };
    }
    if (isEffect(model)) {
      return {
        ...baseData,
        name: model.name || 'Points',
        iconClass: 'icon-lizifeisheng',
      };
    }
    if (isGeometry(model)) return baseData;
    return baseData;
  };

  return scene.children
    .filter((item) => !skipInTree(item))
    .map(createModelData);
};

/**
 * mesh geometry type
 * @param mesh - mesh
 * @returns geometry type
 */
export const getMeshType = (mesh: THREE.Mesh) => {
  if (mesh instanceof THREE.Mesh) {
    return mesh.geometry.type;
  }
  return '';
};

type ScrollOptions = {
  behavior?: 'auto' | 'smooth'; // scroll behavior
  offset?: number; // extra offset (e.g. top padding)
};

/**
 * scroll to el-tree current selected node
 * @param treeRef el-tree Ref
 * @param scrollbarRef el-scrollbar Ref
 * @param options scroll options
 * @param currentNodeKey selected node key
 */
export const scrollToTreeNode = async (
  treeRef: typeof ElTree | null,
  scrollbarRef: typeof ElScrollbar | null,
  options: ScrollOptions = { behavior: 'auto', offset: 0 },
  currentNodeKey: string | null = null
): Promise<void> => {
  if (!treeRef || !scrollbarRef) {
    return;
  }

  // current selected node key
  if (!currentNodeKey) {
    console.warn('No node selected');
    return;
  }

  // node info
  const node = treeRef.getNode(currentNodeKey) as { data: { uuid: string } };
  if (!node?.data) {
    return;
  }

  // wait for DOM update
  await nextTick();

  // scroll container
  const scrollWrap = (
    scrollbarRef.$el as HTMLElement
  ).querySelector<HTMLElement>('.el-scrollbar__wrap');
  if (!scrollWrap) {
    return;
  }

  // get node DOM element via data-key
  const nodeElement = document.querySelector<HTMLElement>(
    `[data-key="${node.data.uuid}"]`
  );

  if (!nodeElement) {
    return;
  }

  // exact scroll offset
  const scrollRect = scrollWrap.getBoundingClientRect();
  const nodeRect = nodeElement.getBoundingClientRect();
  const offsetTop =
    nodeRect.top -
    scrollRect.top +
    scrollWrap.scrollTop +
    (options.offset || 0);

  // scroll
  scrollWrap.scrollTo({
    top: offsetTop,
  });
};

/**
 * createMaterial
 * @param type material types
 * @param config Materialconfig
 * @returns Material
 */
export function createMaterial(
  type: string,
  config: MaterialConfig = {}
): THREE.Material {
  let commonParams = {
    color: new THREE.Color(config.color) || 0xffffff,
    opacity: config.opacity ?? 1,
    transparent: config.transparent ?? false,
    wireframe: config.wireframe ?? false,
    map: config.map || null,
    alphaMap: config.alphaMap || null,
  };

  switch (type) {
    // meshMaterial
    case 'MeshPhysicalMaterial':
      return new THREE.MeshPhysicalMaterial({
        ...commonParams,
        metalness: config.metalness ?? 0.5,
        roughness: config.roughness ?? 0.5,
        clearcoat: config.clearcoat ?? 0,
        clearcoatRoughness: config.clearcoatRoughness ?? 0,
        normalMap: config.normalMap || null,
      });
    // standardMaterial
    case 'MeshStandardMaterial':
      return new THREE.MeshStandardMaterial({
        ...commonParams,
        metalness: config.metalness ?? 0.5,
        roughness: config.roughness ?? 0.5,
        normalMap: config.normalMap || null,
      });

    case 'MeshBasicMaterial':
      return new THREE.MeshBasicMaterial(commonParams);

    case 'MeshLambertMaterial':
      return new THREE.MeshLambertMaterial(commonParams);

    case 'MeshPhongMaterial':
      return new THREE.MeshPhongMaterial({
        ...commonParams,
        shininess: config.shininess ?? 30,
        specular: new THREE.Color(config.specular) || 0x111111,
        normalMap: config.normalMap || null,
      });

    case 'MeshToonMaterial':
      return new THREE.MeshToonMaterial({
        ...commonParams,
        normalMap: config.normalMap || null,
      });

    // normalMaterial
    case 'MeshNormalMaterial':
      return new THREE.MeshNormalMaterial({
        ...commonParams,
        bumpScale: config.bumpScale ?? 1,
        normalMap: config.normalMap || null,
      });

    // DepthMaterial
    case 'MeshDepthMaterial':
      return new THREE.MeshDepthMaterial(commonParams);

    // lambertMaterial
    case 'MeshMatcapMaterial':
      return new THREE.MeshMatcapMaterial({
        ...commonParams,
        matcap: config.matcap || null,
        normalMap: config.normalMap || null,
      });

    // lineMaterial
    case 'LineBasicMaterial':
      return new THREE.LineBasicMaterial({
        ...commonParams,
        linewidth: config.linewidth ?? 1,
      });
    // dashedMaterial
    case 'LineDashedMaterial': {
      const material = new THREE.LineDashedMaterial({
        ...commonParams,
        dashSize: config.dashSize ?? 3,
        gapSize: config.gapSize ?? 1,
      }) as THREE.LineDashedMaterial & {
        defines?: Record<string, string>;
      };
      material.defines = { USE_DASH: '' };
      return material;
    }

    // pointMaterial
    case 'PointsMaterial':
      return new THREE.PointsMaterial({
        ...commonParams,
        size: config.size ?? 0.1,
        sizeAttenuation: config.sizeAttenuation ?? true,
      });

    default:
      console.warn(
        `Unsupported material type: ${type}, falling back to MeshStandardMaterial`
      );
      return new THREE.MeshStandardMaterial(commonParams);
  }
}

/**
 * check whethervalue whetherMapProperties
 * @param key Propertiesname
 * @returns whetherMapProperties
 */
export const verifyValueMap = (key: string) => {
  return [
    'map', // basecolorMap
    'alphaMap', // Alpha map
    'bumpMap', // Bump map
    'normalMap', // Normal map
    'displacementMap', // displacementMap
    'roughnessMap', // Roughness map
    'metalnessMap', // Metalness map
    'envMap', // EnvironmentMap
    'lightMap', // Light map
    'aoMap', // EnvironmentocclusionMap
    'emissiveMap', // Emissive map
    'specularMap', // specularMap
    'gradientMap', // gradientMap
    'matcap', // MatCap Map
    'clearcoatMap', // clearcoatMap
    'clearcoatNormalMap', // clearcoatNormal map
    'clearcoatRoughnessMap', // clearcoatRoughness map
    'sheenColorMap', // sheencolorMap
    'sheenRoughnessMap', // sheenRoughness map
    'transmissionMap', // transmissionMap
    'thicknessMap', // thicknessMap
    'iridescenceMap', // Iridescence map
  ].includes(key);
};

/**
 * check whethervalue whether colorProperties
 * @param key Propertiesname
 * @returns whethercolorProperties
 */
export const verifyValueColor = (key: string) => {
  return ['color', 'emissive', 'sheenColor'].includes(key);
};
/**
 * getSceneallModels
 * @param scene Scene
 * @returns SceneallModels
 */
export const getSceneModelList = (scene: THREE.Scene) => {
  return scene.children.filter((item) => item.userData.isTransformControls);
};

/**
 * getModelsembeddedMap
 * @param {THREE.Texture} texture - Map
 * @returns {Object} Mapdata
 */
function isCanvasImage(img: unknown): img is CanvasImageSource {
  if (!img || typeof img !== 'object') return false;
  return (
    img instanceof HTMLImageElement ||
    img instanceof HTMLCanvasElement ||
    img instanceof ImageBitmap ||
    img instanceof OffscreenCanvas ||
    img instanceof HTMLVideoElement ||
    (typeof SVGImageElement !== 'undefined' && img instanceof SVGImageElement)
  );
}

export const generateMaterialMaps = (
  texture: THREE.Texture | THREE.DataTexture
) => {
  if (!texture?.image) return null;

  // handle HDR map (DataTexture)
  if (texture instanceof THREE.DataTexture) {
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // create aPlaneto renderHDRMap
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // set render size
    renderer.setSize(256, 256);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // renderScene
    renderer.render(scene, camera);

    // previewimage
    const textureMap = renderer.domElement.toDataURL('image/png', 1);

    // dispose resources
    renderer.dispose();
    geometry.dispose();
    material.dispose();

    return textureMap;
  }

  const src = texture.image as { width?: number; height?: number };
  if (!isCanvasImage(src) || !src.width || !src.height) return null;

  // handle regularMap
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(src.width / 2));
  canvas.height = Math.max(1, Math.floor(src.height / 2));

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (!context) return null;
  try {
    context.drawImage(src, 0, 0, canvas.width, canvas.height);
  } catch {
    canvas.remove();
    return null;
  }
  const textureMap = canvas.toDataURL('image/png', 1);
  canvas.remove();

  return textureMap;
};
/**
 * update materialMap
 * @param fileUrl MapURL
 * @param fileType Maptype
 * @returns Map
 */
const COLOR_MAP_KEYS = new Set([
  'map',
  'emissiveMap',
  'sheenColorMap',
  'specularMap',
  'envMap',
  'matcap',
  'backgroundMap',
]);

/** sRGB for color maps, linear for data maps (normal / roughness / metal / AO). */
export function prepareEditorTexture(
  texture: THREE.Texture,
  mapKey = 'map'
): THREE.Texture {
  texture.needsUpdate = true;
  texture.colorSpace = COLOR_MAP_KEYS.has(mapKey)
    ? THREE.SRGBColorSpace
    : THREE.NoColorSpace;
  texture.anisotropy = Math.max(texture.anisotropy, 8);
  if (texture.wrapS === THREE.ClampToEdgeWrapping) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  return texture;
}

export function collectEditableMeshes(root: THREE.Object3D | null): THREE.Mesh[] {
  if (!root) return [];
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.material) out.push(m);
  });
  return out;
}

export function firstEditableMesh(
  root: THREE.Object3D | null
): THREE.Mesh | null {
  if (!root) return null;
  const m = root as THREE.Mesh;
  if (m.isMesh && m.material) return m;
  return collectEditableMeshes(root)[0] || null;
}

export function materialOf(mesh: THREE.Mesh | null): THREE.Material | null {
  if (!mesh) return null;
  const mat = mesh.material;
  return Array.isArray(mat) ? mat[0] : mat;
}

export const updateMaterialMap = async (
  fileUrl: string,
  fileType: string,
  mapKey = 'map'
) => {
  const loader =
    fileType === 'hdr' ? new HDRLoader() : new THREE.TextureLoader();
  const textures = await loader.loadAsync(fileUrl);
  return prepareEditorTexture(textures, mapKey);
};

/**
 * disposeMaterialresource
 * @param material - to disposeMaterialobject
 */
export const disposeMaterial = (
  material: THREE.Mesh | THREE.Material | THREE.Material[]
): void => {
  if (!material) return;

  const disposeSingleMaterial = (mat: THREE.Material) => {
    // dispose textures
    Object.values(mat).forEach((value) => {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    });

    // dispose uniforms
    const materialWithUniforms = mat as MaterialWithUniforms;
    if (materialWithUniforms.uniforms) {
      Object.values(materialWithUniforms.uniforms).forEach((uniform) => {
        if (uniform?.value?.dispose) {
          uniform.value.dispose();
        }
      });
    }
    // disposeMaterialitself
    mat.dispose();
  };

  if (material instanceof THREE.Mesh && material.material) {
    // handle meshMaterial
    if (Array.isArray(material.material)) {
      material.material.forEach(disposeSingleMaterial);
    } else {
      disposeSingleMaterial(material.material);
    }
  } else if (material instanceof THREE.Material) {
    // handle material object
    disposeSingleMaterial(material);
  } else if (Array.isArray(material)) {
    // handle material array
    material.forEach(disposeSingleMaterial);
  }
};

/**
 * disposeSceneresource
 * @param scene - to disposeScene
 */
export const disposeScene = (scene: THREE.Scene | null | undefined) => {
  if (!scene) return;

  scene.traverse((object: THREE.Object3D) => {
    // disposeGeometry
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      // disposeMaterial
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            disposeMaterial(material as THREE.Material);
          });
        } else {
          disposeMaterial(object.material as THREE.Material);
        }
      }
    }
  });
};

/**
 * disposeMapresource
 * @param material -
 */
export const disposeTextures = (material: THREE.Material) => {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
};

/**
 * Check page usage time and show a notice
 * @param ip currentIPurl
 * @param maxDays max allowed days
 */
export const checkPageUsageTime = (maxDays: number = 5) => {
  // now
  const currentTime = Date.now();

  // first-visit time from localStorage
  const firstAccessKey = `first_access_key`;
  const firstAccessTime = localStorage.getItem(firstAccessKey);

  if (!firstAccessTime) {
    // first visit — store the timestamp
    localStorage.setItem(firstAccessKey, currentTime.toString());
    return;
  }

  // days used
  const daysUsed = Math.floor(
    (currentTime - parseInt(firstAccessTime)) / (1000 * 60 * 60 * 24)
  );
  // if past the max usage days, show notice
  if (daysUsed >= maxDays) {
    ElNotification.warning({
      title: 'Trial notice',
      message: `Trial period exceeded ${maxDays} days. Contact an admin for a license. vx:answer_2027`,
      duration: 0,
    });
    return true;
  }
  return false;
};

/**
 * Convert a hex color string to HSL
 * @param hex hex color string (#RRGGBB)
 * @returns HSLobject
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // strip leading #
  hex = hex.replace(/^#/, '');

  // parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h, s, l };
}
