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
} from '@/config/constant';
import { normalizeShadowType } from '@/config/propertyConfig';
import { cloneDeep } from 'lodash-es';
import { placeAssetSi, type PlaceKind } from '@/utils/siPlace';

const store = useSceneStore();

/**
 * @description getSceneconfig
 * @returns Sceneconfig
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

  // get groundMaterial
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
    shadowType: normalizeShadowType(renderer?.shadowMap.type),
    planeGeometry: planeGeometryKey,
    fog,
    fogColor,
    fogNear,
    fogFar,
    fogDensity,
  };
};

/**
 * update ground
 * @description update ground
 * @param planeGeometry - groundGeometry
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
 * update scene fog
 * @description update scene fog
 * @param fogInfo - fog info
 */
export const updateSceneFog = (fogInfo: Record<string, number | string>) => {
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
  if (store.sceneApi?.scene) {
    store.sceneApi.scene.userData.fogEnabled = fog !== FOG_TYPE.None;
  }
};

export function toggleSceneFog(on?: boolean): boolean {
  const scene = store.sceneApi?.scene;
  if (!scene) return false;
  const want = on ?? !scene.fog;
  if (!want) {
    if (scene.fog) scene.userData.savedFog = scene.fog;
    scene.fog = null;
    scene.userData.fogEnabled = false;
    store.setTransformMaterialRandomId();
    return false;
  }
  const kept = scene.userData.savedFog as THREE.Fog | THREE.FogExp2 | undefined;
  scene.fog = kept || new THREE.FogExp2(FOG_COLOR_VALUE, FOG_DENSITY_VALUE);
  scene.userData.fogEnabled = true;
  store.setTransformMaterialRandomId();
  return true;
}

export function sceneFogOn(): boolean {
  return Boolean(store.sceneApi?.scene?.fog);
}

/**
 * mouse position in3DSceneposition
 * @description mouse position in3DSceneposition
 * @param clientX - mouseXcoords
 * @param clientY - mouseYcoords
 * @returns THREE.Vector3 | null - return3Dworld position, or null if nonenull
 */
export const getMousePosition = (
  clientX: number,
  clientY: number
): THREE.Vector3 => {
  if (!store.sceneApi?.camera || !store.sceneApi?.container)
    return new THREE.Vector3();

  // when clientX and clientY are both 0, use a point in front of the camera
  if (clientX === 0 && clientY === 0) {
    const camera = store.sceneApi.camera;
    // camera forward
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // distance from camera to target (frustum)
    const distance =
      Math.abs(camera.position.y) * Math.tan((camera.fov * Math.PI) / 360);
    const targetDistance = Math.max(distance, 5); // enforce min distance

    // target = camera position + direction * distance
    const position = camera.position
      .clone()
      .add(direction.multiplyScalar(targetDistance));

    // ensureyaxis stays in range
    position.y = Math.max(0.5, position.y);
    return position;
  }

  // original mouse-to-world path
  const { clientWidth, clientHeight, offsetLeft, offsetTop } =
    store.sceneApi?.container || {};

  const mouse = new THREE.Vector2();
  mouse.x = ((clientX - offsetLeft) / clientWidth) * 2 - 1;
  mouse.y = -((clientY - offsetTop) / clientHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, store.sceneApi?.camera);

  // intersect the ray with XY Planeintersection
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0)); // use a waterPlane
  const target = new THREE.Vector3();
  const intersected = raycaster.ray.intersectPlane(plane, target);

  if (!intersected) {
    // if no hit, use a point in front of the camera
    const camera = store.sceneApi.camera;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const distance =
      Math.abs(camera.position.y) * Math.tan((camera.fov * Math.PI) / 360);
    return camera.position
      .clone()
      .add(direction.multiplyScalar(Math.max(distance, 5)));
  }

  // clamp max distance vs camera
  const camera = store.sceneApi.camera;
  const maxDistance = Math.max(
    camera.position.length() * 2,
    50 // min clamp distance
  );

  const distanceToCamera = target.distanceTo(camera.position);
  if (distanceToCamera > maxDistance) {
    // if too far, pull the point closer
    const direction = target.clone().sub(camera.position).normalize();
    target.copy(camera.position).add(direction.multiplyScalar(maxDistance));
  }

  // ensureyaxis stays in range
  target.y = Math.max(0.5, target.y);

  return target;
};

/**
 * create from file typeModels
 * @description create from file typeModels
 * @param result - load result
 * @param fileType - file type
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
 * file name
 * @description file name
 * @param ext - file extension
 * @returns file name
 */
export const getFilename = (ext: string): string =>
  `${new Date().toLocaleString()}.${ext}`.replace(/[:]/g, '-');

/** Export any hierarchy node (mesh/group) as GLB — not only TransformControls roots. */
export const exportObjectToGlbBlob = (
  object: THREE.Object3D,
  filenameBase = 'mesh'
): Promise<{ blob: Blob; filename: string }> =>
  new Promise((resolve, reject) => {
    const wrap = new THREE.Group();
    wrap.name = object.name || filenameBase;
    const cloned = object.clone(true);
    wrap.add(cloned);
    new GLTFExporter().parse(
      wrap,
      (result) => {
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error('GLTFExporter returned JSON'));
          return;
        }
        const blob = new Blob([result], { type: 'application/octet-stream' });
        const filename = `${filenameBase.replace(/\.[^.]+$/, '')}.glb`;
        resolve({ blob, filename });
      },
      (err) => reject(err),
      { binary: true, embedImages: true, trs: true, includeCustomExtensions: true }
    );
  });

/**
 * setModelsposition and size
 * @description setModelsposition and size
 * @param model - Models
 * @param mousePosition - mouse position
 */
export const setModelPositionSize = (
  model: THREE.Object3D,
  mousePosition: THREE.Vector3,
  kind?: PlaceKind
) => {
  const { controls, camera, container } = store.sceneApi || {};
  if (!model || !controls || !camera || !container) return;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  model.userData = {
    ...model.userData,
    isTransformControls: true,
  };
  const report = placeAssetSi(model, kind || 'import', mousePosition);
  model.userData.siPlace = report;
  camera?.updateProjectionMatrix();
};

/**
 * export model
 * @description export model
 * @param type - export types
 * @param scene - Scene
 * @param options - export options
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
    // if exporting USDZ, force double-sided materials to front-side only
    if (type === MODEL_TYPE.USDZ) {
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.Material;
          if (material.side === THREE.DoubleSide) {
            material.side = THREE.FrontSide; // front-side onlyMaterial
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
          new STLExporter().parse(modelGroup, {
            binary: true,
          }) as unknown as BlobPart,
          'stl',
          'application/octet-stream'
        );
        break;

      case MODEL_TYPE.USDZ:
        new USDZExporter().parse(
          modelGroup,
          (usdz) =>
            saveFile(usdz as unknown as BlobPart, 'usdz', 'model/vnd.usdz+zip'),
          (err) => ElMessage.error(err as string)
        );
        break;

      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
    disposeScene(newScene);
  } catch (error) {
    console.error('Export failed:', error);
    ElMessage.error('Export failed');
    throw error;
  }
};
