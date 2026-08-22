/**
 * Canvas-aware 2D image loader — CDN fetch + ImageBitmap + SI plane.
 * Extends assetApi / siPlace. Not a second texture stack.
 * 256 px = 1 m on scene sprites. HUD stays 1920×1080 design in HudOverlay.
 */
import * as THREE from 'three';
import { assetUrl, fetchCdnBlob, isRasterImage } from '@/config/assetApi';
import { stampContentLayer } from './contentLayers';

export const IMAGE_PX_PER_M = 256;
export const HUD_DESIGN_W = 1920;
export const HUD_DESIGN_H = 1080;

export type LoadedImage = {
  url: string;
  bitmap: ImageBitmap;
  texture: THREE.Texture;
  pxW: number;
  pxH: number;
  metersW: number;
  metersH: number;
};

export function hudDesignScale(
  vw = window.innerWidth,
  vh = window.innerHeight
) {
  return Math.min(vw / HUD_DESIGN_W, vh / HUD_DESIGN_H);
}

/** Visible 3D stage (not the full window / right inspector). */
export function measureHudHost(host: HTMLElement | null, leftGutterPx = 0) {
  const w = Math.max(1, (host?.clientWidth ?? window.innerWidth) - leftGutterPx);
  const h = Math.max(1, host?.clientHeight ?? window.innerHeight);
  const scale = Math.min(w / HUD_DESIGN_W, h / HUD_DESIGN_H);
  return { scale, w, h, leftGutterPx };
}

/** Screen click → 1920×1080 design coords inside the scaled HUD. */
export function clientToHudDesign(
  clientX: number,
  clientY: number,
  host: HTMLElement,
  scale: number,
  leftGutterPx = 0
): { x: number; y: number } {
  const r = host.getBoundingClientRect();
  const availW = r.width - leftGutterPx;
  const availH = r.height;
  const drawnW = HUD_DESIGN_W * scale;
  const drawnH = HUD_DESIGN_H * scale;
  const ox = r.left + leftGutterPx + (availW - drawnW) / 2;
  const oy = r.top + (availH - drawnH) / 2;
  return {
    x: (clientX - ox) / scale,
    y: (clientY - oy) / scale,
  };
}

export function pxToMeters(px: number, pxPerM = IMAGE_PX_PER_M) {
  return px / pxPerM;
}

export async function loadCdnImage(keyOrUrl: string): Promise<LoadedImage> {
  const url = assetUrl(keyOrUrl);
  if (!url) throw new Error('empty image url');
  let bitmap: ImageBitmap;
  try {
    const blob = await fetchCdnBlob(url);
    bitmap = await createImageBitmap(blob);
  } catch {
    bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => createImageBitmap(img).then(resolve, reject);
      img.onerror = () => reject(new Error(`image load failed: ${url}`));
      img.src = url;
    });
  }
  const texture = new THREE.Texture(bitmap);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.flipY = true;
  const pxW = bitmap.width;
  const pxH = bitmap.height;
  const metersH = pxToMeters(pxH);
  const metersW = pxToMeters(pxW);
  return { url, bitmap, texture, pxW, pxH, metersW, metersH };
}

export function meshFromImage(
  img: LoadedImage,
  targetHeightM?: number
): THREE.Mesh {
  const h =
    targetHeightM && targetHeightM > 0.05
      ? targetHeightM
      : Math.min(img.metersH, 2);
  const w = h * (img.pxW / Math.max(img.pxH, 1));
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: img.texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  mesh.name = img.url.split('/').pop() || 'image';
  mesh.userData.image2d = true;
  mesh.userData.canvasPx = { w: img.pxW, h: img.pxH };
  mesh.userData.siHeightM = h;
  mesh.userData.r2Key = img.url;
  mesh.userData.physBody = 'fixed';
  stampContentLayer(mesh, 'weather', { siHeightM: h });
  return mesh;
}

export function isImageAsset(path: string, fileType?: string) {
  return isRasterImage(path, fileType);
}
