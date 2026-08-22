/**
 * One sun, one fill. Extra Directional / Hemisphere helpers look like a second sun.
 */
import * as THREE from 'three';

export function dedupeSceneLights(scene: THREE.Scene) {
  const dirs: THREE.DirectionalLight[] = [];
  const hemis: THREE.HemisphereLight[] = [];
  const ambs: THREE.AmbientLight[] = [];
  const helpers: THREE.Object3D[] = [];
  const skies: THREE.Object3D[] = [];

  scene.traverse((o) => {
    const d = o as THREE.DirectionalLight;
    if (d.isDirectionalLight) dirs.push(d);
    const h = o as THREE.HemisphereLight;
    if (h.isHemisphereLight) hemis.push(h);
    const a = o as THREE.AmbientLight;
    if (a.isAmbientLight) ambs.push(a);
    if (
      o instanceof THREE.DirectionalLightHelper ||
      o instanceof THREE.HemisphereLightHelper ||
      o instanceof THREE.SpotLightHelper ||
      o instanceof THREE.PointLightHelper ||
      o.userData?.lightHelper
    ) {
      helpers.push(o);
    }
    if (o.name === 'worldSkyDome') skies.push(o);
  });

  const sun = dirs[0] || null;
  for (const extra of dirs.slice(1)) {
    extra.parent?.remove(extra);
    extra.target?.parent?.remove(extra.target);
  }
  for (const extra of hemis.slice(1)) extra.parent?.remove(extra);
  if (hemis.length) {
    for (const extra of ambs) extra.parent?.remove(extra);
  } else {
    for (const extra of ambs.slice(1)) extra.parent?.remove(extra);
  }
  for (const helper of helpers) {
    helper.visible = false;
    helper.userData.isHelper = true;
  }
  for (const extra of skies.slice(1)) extra.parent?.remove(extra);

  const sky = skies[0] as THREE.Mesh | undefined;
  const mat = sky?.material as THREE.ShaderMaterial | undefined;
  if (sun && mat?.uniforms?.uSunDir) {
    const dir = sun.position.clone().normalize();
    mat.uniforms.uSunDir.value.copy(dir);
  }
}
