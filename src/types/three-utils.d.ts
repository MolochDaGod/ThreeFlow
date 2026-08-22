declare module 'three/examples/jsm/utils/SkeletonUtils.js' {
  import { Object3D } from 'three';
  export function clone<T extends Object3D>(source: T): T;
}

declare module 'three/addons/libs/meshopt_decoder.module.js' {
  export const MeshoptDecoder: never;
}
