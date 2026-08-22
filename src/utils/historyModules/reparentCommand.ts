import { Command } from './command';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';

export class ReparentCommand extends Command {
  private object: THREE.Object3D;
  private oldParent: THREE.Object3D | null;
  private newParent: THREE.Object3D;
  private oldIndex: number;
  private newIndex: number;

  constructor(object: THREE.Object3D, newParent: THREE.Object3D, newIndex = -1) {
    super('Reparent');
    this.object = object;
    this.oldParent = object.parent;
    this.newParent = newParent;
    this.oldIndex = object.parent ? object.parent.children.indexOf(object) : -1;
    this.newIndex = newIndex;
    this.updatable = false;
  }

  execute(): void {
    this.newParent.attach(this.object);
    if (this.newIndex >= 0) this.moveTo(this.newParent, this.newIndex);
    useSceneStore().setTransformMaterialRandomId();
  }

  undo(): void {
    if (!this.oldParent) return;
    this.oldParent.attach(this.object);
    if (this.oldIndex >= 0) this.moveTo(this.oldParent, this.oldIndex);
    useSceneStore().setTransformMaterialRandomId();
  }

  private moveTo(parent: THREE.Object3D, index: number) {
    const list = parent.children;
    const i = list.indexOf(this.object);
    if (i < 0) return;
    list.splice(i, 1);
    list.splice(Math.min(index, list.length), 0, this.object);
  }
}
