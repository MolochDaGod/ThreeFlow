import { nextTick } from 'vue';
import type { ElTree, ElScrollbar } from 'element-plus';
import type {
  MaterialConfig,
  MaterialWithUniforms,
} from '@/types/rightPanelTypes';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as THREE from 'three';
import type { MODEL_TYPE } from '@/enums/enum';
import { DRAG_MODEL_TYPE, LIGHT_ICON_TYPE } from '@/enums/enum';
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
 * @param horizontal 水平方向角度(弧度)
 * @param vertical 垂直方向角度(弧度)
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
 * 获取资源路径
 * @param url 资源路径
 * @returns 资源路径
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
 * 获取场景材质列表
 * @param mesh 场景
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
 * 获取场景材质列表
 * @param scene 场景
 * @returns 场景材质列表
 */
export const getSceneMaterialList = (scene: THREE.Scene): SceneModelItem[] => {
  // 获取指定模型下所有的 Mesh 材质
  const getAllMeshMaterials = (model: THREE.Object3D): SceneMaterialItem[] => {
    const materials: SceneMaterialItem[] = [];

    model.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      
      if (child.material instanceof THREE.Material) {
        materials.push({
          uuid: child.uuid,
          name: child.name || '未命名材质',
          iconClass: 'icon-model',
          type: child.type,
        });
      } else if (Array.isArray(child.material)) {
        materials.push(
          ...child.material
            .filter(Boolean)
            .map((mat: THREE.Material) => ({
              uuid: mat.uuid,
              name: mat.name || '未命名材质',
              iconClass: 'icon-model',
              type: mat.type,
            }))
        );
      }
    });

    return Array.from(
      new Map(materials.map(mat => [mat.uuid, mat])).values()
    );
  };

  // 类型检查辅助函数
  const isGeometry = (model: THREE.Object3D): boolean => 
    model instanceof THREE.Mesh && model.geometry instanceof THREE.BufferGeometry;
  
  const isEffect = (model: THREE.Object3D): boolean => 
    model instanceof THREE.Points;
  
  const isText = (model: THREE.Object3D): boolean => 
    model.userData.type === DRAG_MODEL_TYPE.Text;

  const isLightIconType = (type: string): type is keyof typeof LIGHT_ICON_TYPE =>
    type in LIGHT_ICON_TYPE;

  const getLightIconClass = (type: string) =>
    (isLightIconType(type) ? LIGHT_ICON_TYPE[type] : undefined) || 'icon-light';

  // 根据类型创建模型数据
  const createModelData = (model: THREE.Object3D): SceneModelItem => {
    const baseData: SceneModelItem = {
      uuid: model.uuid,
      type: model.type,
      iconClass: 'icon-moxing',
      name: model.name || '未命名模型'
    };

    // 根据模型类型自定义数据
    if (isGeometry(model)) {
      return baseData;
    } else if (isLight(model)) {
      return {
        ...baseData,
        name: model.name || '未命名光源',
        iconClass: getLightIconClass(model.type)
      };
    } else if (isEffect(model)) {
      return {
        ...baseData,
        name: model.name || '未命名特效',
        iconClass: 'icon-lizifeisheng'
      };
    } else if (isText(model)) {
      return {
        ...baseData,
        name: model.name || '未命名文本',
        iconClass: 'icon-wenben'
      };
    }

    // 对于带有材质的模型
    return {
      ...baseData,
      children: getAllMeshMaterials(model)
    };
  };

  // 过滤和映射
  return scene.children
    .filter((item: THREE.Object3D) => item.userData.isTransformControls)
    .map(createModelData);
};

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

  // 获取节点 DOM 元素（通过 data-key 属性）
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
 * 创建材质
 * @param type 材质类型
 * @param config 材质配置
 * @returns 材质
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
    // 网格材质
    case 'MeshPhysicalMaterial':
      return new THREE.MeshPhysicalMaterial({
        ...commonParams,
        metalness: config.metalness ?? 0.5,
        roughness: config.roughness ?? 0.5,
        clearcoat: config.clearcoat ?? 0,
        clearcoatRoughness: config.clearcoatRoughness ?? 0,
        normalMap: config.normalMap || null,
      });
    // 标准材质
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

    // 法线材质
    case 'MeshNormalMaterial':
      return new THREE.MeshNormalMaterial({
        ...commonParams,
        bumpScale: config.bumpScale ?? 1,
        normalMap: config.normalMap || null,
      });

    // 深度材质
    case 'MeshDepthMaterial':
      return new THREE.MeshDepthMaterial(commonParams);

    // 漫反射材质
    case 'MeshMatcapMaterial':
      return new THREE.MeshMatcapMaterial({
        ...commonParams,
        matcap: config.matcap || null,
        normalMap: config.normalMap || null,
      });

    // 线条材质
    case 'LineBasicMaterial':
      return new THREE.LineBasicMaterial({
        ...commonParams,
        linewidth: config.linewidth ?? 1,
      });
    // 虚线材质
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

    // 点材质
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
 * 验证当前value 是否是贴图属性
 * @param key 属性名
 * @returns 是否是贴图属性
 */
export const verifyValueMap = (key: string) => {
  return [
    'map', // 基础颜色贴图
    'alphaMap', // 透明度贴图
    'bumpMap', // 凹凸贴图
    'normalMap', // 法线贴图
    'displacementMap', // 位移贴图
    'roughnessMap', // 粗糙度贴图
    'metalnessMap', // 金属度贴图
    'envMap', // 环境贴图
    'lightMap', // 光照贴图
    'aoMap', // 环境光遮蔽贴图
    'emissiveMap', // 自发光贴图
    'specularMap', // 高光贴图
    'gradientMap', // 渐变贴图
    'matcap', // MatCap 贴图
    'clearcoatMap', // 清漆层贴图
    'clearcoatNormalMap', // 清漆层法线贴图
    'clearcoatRoughnessMap', // 清漆层粗糙度贴图
    'sheenColorMap', // 光泽颜色贴图
    'sheenRoughnessMap', // 光泽粗糙度贴图
    'transmissionMap', // 透射贴图
    'thicknessMap', // 厚度贴图
    'iridescenceMap', // 彩虹色贴图
  ].includes(key);
};

/**
 * 验证当前value 是否是 颜色属性
 * @param key 属性名
 * @returns 是否是颜色属性
 */
export const verifyValueColor = (key: string) => {
  return ['color', 'emissive', 'sheenColor'].includes(key);
};
/**
 * 获取场景中所有模型
 * @param scene 场景
 * @returns 场景中所有模型
 */
export const getSceneModelList = (scene: THREE.Scene) => {
  return scene.children.filter((item) => item.userData.isTransformControls);
};

/**
 * 获取模型自带贴图
 * @param {THREE.Texture} texture - 贴图
 * @returns {Object} 贴图数据
 */
export const generateMaterialMaps = (
  texture: THREE.Texture | THREE.DataTexture
) => {
  if (!texture?.image) return null;

  // 处理HDR贴图（DataTexture）
  if (texture instanceof THREE.DataTexture) {
    const renderer = new THREE.WebGLRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 创建一个平面来渲染HDR贴图
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 设置渲染尺寸
    renderer.setSize(256, 256);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // 渲染场景
    renderer.render(scene, camera);

    // 获取预览图片
    const textureMap = renderer.domElement.toDataURL('image/png', 1);

    // 清理资源
    renderer.dispose();
    geometry.dispose();
    material.dispose();

    return textureMap;
  }

  // 处理普通贴图
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
 * 更新材质贴图
 * @param fileUrl 贴图URL
 * @param fileType 贴图类型
 * @returns 贴图
 */
export const updateMaterialMap = async (fileUrl: string, fileType: string) => {
  const loader =
    fileType === 'hdr' ? new RGBELoader() : new THREE.TextureLoader();
  const textures = await loader.loadAsync(fileUrl);
  return textures;
};

/**
 * 释放材质资源
 * @param material - 要释放的材质对象
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
    // 释放材质本身
    mat.dispose();
  };

  if (material instanceof THREE.Mesh && material.material) {
    // 处理网格对象的材质
    if (Array.isArray(material.material)) {
      material.material.forEach(disposeSingleMaterial);
    } else {
      disposeSingleMaterial(material.material);
    }
  } else if (material instanceof THREE.Material) {
    // 直接处理材质对象
    disposeSingleMaterial(material);
  } else if (Array.isArray(material)) {
    // 处理材质数组
    material.forEach(disposeSingleMaterial);
  }
};

/**
 * 释放场景资源
 * @param scene - 要释放的场景
 */
export const disposeScene = (scene: THREE.Scene | null | undefined) => {
  if (!scene) return;

  scene.traverse((object: THREE.Object3D) => {
    // 释放几何体
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      // 释放材质
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
 *  释放贴图资源
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
 * 检查页面使用时间并显示提示
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
  // 如果超过最大使用天数，显示提示
  if (daysUsed >= maxDays) {
    ElNotification.warning({
      title: '使用期限提示',
      message: `您的使用期限已超过${maxDays}天，请联系管理员获取授权。vx:answer_2027`,
      duration: 0,
    });
    return true;
  }
  return false;
};

/**
 * 将十六进制颜色字符串转换为HSL对象
 * @param hex 十六进制颜色字符串 (#RRGGBB)
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
