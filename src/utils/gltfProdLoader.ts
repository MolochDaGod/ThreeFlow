/**
 * Fleet production GLTF loader — one factory for editor drops, race kits, camps.
 * r185 DRACOLoader already hashes decoder WASM via import.meta.url — do not also
 * ship public/draco (that doubled the payload). KTX2 is lazy: most CDN kits are Draco+WebP.
 */
import type { WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

let _loader: GLTFLoader | null = null;
let _draco: DRACOLoader | null = null;
let _ktx2Bound = false;
let _ktx2Pending: Promise<void> | null = null;

export function getProductionGltfLoader(): GLTFLoader {
  if (!_loader) {
    _draco = new DRACOLoader();
    _loader = new GLTFLoader();
    _loader.setDRACOLoader(_draco);
    _loader.setMeshoptDecoder(MeshoptDecoder as never);
  }
  return _loader;
}

/** Attach KTX2 only when a renderer exists — keeps Basis WASM out of first paint. */
export function bindProductionKtx2(
  renderer: WebGLRenderer | null | undefined
): Promise<void> {
  if (!renderer || _ktx2Bound) return Promise.resolve();
  if (_ktx2Pending) return _ktx2Pending;
  const loader = getProductionGltfLoader();
  _ktx2Pending = import('three/addons/loaders/KTX2Loader.js')
    .then(({ KTX2Loader }) => {
      const ktx2 = new KTX2Loader();
      ktx2.detectSupport(renderer);
      loader.setKTX2Loader(ktx2);
      _ktx2Bound = true;
    })
    .catch((err) => {
      console.warn('KTX2 transcoder skipped', err);
    })
    .finally(() => {
      _ktx2Pending = null;
    });
  return _ktx2Pending;
}

export function disposeProductionGltfLoader() {
  _draco?.dispose();
  _loader = null;
  _draco = null;
  _ktx2Bound = false;
  _ktx2Pending = null;
}
