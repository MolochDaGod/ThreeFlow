/**
 * Boot the VFX lab scene after the editor renderer is ready.
 * HDR / Draco / loadRaceKit already live on renderScene.init + loadModel.
 */
import type renderScene from '@/utils/renderScene';
import { MODEL_TYPE } from '@/enums/enum';
import { vfxLabCaptainItem } from '@/config/vfxLab';

export async function bootVfxLabScene(api: renderScene): Promise<void> {
  const el = document.getElementById('scene-render');
  const rect = el?.getBoundingClientRect();
  const cx = (rect?.left ?? 0) + (rect?.width ?? 800) / 2;
  const cy = (rect?.top ?? 0) + (rect?.height ?? 600) / 2;
  const captain = vfxLabCaptainItem();

  if (api.scene) {
    api.scene.userData.vfxLab = true;
    api.scene.name = 'VFX Lab';
  }

  await api.loadModel(
    captain.filePath,
    MODEL_TYPE.GLB,
    cx,
    cy,
    captain.name,
    { group: 'captains' }
  );

  if (api.camera) {
    api.camera.position.set(3.2, 2.4, 5.4);
    api.camera.lookAt(0, 1.0, 0);
  }
  if (api.controls) {
    api.controls.target.set(0, 1.0, 0);
    api.controls.update();
  }
}
