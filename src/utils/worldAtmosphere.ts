/**
 * World water / waves / waterfall / mist / cloud — existing layers only.
 * Water look = stylized-components WaterFloor (Voronoi cel). L0 seabed = DS2 tiles.
 * Water = PHYS Water · Swim sensor. FX = weather · IgnoreRaycast.
 * Not a second weather engine. Not Next/R3F.
 */
import * as THREE from 'three';
import { stampContentLayer } from './contentLayers';
import { WORLD_STACK } from '@/config/fleetSystems';
import { seafloorCoverM } from './sceneModules/seafloorGrid';
import {
  createSeabedOverlayMesh,
  createWaterFloorMesh,
  createWaterSparkles,
  createWeldBandMesh,
  tickPlayWaterRipples,
  tickWaterFloorMaterial,
  tickWaterSparkles,
} from './waterFloor';

const ROOT = '__worldAtmosphere';

type Atmos = {
  root: THREE.Group;
  water?: THREE.Mesh;
  weld?: THREE.Mesh;
  seabed?: THREE.Mesh;
  sparkles?: THREE.Points;
  sky?: THREE.Mesh;
  falls: THREE.Mesh[];
  clouds: THREE.Mesh[];
  mist: THREE.Points;
};

let handle: Atmos | null = null;

const SKY_VERT = /* glsl */ `
 varying vec3 vDir;
 void main() {
 vec4 wp = modelMatrix * vec4(position, 1.0);
 vDir = normalize(position);
 gl_Position = projectionMatrix * viewMatrix * wp;
 }
`;

const SKY_FRAG = /* glsl */ `
 uniform vec3 uZenith;
 uniform vec3 uHorizon;
 uniform vec3 uSunDir;
 uniform vec3 uSunColor;
 varying vec3 vDir;
 void main() {
 vec3 d = normalize(vDir);
 float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
 vec3 col = mix(uHorizon, uZenith, pow(h, 0.85));
 float sun = pow(max(dot(d, normalize(uSunDir)), 0.0), 48.0);
 col += uSunColor * sun * 0.85;
 gl_FragColor = vec4(col, 1.0);
 }
`;

function createSkyDome(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: {
        uZenith: { value: new THREE.Color('#87b8e0') },
        uHorizon: { value: new THREE.Color('#d7e6f2') },
        uSunDir: { value: new THREE.Vector3(0.35, 0.75, 0.2).normalize() },
        uSunColor: { value: new THREE.Color('#fff4d2') },
      },
    })
  );
  mesh.name = 'worldSkyDome';
  mesh.frustumCulled = false;
  mesh.renderOrder = -2;
  mesh.userData.isTransformControls = true;
  mesh.userData.followCamXZ = true;
  stampContentLayer(mesh, 'weather', { siHeightM: 900 });
  mesh.userData.physLayer = 'IgnoreRaycast';
  return mesh;
}

export function applySkyMood(mood: 'spring' | 'autumn') {
  if (!handle?.sky) return;
  const mat = handle.sky.material as THREE.ShaderMaterial;
  if (mood === 'autumn') {
    mat.uniforms.uZenith.value.set('#c48a5a');
    mat.uniforms.uHorizon.value.set('#f0c98a');
    mat.uniforms.uSunColor.value.set('#ffd089');
    if (handle.root.parent && (handle.root.parent as THREE.Scene).fog) {
      ((handle.root.parent as THREE.Scene).fog as THREE.FogExp2).color.set(
        0xd4b88a
      );
    }
  } else {
    mat.uniforms.uZenith.value.set('#87b8e0');
    mat.uniforms.uHorizon.value.set('#d7e6f2');
    mat.uniforms.uSunColor.value.set('#fff4d2');
    if (handle.root.parent && (handle.root.parent as THREE.Scene).fog) {
      ((handle.root.parent as THREE.Scene).fog as THREE.FogExp2).color.set(
        0xb8c4ce
      );
    }
  }
}

function tex(url: URL, repeat: number, color = true) {
  const t = new THREE.TextureLoader().load(url.href);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function hasWorldAtmosphere(scene: THREE.Scene) {
  return Boolean(scene.getObjectByName(ROOT));
}

export function disposeWorldAtmosphere(scene: THREE.Scene) {
  const old = scene.getObjectByName(ROOT);
  if (old) {
    old.removeFromParent();
    old.traverse((o) => {
      const m = o as THREE.Mesh | THREE.Points;
      if ((m as THREE.Mesh).isMesh || (m as THREE.Points).isPoints) {
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => mat.dispose());
      }
    });
  }
  handle = null;
}

export function mountWorldAtmosphere(scene: THREE.Scene): string {
  disposeWorldAtmosphere(scene);
  const extraSky = scene.getObjectByName('worldSkyDome');
  extraSky?.parent?.remove(extraSky);
  const root = new THREE.Group();
  root.name = ROOT;
  root.userData.isTransformControls = true;

  const cover = seafloorCoverM();
  const visualM = 2000;
  const sky = createSkyDome();
  root.add(sky);
  const seabed = createSeabedOverlayMesh(visualM);
  root.add(seabed);
  const water = createWaterFloorMesh(visualM, cover);
  root.add(water);
  const weld = createWeldBandMesh(visualM);
  root.add(weld);
  const sparkles = createWaterSparkles();
  root.add(sparkles);

  const rain = tex(new URL('../assets/image/rain.png', import.meta.url), 1);
  const falls: THREE.Mesh[] = [];
  const fallSites = [
    new THREE.Vector3(48, 18, -62),
    new THREE.Vector3(-72, 22, 40),
  ];
  for (const p of fallSites) {
    const g = new THREE.PlaneGeometry(6, 28);
    const m = new THREE.MeshBasicMaterial({
      map: rain,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: 0xcfe8ff,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(p);
    mesh.name = 'waterfall';
    mesh.userData.isTransformControls = true;
    stampContentLayer(mesh, 'weather', { siHeightM: 28 });
    mesh.userData.physLayer = 'IgnoreRaycast';
    root.add(mesh);
    falls.push(mesh);
  }

  const smoke = tex(new URL('../assets/image/smoke.png', import.meta.url), 1);
  const clouds: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.PlaneGeometry(48 + (i % 3) * 10, 18);
    const m = new THREE.MeshBasicMaterial({
      map: smoke,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: 0xe8eef6,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set((i - 3) * 52, 92 + (i % 2) * 14, ((i * 37) % 80) - 40);
    mesh.rotation.x = -0.35;
    mesh.name = 'cloud';
    mesh.userData.isTransformControls = true;
    stampContentLayer(mesh, 'weather', { siHeightM: 20 });
    mesh.userData.physLayer = 'IgnoreRaycast';
    root.add(mesh);
    clouds.push(mesh);
  }

  const mistCount = 400;
  const mistGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(mistCount * 3);
  for (let i = 0; i < mistCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 360;
    pos[i * 3 + 1] = 1 + Math.random() * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 360;
  }
  mistGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mist = new THREE.Points(
    mistGeo,
    new THREE.PointsMaterial({
      map: smoke,
      color: 0xc9d6e2,
      size: 4.2,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  mist.name = 'mist';
  mist.userData.isTransformControls = true;
  stampContentLayer(mist, 'weather', { siHeightM: 8 });
  mist.userData.physLayer = 'IgnoreRaycast';
  root.add(mist);

  stampContentLayer(root, 'weather', { siHeightM: 120 });
  scene.add(root);
  if (!scene.fog) scene.fog = new THREE.FogExp2(0xb8c4ce, 0.0012);
  handle = { root, water, weld, seabed, sparkles, sky, falls, clouds, mist };
  return 'L0 DS2 · WaterFloor + sparkles · sky · weld −10 · falls / mist / clouds';
}

function pinFloor(
  m: THREE.Mesh | undefined,
  y: number,
  camX: number,
  camZ: number,
  dt: number
) {
  if (!m) return;
  m.position.x = camX;
  m.position.z = camZ;
  m.position.y = y;
  const mat = m.material as THREE.ShaderMaterial;
  if (mat?.isShaderMaterial) tickWaterFloorMaterial(mat, dt, camX, camZ);
}

export function tickWorldAtmosphere(dt: number, camera?: THREE.Camera) {
  if (!handle) return;
  const t = dt;
  const camX = camera?.position.x ?? 0;
  const camZ = camera?.position.z ?? 0;
  const scene = handle.root.parent;
  pinFloor(handle.water, WORLD_STACK.waterY, camX, camZ, t);
  pinFloor(handle.weld, WORLD_STACK.islandWeldY, camX, camZ, t);
  pinFloor(handle.seabed, WORLD_STACK.islandWeldY - 0.4, camX, camZ, t);
  if (handle.sky && camera) handle.sky.position.copy(camera.position);
  for (const f of handle.falls) {
    const m = f.material as THREE.MeshBasicMaterial;
    if (m.map) m.map.offset.y -= 0.55 * t;
    f.lookAt(f.position.x, f.position.y, f.position.z + 1);
  }
  for (const c of handle.clouds) {
    c.position.x += 1.6 * t;
    if (c.position.x > 220) c.position.x = -220;
  }
  handle.mist.rotation.y += 0.015 * t;
  if (handle.sparkles) tickWaterSparkles(handle.sparkles, t, camX, camZ);
  if (scene) tickPlayWaterRipples(scene as THREE.Scene, t);
}
