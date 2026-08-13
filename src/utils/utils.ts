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
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名(小写)
 */
export function getFileType(fileName: string): MODEL_TYPE {
  return fileName.split('.').pop()?.toLowerCase() as MODEL_TYPE;
}

/**
 * 计算光源位置坐标
 * @param horizontal 水平方向角度(Arc)
 * @param vertical 垂直方向角度(Arc)
 * @param distance 光源距离
 * @returns 光源坐标
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
 * 获取资源Path
 * @param url 资源Path
 * @returns 资源Path
 */
export const getAssetUrl = (url: string) => {
  return new URL(`/src/assets/${url}`, import.meta.url).href;
};

/**
 * 生成唯一ID
 * @param prefix 可选前缀
 * @returns 唯一ID字符串
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * 获取SceneMaterial列表
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
}

interface SceneModelItem extends SceneMaterialItem {
  children?: SceneMaterialItem[];
}

/**
 * 检查Models是否为Geometry
 * @param model Models
 * @returns 是否为Geometry
 */
const isGeometry = (model: THREE.Object3D): boolean =>
  model instanceof THREE.Mesh &&
  model.geometry instanceof THREE.BufferGeometry;

/**
 * 检查Models是否为特效
 * @param model Models
 * @returns 是否为特效
 */
const isEffect = (model: THREE.Object3D): boolean =>
  model instanceof THREE.Points;

/**
 * 检查类型是否为光源类型
 * @param type 类型
 * @returns 是否为光源类型
 */
const isLightIconType = (
  type: string
): type is keyof typeof LIGHT_ICON_TYPE => type in LIGHT_ICON_TYPE;

/**
 * 获取光源图标类名
 * @param type 类型
 * @returns 光源图标类名
 */
const getLightIconClass = (type: string) =>
  (isLightIconType(type) ? LIGHT_ICON_TYPE[type] : undefined) || 'icon-light';

/**
 * 获取SceneMaterial列表
 * @param scene Scene
 * @returns SceneMaterial列表
 */
export const getSceneMaterialList = (scene: THREE.Scene): SceneModelItem[] => {
  // 获取指定Models下所有的 Mesh Material
  const getAllMeshMaterials = (model: THREE.Object3D): SceneMaterialItem[] => {
    const materials: SceneMaterialItem[] = [];

    model.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;

      if (child.material instanceof THREE.Material) {
        materials.push({
          uuid: child.uuid,
          name: child.name || '未命名Material',
          iconClass: 'icon-model',
          type: child.type,
        });
      } else if (Array.isArray(child.material)) {
        materials.push(
          ...child.material.filter(Boolean).map((mat: THREE.Material) => ({
            uuid: mat.uuid,
            name: mat.name || '未命名Material',
            iconClass: 'icon-model',
            type: mat.type,
          }))
        );
      }
    });

    return Array.from(
      new Map(materials.map((mat) => [mat.uuid, mat])).values()
    );
  };

  // 根据类型创建Models数据
  const createModelData = (model: THREE.Object3D): SceneModelItem => {
    const baseData: SceneModelItem = {
      uuid: model.uuid,
      type: model.type,
      iconClass: 'icon-moxing',
      name: model.name || '未命名Models',
    };

    // 根据model types自定义数据
    if (isGeometry(model)) {
      return baseData;
    } else if (isLight(model)) {
      return {
        ...baseData,
        name: model.name || '未命名光源',
        iconClass: getLightIconClass(model.type),
      };
    } else if (isEffect(model)) {
      return {
        ...baseData,
        name: model.name || '未命名特效',
        iconClass: 'icon-lizifeisheng',
      };
    }

    // 对于带有Material的Models
    return {
      ...baseData,
      children: getAllMeshMaterials(model),
    };
  };

  // 过滤和映射
  return scene.children
    .filter((item: THREE.Object3D) => item.userData.isTransformControls)
    .map(createModelData);
};

/**
 * 获取网格类型
 * @param mesh - 网格
 * @returns 网格类型
 */
export const getMeshType = (mesh: THREE.Mesh) => {
  if (mesh instanceof THREE.Mesh) {
    return mesh.geometry.type;
  }
  return '';
};

type ScrollOptions = {
  behavior?: 'auto' | 'smooth'; // 滚动行为
  offset?: number; // 额外偏移量（例如顶部间距）
};

/**
 * 滚动到 el-tree 的当前选中节点
 * @param treeRef el-tree 实例的 Ref
 * @param scrollbarRef el-scrollbar 实例的 Ref
 * @param options 滚动配置
 * @param currentNodeKey 当前选中节点的 key
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

  // 获取当前选中节点的 key
  if (!currentNodeKey) {
    console.warn('当前未选中任何节点');
    return;
  }

  // 获取节点信息
  const node = treeRef.getNode(currentNodeKey) as { data: { uuid: string } };
  if (!node?.data) {
    return;
  }

  // 等待 DOM 更新
  await nextTick();

  // 获取滚动容器
  const scrollWrap = (
    scrollbarRef.$el as HTMLElement
  ).querySelector<HTMLElement>('.el-scrollbar__wrap');
  if (!scrollWrap) {
    return;
  }

  // 获取节点 DOM 元素（通过 data-key Properties）
  const nodeElement = document.querySelector<HTMLElement>(
    `[data-key="${node.data.uuid}"]`
  );

  if (!nodeElement) {
    return;
  }

  // 计算精准偏移量
  const scrollRect = scrollWrap.getBoundingClientRect();
  const nodeRect = nodeElement.getBoundingClientRect();
  const offsetTop =
    nodeRect.top -
    scrollRect.top +
    scrollWrap.scrollTop +
    (options.offset || 0);

  // 执行滚动
  scrollWrap.scrollTo({
    top: offsetTop,
  });
};

/**
 * 创建Material
 * @param type material types
 * @param config Material配置
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
    // 网格Material
    case 'MeshPhysicalMaterial':
      return new THREE.MeshPhysicalMaterial({
        ...commonParams,
        metalness: config.metalness ?? 0.5,
        roughness: config.roughness ?? 0.5,
        clearcoat: config.clearcoat ?? 0,
        clearcoatRoughness: config.clearcoatRoughness ?? 0,
        normalMap: config.normalMap || null,
      });
    // 标准Material
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

    // 法线Material
    case 'MeshNormalMaterial':
      return new THREE.MeshNormalMaterial({
        ...commonParams,
        bumpScale: config.bumpScale ?? 1,
        normalMap: config.normalMap || null,
      });

    // DepthMaterial
    case 'MeshDepthMaterial':
      return new THREE.MeshDepthMaterial(commonParams);

    // 漫反射Material
    case 'MeshMatcapMaterial':
      return new THREE.MeshMatcapMaterial({
        ...commonParams,
        matcap: config.matcap || null,
        normalMap: config.normalMap || null,
      });

    // 线条Material
    case 'LineBasicMaterial':
      return new THREE.LineBasicMaterial({
        ...commonParams,
        linewidth: config.linewidth ?? 1,
      });
    // 虚线Material
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

    // 点Material
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
 * 验证当前value 是否是MapProperties
 * @param key Properties名
 * @returns 是否是MapProperties
 */
export const verifyValueMap = (key: string) => {
  return [
    'map', // 基础colorMap
    'alphaMap', // Alpha map
    'bumpMap', // Bump map
    'normalMap', // Normal map
    'displacementMap', // 位移Map
    'roughnessMap', // Roughness map
    'metalnessMap', // Metalness map
    'envMap', // EnvironmentMap
    'lightMap', // Light map
    'aoMap', // Environment光遮蔽Map
    'emissiveMap', // Emissive map
    'specularMap', // 高光Map
    'gradientMap', // 渐变Map
    'matcap', // MatCap Map
    'clearcoatMap', // 清漆层Map
    'clearcoatNormalMap', // 清漆层Normal map
    'clearcoatRoughnessMap', // 清漆层Roughness map
    'sheenColorMap', // 光泽colorMap
    'sheenRoughnessMap', // 光泽Roughness map
    'transmissionMap', // 透射Map
    'thicknessMap', // 厚度Map
    'iridescenceMap', // Iridescence map
  ].includes(key);
};

/**
 * 验证当前value 是否是 colorProperties
 * @param key Properties名
 * @returns 是否是colorProperties
 */
export const verifyValueColor = (key: string) => {
  return ['color', 'emissive', 'sheenColor'].includes(key);
};
/**
 * 获取Scene中所有Models
 * @param scene Scene
 * @returns Scene中所有Models
 */
export const getSceneModelList = (scene: THREE.Scene) => {
  return scene.children.filter((item) => item.userData.isTransformControls);
};

/**
 * 获取Models自带Map
 * @param {THREE.Texture} texture - Map
 * @returns {Object} Map数据
 */
export const generateMaterialMaps = (
  texture: THREE.Texture | THREE.DataTexture
) => {
  if (!texture?.image) return null;

  // 处理HDRMap（DataTexture）
  if (texture instanceof THREE.DataTexture) {
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 创建一个Plane来渲染HDRMap
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 设置渲染尺寸
    renderer.setSize(256, 256);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // 渲染Scene
    renderer.render(scene, camera);

    // 获取预览image
    const textureMap = renderer.domElement.toDataURL('image/png', 1);

    // 清理资源
    renderer.dispose();
    geometry.dispose();
    material.dispose();

    return textureMap;
  }

  // 处理普通Map
  const canvas = document.createElement('canvas');
  const { width, height } = texture.image as ImageBitmap;
  canvas.width = width / 2;
  canvas.height = height / 2;

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (!context) return null;
  context.drawImage(
    texture.image as ImageBitmap,
    0,
    0,
    canvas.width,
    canvas.height
  );
  const textureMap = canvas.toDataURL('image/png', 1);
  canvas.remove();

  return textureMap;
};
/**
 * update materialMap
 * @param fileUrl MapURL
 * @param fileType Map类型
 * @returns Map
 */
export const updateMaterialMap = async (fileUrl: string, fileType: string) => {
  const loader =
    fileType === 'hdr' ? new HDRLoader() : new THREE.TextureLoader();
  const textures = await loader.loadAsync(fileUrl);
  return textures;
};

/**
 * 释放Material资源
 * @param material - 要释放的Material对象
 */
export const disposeMaterial = (
  material: THREE.Mesh | THREE.Material | THREE.Material[]
): void => {
  if (!material) return;

  const disposeSingleMaterial = (mat: THREE.Material) => {
    // 释放纹理
    Object.values(mat).forEach((value) => {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    });

    // 释放 uniforms
    const materialWithUniforms = mat as MaterialWithUniforms;
    if (materialWithUniforms.uniforms) {
      Object.values(materialWithUniforms.uniforms).forEach((uniform) => {
        if (uniform?.value?.dispose) {
          uniform.value.dispose();
        }
      });
    }
    // 释放Material本身
    mat.dispose();
  };

  if (material instanceof THREE.Mesh && material.material) {
    // 处理网格对象的Material
    if (Array.isArray(material.material)) {
      material.material.forEach(disposeSingleMaterial);
    } else {
      disposeSingleMaterial(material.material);
    }
  } else if (material instanceof THREE.Material) {
    // 直接处理Material对象
    disposeSingleMaterial(material);
  } else if (Array.isArray(material)) {
    // 处理Material数组
    material.forEach(disposeSingleMaterial);
  }
};

/**
 * 释放Scene资源
 * @param scene - 要释放的Scene
 */
export const disposeScene = (scene: THREE.Scene | null | undefined) => {
  if (!scene) return;

  scene.traverse((object: THREE.Object3D) => {
    // 释放Geometry
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      // 释放Material
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
 *  释放Map资源
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
 * 检查页面使用时间并显示Notice
 * @param ip 当前IP地址
 * @param maxDays 最大允许使用天数
 */
export const checkPageUsageTime = (maxDays: number = 5) => {
  // 获取当前时间戳
  const currentTime = Date.now();

  // 从localStorage获取该IP的首次访问时间
  const firstAccessKey = `first_access_key`;
  const firstAccessTime = localStorage.getItem(firstAccessKey);

  if (!firstAccessTime) {
    // 如果是首次访问，记录当前时间
    localStorage.setItem(firstAccessKey, currentTime.toString());
    return;
  }

  // 计算已使用天数
  const daysUsed = Math.floor(
    (currentTime - parseInt(firstAccessTime)) / (1000 * 60 * 60 * 24)
  );
  // 如果超过最大使用天数，显示Notice
  if (daysUsed >= maxDays) {
    ElNotification.warning({
      title: '使用期限Notice',
      message: `您的使用期限已超过${maxDays}天，请联系管理员获取授权。vx:answer_2027`,
      duration: 0,
    });
    return true;
  }
  return false;
};

/**
 * 将十六进制color字符串转换为HSL对象
 * @param hex 十六进制color字符串 (#RRGGBB)
 * @returns HSL对象
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // 移除#号
  hex = hex.replace(/^#/, '');

  // 解析十六进制值
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
