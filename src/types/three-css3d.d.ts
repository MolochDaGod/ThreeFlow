import * as THREE from 'three';

declare module 'three/examples/jsm/renderers/CSS3DRenderer' {
  export class CSS3DRenderer {
    constructor(parameters?: { element?: HTMLElement });
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
    render(scene: THREE.Scene, camera: THREE.Camera): void;
  }

  export class CSS3DObject extends THREE.Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
  }
}
