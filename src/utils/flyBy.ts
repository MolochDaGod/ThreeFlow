/**
 * Editor fly-by — CatmullRom rail on the existing Orbit camera.
 * Does not write camera during play-as TPS.
 */
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let flyTween: TWEEN.Tween<{ u: number }> | null = null;

export function stopFlyBy(controls?: OrbitControls | null) {
  if (flyTween) {
    flyTween.stop();
    flyTween = null;
  }
  if (controls) {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
  }
}

export function startFlyBy(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  scene: THREE.Scene,
  playing: boolean
): string {
  if (playing) return 'Fly-by blocked — play-as owns the camera';
  stopFlyBy(controls);
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return 'Empty scene';
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.z, 80) * 0.62;
  const y = Math.max(c.y + size.y * 0.35, 28);
  const pts = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 4) * Math.PI * 2;
    return new THREE.Vector3(
      c.x + Math.cos(a) * r,
      y + Math.sin(i) * 6,
      c.z + Math.sin(a) * r
    );
  });
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.3);
  const hold = { u: 0 };
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  flyTween = new TWEEN.Tween(hold)
    .to({ u: 1 }, 14000)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate(() => {
      const p = curve.getPoint(hold.u);
      camera.position.copy(p);
      controls.target.copy(c);
      camera.lookAt(c);
    })
    .onComplete(() => {
      flyTween = null;
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
    })
    .start();
  return 'Fly-by 14s around scene bounds';
}
