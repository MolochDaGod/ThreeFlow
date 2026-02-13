import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import { ElMessage } from 'element-plus';
import { FOG_TYPE, MODEL_TYPE } from '@/enums/enum';
import { ENVIRONMENT_TYPE, BACKGROUND_TYPE } from '@/enums/enum';
import * as THREE from 'three';
import { type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { disposeMaterial, disposeScene } from '../utils';
import { useSceneStore } from '@/store/sceneEditStore';
import type { PlaneGeometry, ExportType } from '@/types/rightPanelTypes';
import {
  FOG_COLOR_VALUE,
  FOG_DENSITY_VALUE,
  FOG_FAR_VALUE,
  FOG_NEAR_VALUE,
} from '@/config/propertyConfig';
import { cloneDeep } from 'lodash-es';

const store = useSceneStore();

/**
 * 获取场景配置
 * @returns 场景配置
 */
export const getSceneConfig = () => {
  const { scene, renderer } = store.sceneApi || {};
  let background = null;
  let environment =
    scene?.environment instanceof THREE.Texture
      ? ENVIRONMENT_TYPE.Environment
      : ENVIRONMENT_TYPE.NoEnvironment;

  if (scene?.background instanceof THREE.Texture) {
    background = BACKGROUND_TYPE.Texture;
  } else if (scene?.background instanceof THREE.Color) {
    background = BACKGROUND_TYPE.Color;
  } else {
    background = BACKGROUND_TYPE.NoBackground;
  }

  // 获取地面材质
  const planeGeometry = scene?.getObjectByName('customPlane') as THREE.Mesh;
  const planeGeometryKey = planeGeometry?.userData.planeGeometry as string;

  const sceneFog = scene?.fog;
  let fog = FOG_TYPE.None;
  let fogColor = FOG_COLOR_VALUE;
  let fogNear = FOG_NEAR_VALUE;
  let fogFar = FOG_FAR_VALUE;
  let fogDensity = FOG_DENSITY_VALUE;
  if (sceneFog instanceof THREE.Fog) {
    fog = FOG_TYPE.Fog;
    fogColor = new THREE.Color(sceneFog.color).getStyle();
    fogNear = sceneFog.near;
    fogFar = sceneFog.far;
  } else if (sceneFog instanceof THREE.FogExp2) {
    fog = FOG_TYPE.FogExp2;
    fogColor = new THREE.Color(sceneFog.color).getStyle();
    fogDensity = sceneFog.density;
  }
  return {
    background,
    backgroundColor: scene?.background,
    backgroundMap: scene?.background,
    backgroundTexture: scene?.background,
    backgroundBlurriness: scene?.backgroundBlurriness,
    backgroundIntensity: scene?.backgroundIntensity,
    environment,
    environmentMap: scene?.environment,
    environmentTexture: scene?.environment,
    toneMapping: renderer?.toneMapping,
    toneMappingExposure: renderer?.toneMappingExposure,
    shadowType: renderer?.shadowMap.type,
    planeGeometry: planeGeometryKey,
    fog,
    fogColor,
    fogNear,
    fogFar,
    fogDensity,
  };
};

/**
 * 更新地面
 * @param planeGeometry - 地面几何体
 */
export const updatePlaneGeometry = async (plane: PlaneGeometry) => {
  const { scene } = store.sceneApi || {};
  try {
    const planeGeometry = scene?.getObjectByName('customPlane') as THREE.Mesh;
    if (!planeGeometry) return;

    if (plane.key === 'none') {
      planeGeometry.visible = false;
      planeGeometry.updateMatrixWorld();
      return;
    }
    console.log(planeGeometry);
    planeGeometry.visible = true;
    const map = await new THREE.TextureLoader().loadAsync(plane.mapPath);
    map.repeat.set(1500, 1500);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 16;
    map.colorSpace = THREE.SRGBColorSpace;

    const normalMap = await new THREE.TextureLoader().loadAsync(
      plane.normalMapPath
    );

    planeGeometry.userData.planeGeometry = plane.key;
    const oldMaterial = planeGeometry.material;
    const newMaterial = (oldMaterial as unknown as THREE.Material).clone();
    (newMaterial as THREE.MeshPhysicalMaterial)['map'] = map;
    (newMaterial as THREE.MeshPhysicalMaterial)['normalMap'] = normalMap;

    planeGeometry.material = newMaterial;

    disposeMaterial(oldMaterial);
    map.dispose();
    normalMap.dispose();
  } finally {
    Promise.resolve();
  }
};

/**
 * 更新场景雾
 * @param fogInfo - 雾信息
 */
export const updateSceneFog = (
  fogInfo: Record<string, boolean | number | string>
) => {
  const { fog, fogColor, fogNear, fogFar, fogDensity } = fogInfo;
  if (fog === FOG_TYPE.None) {
    store.sceneApi!.scene!.fog = null;
  } else if (fog === FOG_TYPE.Fog) {
    store.sceneApi!.scene!.fog = new THREE.Fog(
      new THREE.Color(fogColor as string),
      fogNear as number,
      fogFar as number
    );
  } else if (fog === FOG_TYPE.FogExp2) {
    store.sceneApi!.scene!.fog = new THREE.FogExp2(
      new THREE.Color(fogColor as string),
      fogDensity as number
    );
  }
};

/**
 * 获取鼠标在3D场景中的位置
 * @param clientX - 鼠标X坐标
 * @param clientY - 鼠标Y坐标
 * @returns THREE.Vector3 | null - 返回3D坐标位置，如果未找到则返回null
 */
export const getMousePosition = (
  clientX: number,
  clientY: number
): THREE.Vector3 => {
  if (!store.sceneApi?.camera || !store.sceneApi?.container)
    return new THREE.Vector3();

  // 当 clientX 和 clientY 都为 0 时，计算相机前方的合适位置
  if (clientX === 0 && clientY === 0) {
    const camera = store.sceneApi.camera;
    // 获取相机的方向向量
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // 计算相机到目标点的距离（基于相机的视锥体）
    const distance =
      Math.abs(camera.position.y) * Math.tan((camera.fov * Math.PI) / 360);
    const targetDistance = Math.max(distance, 5); // 确保最小距离

    // 计算目标位置：相机位置 + 方向 * 距离
    const position = camera.position
      .clone()
      .add(direction.multiplyScalar(targetDistance));

    // 确保y坐标在合理范围内
    position.y = Math.max(0.5, position.y);
    return position;
  }

  // 原有的鼠标位置计算逻辑
  const { clientWidth, clientHeight, offsetLeft, offsetTop } =
    store.sceneApi?.container || {};

  const mouse = new THREE.Vector2();
  mouse.x = ((clientX - offsetLeft) / clientWidth) * 2 - 1;
  mouse.y = -((clientY - offsetTop) / clientHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, store.sceneApi?.camera);

  // 计算射线与 XY 平面的交点
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0)); // 修改为水平面
  const target = new THREE.Vector3();
  const intersected = raycaster.ray.intersectPlane(plane, target);

  if (!intersected) {
    // 如果没有交点，返回相机前方的位置
    const camera = store.sceneApi.camera;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const distance =
      Math.abs(camera.position.y) * Math.tan((camera.fov * Math.PI) / 360);
    return camera.position
      .clone()
      .add(direction.multiplyScalar(Math.max(distance, 5)));
  }

  // 限制最大距离，考虑相机位置
  const camera = store.sceneApi.camera;
  const maxDistance = Math.max(
    camera.position.length() * 2,
    50 // 最小限制距离
  );

  const distanceToCamera = target.distanceTo(camera.position);
  if (distanceToCamera > maxDistance) {
    // 如果距离太远，将位置拉近
    const direction = target.clone().sub(camera.position).normalize();
    target.copy(camera.position).add(direction.multiplyScalar(maxDistance));
  }

  // 确保y坐标在合理范围内
  target.y = Math.max(0.5, target.y);

  return target;
};

/**
 * 根据文件类型创建模型
 * @param result - 加载结果
 * @param fileType - 文件类型
 * @returns THREE.Object3D | null
 */
export const createModelFromResult = (
  result: unknown,
  fileType: MODEL_TYPE
): THREE.Object3D | null => {
  switch (fileType) {
    case MODEL_TYPE.GLB:
    case MODEL_TYPE.GLTF:
      return (result as GLTF).scene;
    case MODEL_TYPE.OBJ:
    case MODEL_TYPE.USDZ:
      return result as THREE.Group;
    case MODEL_TYPE.STL:
      if (result instanceof THREE.BufferGeometry) {
        const model = new THREE.Mesh(result, new THREE.MeshStandardMaterial());
        model.userData.isSTLModel = true;
        return model;
      }
      return null;
    default:
      return null;
  }
};

/**
 * 获取文件名
 * @param ext - 文件扩展名
 * @returns 文件名
 */
export const getFilename = (ext: string): string =>
  `${new Date().toLocaleString()}.${ext}`.replace(/[:]/g, '-');


/**
 * 设置模型位置和大小
 * @param model - 模型
 * @param mousePosition - 鼠标位置
 */
export const setModelPositionSize = (
  model: THREE.Object3D,
  mousePosition: THREE.Vector3
) => {
  const { controls, camera, container } = store.sceneApi || {};
  if (!model || !controls || !camera || !container) return;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  // 更新模型的世界矩阵
  model.position.set(mousePosition.x, mousePosition.y, mousePosition.z);
  model.updateMatrixWorld();

  model.userData = {
    ...model.userData,
    isTransformControls: true,
  };
  // 计算模型包围盒
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const scale = 1.2 / (maxSize > 1 ? maxSize : 0.5);

  camera?.updateProjectionMatrix();

  model.scale.set(scale, scale, scale);
};

/**
 * 导出模型
 * @param type - 导出类型
 * @param scene - 场景
 * @param options - 导出选项
 */
export const exportSceneModel = async (
  type: ExportType,
  scene: THREE.Scene
): Promise<void> => {
  try {
    const modelGroup = new THREE.Group();
    const animationList: THREE.AnimationClip[] = [];
    const newScene = cloneDeep(scene);
    const modelList =
      newScene?.children.filter(
        (obj) =>
          obj.userData.isTransformControls &&
          (obj instanceof THREE.Mesh || obj instanceof THREE.Group)
      ) || [];

    const processModel = (model: THREE.Object3D) => {
      // const clonedModel = cloneDeep(model);
      modelGroup.add(model);
      if (model.animations?.length) animationList.push(...model.animations);
    };

    if (modelList.length === 1) {
      const [oneModel] = modelList;
      processModel(oneModel);
      oneModel.position.set(0, 0, 0);
      oneModel.rotation.set(0, 0, 0);
      oneModel.scale.set(1, 1, 1);
      oneModel.updateMatrixWorld();
    } else {
      modelList.forEach(processModel);
    }
    // 如果导出usdz模型，则将所有双面材质改为单面材质
    if (type === MODEL_TYPE.USDZ) {
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.Material;
          if (material.side === THREE.DoubleSide) {
            material.side = THREE.FrontSide; // 改为单面材质
          }
        }
      });
    }
    const saveFile = (data: BlobPart, ext: string, mime: string) => {
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      document.body.appendChild(link);
      link.href = url;
      link.download = getFilename(ext);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    switch (type) {
      case MODEL_TYPE.GLTF:
      case MODEL_TYPE.GLB: {
        new GLTFExporter().parse(
          modelGroup,
          (result) => {
            if (result instanceof ArrayBuffer) {
              saveFile(result, 'glb', 'application/octet-stream');
            } else {
              saveFile(JSON.stringify(result), 'gltf', 'application/json');
            }
          },
          (err) => ElMessage.error(err),
          {
            animations: animationList,
            trs: true,
            binary: type === 'glb',
            includeCustomExtensions: true,
            embedImages: true,
          }
        );
        break;
      }

      case MODEL_TYPE.OBJ:
        saveFile(new OBJExporter().parse(modelGroup), 'obj', 'text/plain');
        break;

      case MODEL_TYPE.STL:
        saveFile(
          new STLExporter().parse(modelGroup, { binary: true }) as unknown as BlobPart,
          'stl',
          'application/octet-stream'
        );
        break;

      case MODEL_TYPE.USDZ:
        new USDZExporter().parse(
          modelGroup,
          (usdz) => saveFile(usdz as unknown as BlobPart, 'usdz', 'model/vnd.usdz+zip'),
          (err) => ElMessage.error(err as string)
        );
        break;

      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
    disposeScene(newScene);
  } catch (error) {
    console.error('Export failed:', error);
    ElMessage.error('导出失败');
    throw error;
  }
};
