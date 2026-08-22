import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';
import { LIGHT_TYPE } from '@/enums/enum';

const store = useSceneStore();

/**
 * @description light module
 */
class LightModules {
  // light map
  lightMap: Map<string, THREE.Light>;
  constructor() {
    this.lightMap = new Map();
  }
  /**
   * @description init lights
   */
  initLight() {
    if (!store.sceneApi?.scene) return;
    store.sceneApi.scene.traverse((child) => {
      if (child instanceof THREE.Light) {
        this.lightMap.set(child.uuid, child as THREE.Light);
        const oldHelper = store.sceneApi?.scene?.getObjectByProperty(
          'uuid',
          child?.userData.helperUuid
        );
        if (oldHelper) {
          store.sceneApi?.scene?.remove(oldHelper);
        }
        let helper: THREE.Object3D | null = null;

        // fromlight typescreate the matching helper
        if (child instanceof THREE.DirectionalLight) {
          helper = new THREE.DirectionalLightHelper(child, 0.5);
        } else if (child instanceof THREE.SpotLight) {
          helper = new THREE.SpotLightHelper(child);
        } else if (child instanceof THREE.PointLight) {
          helper = new THREE.PointLightHelper(child, 0.5);
        } else if (child instanceof THREE.HemisphereLight) {
          helper = new THREE.HemisphereLightHelper(child, 0.5);
        }
        if (helper) {
          helper.visible = child.userData?.helperVisible === true;
          helper.userData.isHelper = true;
          helper.userData.lightHelper = true;
          store.sceneApi?.scene?.add(helper);
          child.userData.helperUuid = helper.uuid;
        }
      }
    });
  }
  /**
   * @description create light
   * @param type - light type
   * @param position - light position
   */
  createLight(type: LIGHT_TYPE, position: THREE.Vector3): THREE.Light | null {
    if (!store.sceneApi?.scene) return null;
    let light;
    let helper: THREE.Object3D | null = null;

    const targetPosition = position.clone();
    targetPosition.y = 0;

    switch (type) {
      case LIGHT_TYPE.DirectionalLight:
        light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.copy(position);
        // aim the light target straight down
        light.target.position.copy(targetPosition);
        store.sceneApi.scene.add(light.target);
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.bias = -0.0004;
        light.shadow.normalBias = 0.04;
        {
          const sc = light.shadow.camera as THREE.OrthographicCamera;
          sc.left = -42;
          sc.right = 42;
          sc.top = 42;
          sc.bottom = -42;
          sc.near = 1;
          sc.far = 180;
          sc.updateProjectionMatrix();
        }
        helper = new THREE.DirectionalLightHelper(light, 0.5);
        break;

      case LIGHT_TYPE.SpotLight:
        light = new THREE.SpotLight(0xffffff, 900);
        light.decay = 2;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 10;
        light.angle = 0.5;
        light.distance = 12;
        light.position.copy(position);
        // aim the light target straight down
        light.target.position.copy(targetPosition);
        store.sceneApi.scene.add(light.target);
        helper = new THREE.SpotLightHelper(light);
        break;

      case LIGHT_TYPE.PointLight:
        light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.copy(position);
        helper = new THREE.PointLightHelper(light, 0.5);
        break;

      case LIGHT_TYPE.AmbientLight:
        light = new THREE.AmbientLight(0xffffff, 1);
        light.position.copy(position);
        break;

      case LIGHT_TYPE.HemisphereLight:
        light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        light.position.copy(position);
        // Hemisphere lightpoint straight down
        light.lookAt(targetPosition);
        helper = new THREE.HemisphereLightHelper(light, 0.5);
        break;

      default:
        return null;
    }

    light.name = type;
    light.userData = {
      helperUuid: helper?.uuid,
      helperVisible: false,
      isTransformControls: true,
    };

    // add toScene
    store.sceneApi.scene.add(light);
    store.setCurrentTransformMaterialUuid(light.uuid);

    if (helper) {
      helper.userData = {
        lightHelper: true,
        isHelper: true,
      };
      helper.visible = false;
      store.sceneApi.scene.add(helper);
      this.updateHelper();
    }

    // keep light + helper
    this.lightMap.set(light.uuid, light);

    // attach transform controls
    if (store.sceneApi?.transformControlsModules.transformControls) {
      store.sceneApi.transformControlsModules.transformControls.attach(light);
    }

    return light;
  }
  /**
   * @description update helper
   * @param uuid - lightUUID
   */
  updateHelper(uuid?: string) {
    const light = this.lightMap.get(
      uuid || store.currentTransformMaterialUuid || ''
    );
    const helper = store.sceneApi?.scene?.getObjectByProperty(
      'uuid',
      light?.userData.helperUuid
    );
    if (!light || !helper) return;
    // update helper
    if (
      helper instanceof THREE.DirectionalLightHelper ||
      helper instanceof THREE.SpotLightHelper ||
      helper instanceof THREE.HemisphereLightHelper ||
      helper instanceof THREE.PointLightHelper
    ) {
      helper.update();
    }
  }
}

export default LightModules;
