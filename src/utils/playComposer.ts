/**
 * Play-mode post stack — pmndrs/postprocessing on the existing renderer.
 * Editor stays raw render + view gizmo. Play gets bloom + SMAA.
 */
import type { Camera, Scene, WebGLRenderer } from 'three';
import { toRaw } from 'vue';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
} from 'postprocessing';

let composer: EffectComposer | null = null;

export function mountPlayComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera
): void {
  disposePlayComposer();
  const gl = toRaw(renderer);
  const scn = toRaw(scene);
  const cam = toRaw(camera);
  composer = new EffectComposer(gl, { multisampling: 0 });
  composer.addPass(new RenderPass(scn, cam));
  composer.addPass(
    new EffectPass(
      cam,
      new BloomEffect({
        intensity: 0.38,
        luminanceThreshold: 0.72,
        luminanceSmoothing: 0.2,
      }),
      new SMAAEffect()
    )
  );
  const el = renderer.domElement;
  composer.setSize(el.clientWidth, el.clientHeight);
}

export function resizePlayComposer(w: number, h: number) {
  composer?.setSize(w, h);
}

export function renderPlayComposer(dt: number): boolean {
  if (!composer) return false;
  composer.render(dt);
  return true;
}

export function disposePlayComposer() {
  composer?.dispose();
  composer = null;
}
