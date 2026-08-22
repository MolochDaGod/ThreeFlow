import { Command } from './command';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';
import { disposeMaterial } from '../utils';

const store = useSceneStore();

export class ModelCommand extends Command {
  private object: THREE.Object3D;
  private isAdd: boolean;
  private parentObject: THREE.Object3D | null;
  private originalPosition: THREE.Vector3;
  private helperUuid: string | null;

  constructor(object: THREE.Object3D, isAdd: boolean = true) {
    super('ModelOperation');
    this.object = object;
    this.isAdd = isAdd;
    this.parentObject = object.parent;
    this.originalPosition = object.position.clone();
    this.helperUuid = object.userData.helperUuid as string | null;
    this.updatable = false;
  }

  private removeFromScene(): void {
    // 1. handle light helper
    if (this.object instanceof THREE.Light && this.helperUuid) {
      const helper = store.sceneApi?.scene?.getObjectByProperty(
        'uuid',
        this.helperUuid
      );
      if (helper) {
        helper.clear();
        store.sceneApi?.scene?.remove(helper);
      }
    }

    // 2. dispose material
    if (this.object instanceof THREE.Mesh) {
      disposeMaterial(this.object);
    } else {
      // if a group, walk childMaterial
      this.object.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          disposeMaterial(child);
        }
      });
    }

    // 3. remove object from scene
    if (this.object.parent) {
      this.object.parent.remove(this.object);
    }

    // 4. clear transform controls and box helper
    store.sceneApi?.transformControlsModules?.clearCurrentSelection();
    if (store.sceneApi?.boxHelper) {
      store.sceneApi.boxHelper.visible = false;
    }
  }

  private addToScene(): void {
    if (!this.object.parent && store.sceneApi?.scene) {
      store.sceneApi.scene.add(this.object);
      this.object.position.copy(this.originalPosition);
      // if a light, recreate its helper
      if (this.object instanceof THREE.Light && this.helperUuid) {
        store.sceneApi.lightModules.updateHelper();
      }
    }
  }

  execute(): void {
    if (this.isAdd) {
      this.addToScene();
    } else {
      this.removeFromScene();
    }
  }

  undo(): void {
    if (this.isAdd) {
      this.removeFromScene();
    } else {
      this.addToScene();
    }
  }
}
