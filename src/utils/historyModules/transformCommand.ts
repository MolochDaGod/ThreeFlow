import { Command } from './command';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';

const store = useSceneStore();

export class TransformCommand extends Command {
  private object: THREE.Object3D;
  private oldPosition: THREE.Vector3;
  private oldRotation: THREE.Euler;
  private oldScale: THREE.Vector3;
  private newPosition: THREE.Vector3;
  private newRotation: THREE.Euler;
  private newScale: THREE.Vector3;
  private originalTargetPosition: THREE.Vector3 | null;

  constructor(
    object: THREE.Object3D,
    newPosition: THREE.Vector3,
    newRotation: THREE.Euler,
    newScale: THREE.Vector3
  ) {
    super('Transform Object');
    this.updatable = true;
    this.object = object;
    this.oldPosition = object.position.clone();
    this.oldRotation = object.rotation.clone();
    this.oldScale = object.scale.clone();
    this.newPosition = newPosition.clone();
    this.newRotation = newRotation.clone();
    this.newScale = newScale.clone();

    // 如果是定向光或Spot light，保存初始目标位置
    if (
      object instanceof THREE.DirectionalLight ||
      object instanceof THREE.SpotLight
    ) {
      this.originalTargetPosition = object.target.position.clone();
    } else {
      this.originalTargetPosition = null;
    }
  }
/**
 * 执行变换操作
 */
  execute() {
    this.object.position.copy(this.newPosition);
    this.object.rotation.copy(this.newRotation);
    this.object.scale.copy(this.newScale);
    this.object.updateMatrix();

    // 如果是光源，保持目标位置不变
    if (
      (this.object instanceof THREE.DirectionalLight ||
        this.object instanceof THREE.SpotLight) &&
      this.originalTargetPosition
    ) {
      this.object.target.position.copy(this.originalTargetPosition);
      this.object.target.updateMatrixWorld();
      store.sceneApi?.lightModules.updateHelper(this.object.uuid);
    }
  }

  /**
   * Undo变换操作
   */
  undo() {
    this.object.position.copy(this.oldPosition);
    this.object.rotation.copy(this.oldRotation);
    this.object.scale.copy(this.oldScale);
    this.object.updateMatrix();

    // 如果是光源，保持目标位置不变
    if (
      (this.object instanceof THREE.DirectionalLight ||
        this.object instanceof THREE.SpotLight) &&
      this.originalTargetPosition
    ) {
      this.object.target.position.copy(this.originalTargetPosition);
      this.object.target.updateMatrixWorld();
      store.sceneApi?.lightModules.updateHelper(this.object.uuid);
    }
  }


  update(command: TransformCommand) {
    this.newPosition.copy(command.newPosition);
    this.newRotation.copy(command.newRotation);
    this.newScale.copy(command.newScale);
  }
}
