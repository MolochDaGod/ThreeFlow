/**
 * Keep one named child from a multi-mesh pack. Whole-pack place is banned.
 */
import * as THREE from 'three';

export function isolateNamedMesh(
  root: THREE.Object3D,
  meshName?: string | null
): THREE.Object3D {
  const want = String(meshName || '').trim();
  if (!want) return root;
  const hit = root.getObjectByName(want);
  if (!hit || hit === root) return root;
  const wrap = new THREE.Group();
  wrap.name = want;
  wrap.userData = { ...root.userData, meshName: want, isolatedFrom: root.name };
  wrap.add(hit);
  return wrap;
}
