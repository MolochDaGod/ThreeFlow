import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { DS2_SOURCE } from './ds2Terrain';
import {
  buildHdDeployManifest,
  type HdDeployTarget,
} from '@/config/hdTerrainDeploy';

export function collectHdTerrainRoots(scene: THREE.Scene): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    if (obj.userData?.ds2Preset && obj.parent === scene) out.push(obj);
  });
  if (!out.length) {
    scene.traverse((obj) => {
      if (obj.userData?.ds2Preset) out.push(obj);
    });
  }
  return out;
}

function downloadBlob(data: BlobPart, name: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportHdTerrainPack(
  roots: THREE.Object3D[],
  target: HdDeployTarget
): Promise<{ rawName: string; jsonName: string }> {
  if (!roots.length) throw new Error('No HD terrain in the scene');
  const group = new THREE.Group();
  const first = roots[0];
  const clone = first.clone(true);
  clone.position.set(0, 0, 0);
  clone.updateMatrixWorld(true);
  group.add(clone);

  const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
    new GLTFExporter().parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error('Expected binary GLB'));
      },
      (err) => reject(err),
      {
        binary: true,
        trs: true,
        embedImages: true,
        includeCustomExtensions: true,
      }
    );
  });

  const ud = first.userData || {};
  const rawName = `hd-${target.id}.raw.glb`;
  const jsonName = `hd-${target.id}.deploy.json`;
  const manifest = buildHdDeployManifest({
    target,
    preset: String(ud.ds2Preset || 'mountains'),
    quality: String(ud.ds2Quality || 'edit'),
    worldMeters: Number(ud.worldMeters || 400),
    mesh: Number(ud.mesh || 256),
    sim: Number(ud.sim || 192),
    source: String(ud.hardroad || DS2_SOURCE),
    rawFile: rawName,
  });

  downloadBlob(glb, rawName, 'model/gltf-binary');
  downloadBlob(JSON.stringify(manifest, null, 2), jsonName, 'application/json');
  return { rawName, jsonName };
}
