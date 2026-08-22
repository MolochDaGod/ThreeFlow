/**
 * Vanilla Three.js port of stylized-components WaterFloor / SeabedFloor GLSL.
 * Source: https://github.com/MolochDaGod/stylized-components (Cortiz, MIT — keep credit).
 * Used by worldAtmosphere. Not an R3F/Next scene. Not a second terrain mesh.
 */
import * as THREE from 'three';
import {
  WATER_FLOOR_STACK,
  WORLD_STACK,
  WORLD_WIND,
} from '@/config/fleetSystems';
import { peekPlayQuery, stampContentLayer } from './contentLayers';

const WATER_VERT = /* glsl */ `
 varying vec2 vWorldPos;
 void main() {
 vec4 worldPos = modelMatrix * vec4(position, 1.0);
 vWorldPos = worldPos.xz;
 gl_Position = projectionMatrix * viewMatrix * worldPos;
 }
`;

const WATER_FRAG = /* glsl */ `
 uniform float uTime;
 uniform float uScale;
 uniform float uSmoothness;
 uniform float uEdgeThreshold;
 uniform float uEdgeSoftness;
 uniform float uFlowX;
 uniform float uFlowZ;
 uniform float uCellSpeed;
 uniform float uNoiseScale;
 uniform float uNoiseFlowSpeed;
 uniform float uDistortAmount;
 uniform vec3 uDeepColor;
 uniform vec3 uMidColor;
 uniform float uMidPos;
 uniform vec3 uHighlight;
 uniform float uOpacity;
 uniform float uDeepOpacity;
 uniform float uFadeDistance;
 uniform float uFadeStrength;
 uniform vec2 uCamXZ;
 uniform vec2 uRippleCenters[8];
 uniform float uRippleTimes[8];
 uniform int uRippleCount;
 uniform float uRippleSpeed;
 uniform float uRippleWidth;
 uniform float uRippleStrength;
 uniform float uRippleDecay;
 uniform int uRippleRings;
 uniform float uRippleSpacing;
 varying vec2 vWorldPos;

 vec2 hash2(vec2 p) {
 p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
 return fract(sin(p) * 43758.5453);
 }
 float smin(float a, float b, float k) {
 float h = max(k - abs(a - b), 0.0) / k;
 return min(a, b) - h * h * h * k / 6.0;
 }
 vec2 cellPt(vec2 seed) {
 return 0.5 + 0.5 * sin(uTime * uCellSpeed + 6.2831 * seed);
 }
 float voronoiF1(vec2 p) {
 vec2 i = floor(p), f = fract(p);
 float md = 8.0;
 for (int y = -1; y <= 1; y++)
 for (int x = -1; x <= 1; x++) {
 vec2 n = vec2(float(x), float(y));
 vec2 pt = cellPt(hash2(i + n));
 md = min(md, length(n + pt - f));
 }
 return md;
 }
 float voronoiSF1(vec2 p) {
 vec2 i = floor(p), f = fract(p);
 float res = 8.0;
 for (int y = -1; y <= 1; y++)
 for (int x = -1; x <= 1; x++) {
 vec2 n = vec2(float(x), float(y));
 vec2 pt = cellPt(hash2(i + n));
 res = smin(res, length(n + pt - f), uSmoothness);
 }
 return res;
 }
 float nHash(vec2 p) {
 p = fract(p * vec2(127.1, 311.7));
 p += dot(p, p + 45.32);
 return fract(p.x * p.y);
 }
 float vnoise(vec2 p) {
 vec2 i = floor(p), f = fract(p);
 f = f * f * (3.0 - 2.0 * f);
 return mix(
 mix(nHash(i), nHash(i + vec2(1.0, 0.0)), f.x),
 mix(nHash(i + vec2(0.0, 1.0)), nHash(i + vec2(1.0, 1.0)), f.x),
 f.y
 );
 }
 float fbm(vec2 p) {
 float v = 0.0, a = 0.5;
 for (int i = 0; i < 2; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
 return v;
 }

 void main() {
 vec2 noiseUV = vWorldPos * uNoiseScale + vec2(uTime * uNoiseFlowSpeed, 0.0);
 float noiseFac = fbm(noiseUV);
 vec2 distort = vec2(noiseFac - 0.5) * uDistortAmount;
 vec2 uv = vWorldPos * uScale + vec2(uFlowX, uFlowZ) * uTime + distort;
 float f1 = voronoiF1(uv);
 float sf1 = voronoiSF1(uv);
 float edge = f1 - sf1;
 float t = smoothstep(
 uEdgeThreshold - uEdgeSoftness,
 uEdgeThreshold + uEdgeSoftness,
 edge
 );
 float safeMP = max(uMidPos, 1e-4);
 float seg0 = clamp(t / safeMP, 0.0, 1.0);
 float seg1 = clamp((t - safeMP) / max(1.0 - safeMP, 1e-4), 0.0, 1.0);
 float inSeg1 = step(safeMP, t);
 vec3 color = mix(
 mix(uDeepColor, uMidColor, seg0),
 mix(uMidColor, uHighlight, seg1),
 inSeg1
 );
 float rippleAcc = 0.0;
 for (int i = 0; i < 8; i++) {
 float isOn = step(float(i), float(uRippleCount) - 0.5);
 float elapsed = max(uTime - uRippleTimes[i], 0.0);
 float d = length(vWorldPos - uRippleCenters[i]);
 for (int r = 0; r < 4; r++) {
 float rIsOn = step(float(r), float(uRippleRings) - 0.5);
 float re = max(elapsed - float(r) * uRippleSpacing, 0.0);
 float ringR = re * uRippleSpeed;
 float ringDist = abs(d - ringR);
 float ring = 1.0 - smoothstep(0.0, uRippleWidth, ringDist);
 float fade = exp(-re * uRippleDecay);
 rippleAcc += ring * fade * isOn * rIsOn;
 }
 }
 float ripple = clamp(rippleAcc * uRippleStrength, 0.0, 1.0);
 color = mix(color, uHighlight, ripple);
 float dist = length(vWorldPos - uCamXZ);
 float fade = 1.0 - pow(clamp(dist / uFadeDistance, 0.0, 1.0), uFadeStrength);
 float alpha = mix(uDeepOpacity, 1.0, max(t, ripple)) * uOpacity * fade;
 gl_FragColor = vec4(color, alpha);
 }
`;

const SEABED_FRAG = /* glsl */ `
 uniform float uTime;
 uniform float uScale;
 uniform float uCellSpeed;
 uniform float uFlowX;
 uniform float uFlowZ;
 uniform float uEdgeThreshold;
 uniform float uEdgeSoftness;
 uniform vec3 uDeepColor;
 uniform vec3 uHighlight;
 uniform float uFadeDistance;
 uniform float uFadeStrength;
 uniform vec2 uCamXZ;
 varying vec2 vWorldPos;

 vec2 hash2(vec2 p) {
 p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
 return fract(sin(p) * 43758.5453);
 }
 float smin(float a, float b, float k) {
 float h = max(k - abs(a - b), 0.0) / k;
 return min(a, b) - h * h * h * k / 6.0;
 }
 vec2 cellPt(vec2 seed) {
 return 0.5 + 0.5 * sin(uTime * uCellSpeed + 6.2831 * seed);
 }
 float voronoiF1(vec2 p) {
 vec2 i = floor(p), f = fract(p);
 float md = 8.0;
 for (int y = -1; y <= 1; y++)
 for (int x = -1; x <= 1; x++) {
 vec2 n = vec2(float(x), float(y));
 vec2 pt = cellPt(hash2(i + n));
 md = min(md, length(n + pt - f));
 }
 return md;
 }
 float voronoiSF1(vec2 p) {
 vec2 i = floor(p), f = fract(p);
 float res = 8.0;
 for (int y = -1; y <= 1; y++)
 for (int x = -1; x <= 1; x++) {
 vec2 n = vec2(float(x), float(y));
 vec2 pt = cellPt(hash2(i + n));
 res = smin(res, length(n + pt - f), 0.4);
 }
 return res;
 }

 void main() {
 vec2 uv = vWorldPos * uScale + vec2(uFlowX, uFlowZ) * uTime;
 float f1 = voronoiF1(uv);
 float sf1 = voronoiSF1(uv);
 float edge = f1 - sf1;
 float t = smoothstep(uEdgeThreshold - uEdgeSoftness,
 uEdgeThreshold + uEdgeSoftness, edge);
 vec3 color = mix(uDeepColor, uHighlight, t);
 float dist = length(vWorldPos - uCamXZ);
 float fade = 1.0 - pow(clamp(dist / uFadeDistance, 0.0, 1.0), uFadeStrength);
 gl_FragColor = vec4(color, fade * 0.55);
 }
`;

export type WaterRipple = { x: number; z: number; t: number };

const RIPPLE_CAP = 8;
const ripples: WaterRipple[] = [];

/** Same event bus as stylized useWaterRipple / rippleStore — no R3F hook. */
export function emitWaterRipple(
  x: number,
  z: number,
  t = performance.now() * 0.001
) {
  ripples.unshift({ x, z, t });
  if (ripples.length > RIPPLE_CAP) ripples.length = RIPPLE_CAP;
}

export function waterRipples(): readonly WaterRipple[] {
  return ripples;
}

export function createWaterFloorMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 0.012 },
      uSmoothness: { value: 0.55 },
      uEdgeThreshold: { value: 0.067 },
      uEdgeSoftness: { value: 0.01 },
      uFlowX: { value: 0 },
      uFlowZ: { value: 0.05 },
      uCellSpeed: { value: 0.3 },
      uNoiseScale: { value: 0.08 },
      uNoiseFlowSpeed: { value: 0.2 },
      uDistortAmount: { value: 0.3 },
      uDeepColor: { value: new THREE.Color('#1a3a5c') },
      uMidColor: { value: new THREE.Color('#59c0e8') },
      uMidPos: { value: 0.084 },
      uHighlight: { value: new THREE.Color('#ffffff') },
      uOpacity: { value: 0.92 },
      uDeepOpacity: { value: 0.42 },
      uFadeDistance: { value: 1800 },
      uFadeStrength: { value: 1.4 },
      uCamXZ: { value: new THREE.Vector2() },
      uRippleCenters: {
        value: Array.from({ length: RIPPLE_CAP }, () => new THREE.Vector2()),
      },
      uRippleTimes: { value: new Array(RIPPLE_CAP).fill(0) },
      uRippleCount: { value: 0 },
      uRippleSpeed: { value: 1.5 },
      uRippleWidth: { value: 1.8 },
      uRippleStrength: { value: 5.5 },
      uRippleDecay: { value: 1.6 },
      uRippleRings: { value: 2 },
      uRippleSpacing: { value: 1.0 },
    },
  });
}

/** Overlay only — DS2 tiles remain the walkable seabed. Do not stamp as terrain. */
export function createSeabedOverlayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    vertexShader: WATER_VERT,
    fragmentShader: SEABED_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 0.008 },
      uCellSpeed: { value: 0.18 },
      uFlowX: { value: 0.035 },
      uFlowZ: { value: -0.11 },
      uEdgeThreshold: { value: 0.06 },
      uEdgeSoftness: { value: 0.04 },
      uDeepColor: { value: new THREE.Color('#1a4a58') },
      uHighlight: { value: new THREE.Color('#0a1f3c') },
      uFadeDistance: { value: 1800 },
      uFadeStrength: { value: 2.1 },
      uCamXZ: { value: new THREE.Vector2() },
    },
  });
}

export function stampStylizedLayer(
  obj: THREE.Object3D,
  layer: keyof typeof WATER_FLOOR_STACK.layers
) {
  const def = WATER_FLOOR_STACK.layers[layer];
  stampContentLayer(obj, def.contentLayer, { siHeightM: 4 });
  obj.userData.stylizedLayer = def.id;
  obj.userData.physLayer = def.phys;
  obj.userData.physBody = 'fixed';
  obj.userData.physShape = def.shape;
  obj.userData.physSensor = def.sensor;
  obj.userData.surface = def.surface;
}

/** Camera-follow WaterFloor surface. Collider cover is stamped separately (world metres). */
export function createWaterFloorMesh(
  coverVisualM: number,
  physCoverM: number
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(coverVisualM, coverVisualM, 1, 1),
    createWaterFloorMaterial()
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WORLD_STACK.waterY;
  mesh.name = 'worldWater';
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.userData.isTransformControls = true;
  mesh.userData.followCamXZ = true;
  mesh.userData.physCoverM = physCoverM;
  stampStylizedLayer(mesh, 'water');
  return mesh;
}

/**
 * Faint Voronoi wash at weld Y so water reads depth through L1.
 * Not walkable. DS2 tiles stay the L0 collider.
 */
export function createSeabedOverlayMesh(coverVisualM: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(coverVisualM, coverVisualM, 1, 1),
    createSeabedOverlayMaterial()
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WORLD_STACK.islandWeldY - 0.4;
  mesh.name = 'worldSeabedOverlay';
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  mesh.userData.isTransformControls = true;
  mesh.userData.followCamXZ = true;
  stampStylizedLayer(mesh, 'intersection');
  mesh.userData.stylizedLayer = 'seabed-overlay';
  return mesh;
}

export function createWeldBandMesh(coverVisualM: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(coverVisualM, coverVisualM, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x8fd4ff,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WORLD_STACK.islandWeldY;
  mesh.name = 'worldWeldBand';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  mesh.userData.isTransformControls = true;
  mesh.userData.followCamXZ = true;
  stampStylizedLayer(mesh, 'intersection');
  return mesh;
}

export function tickWaterFloorMaterial(
  mat: THREE.ShaderMaterial,
  dt: number,
  camX: number,
  camZ: number
) {
  const u = mat.uniforms;
  if (!u.uTime) return;
  u.uTime.value += dt;
  u.uCamXZ.value.set(camX, camZ);
  if (u.uFlowX && u.uFlowZ) {
    u.uFlowX.value = WORLD_WIND.dirX * 0.045;
    u.uFlowZ.value = WORLD_WIND.dirZ * 0.045;
  }
  if (u.uRippleCount) {
    const list = waterRipples();
    u.uRippleCount.value = list.length;
    for (let i = 0; i < RIPPLE_CAP; i++) {
      const r = list[i];
      if (r) {
        u.uRippleCenters.value[i].set(r.x, r.z);
        u.uRippleTimes.value[i] = r.t;
      }
    }
  }
}

/** WaterSparkles — Cortiz demo. Procedural 4-point stars, no textures. */
const SPARKLE_VERT = /* glsl */ `
 attribute float aLifetime;
 attribute float aMaxLifetime;
 attribute float aSize;
 varying float vAlpha;
 void main() {
 float t = clamp(aLifetime / aMaxLifetime, 0.0, 1.0);
 vAlpha = sin(t * 3.14159265);
 vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
 gl_PointSize = aSize * (300.0 / max(-mvPosition.z, 4.0));
 gl_Position = projectionMatrix * mvPosition;
 }
`;

const SPARKLE_FRAG = /* glsl */ `
 uniform vec3 uColor;
 uniform float uIntensity;
 uniform float uArmSharpness;
 uniform float uArmFalloff;
 uniform float uGlowRadius;
 varying float vAlpha;
 void main() {
 vec2 uv = gl_PointCoord * 2.0 - 1.0;
 float hArm = exp(-abs(uv.y) * uArmSharpness) * exp(-abs(uv.x) * uArmFalloff);
 float vArm = exp(-abs(uv.x) * uArmSharpness) * exp(-abs(uv.y) * uArmFalloff);
 float glow = exp(-length(uv) * uGlowRadius);
 float star = max(max(hArm, vArm), glow);
 if (star < 0.005) discard;
 gl_FragColor = vec4(uColor * uIntensity, star * vAlpha);
 }
`;

const SPARKLE_MAX = 280;

export function createWaterSparkles(): THREE.Points {
  const pos = new Float32Array(SPARKLE_MAX * 3);
  const life = new Float32Array(SPARKLE_MAX);
  const maxLife = new Float32Array(SPARKLE_MAX);
  const size = new Float32Array(SPARKLE_MAX);
  for (let i = 0; i < SPARKLE_MAX; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 80;
    pos[i * 3 + 1] = WORLD_STACK.waterY + 0.04;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    maxLife[i] = 0.8 + Math.random() * 2.4;
    life[i] = Math.random() * maxLife[i];
    size[i] = 14 + Math.random() * 36;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aLifetime', new THREE.BufferAttribute(life, 1));
  geo.setAttribute('aMaxLifetime', new THREE.BufferAttribute(maxLife, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: SPARKLE_VERT,
    fragmentShader: SPARKLE_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color('#c8f0ff') },
      uIntensity: { value: 2.6 },
      uArmSharpness: { value: 14 },
      uArmFalloff: { value: 1.2 },
      uGlowRadius: { value: 3.5 },
    },
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'worldWaterSparkles';
  pts.frustumCulled = false;
  pts.renderOrder = 4;
  pts.userData.isTransformControls = true;
  pts.userData.waterSparkles = true;
  stampStylizedLayer(pts, 'water');
  pts.userData.physLayer = 'IgnoreRaycast';
  return pts;
}

export function tickWaterSparkles(
  pts: THREE.Points,
  dt: number,
  camX: number,
  camZ: number
) {
  const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
  const life = pts.geometry.getAttribute('aLifetime') as THREE.BufferAttribute;
  const maxLife = pts.geometry.getAttribute(
    'aMaxLifetime'
  ) as THREE.BufferAttribute;
  const size = pts.geometry.getAttribute('aSize') as THREE.BufferAttribute;
  if (!pos || !life) return;
  const y = WORLD_STACK.waterY + 0.04;
  const spread = 70;
  for (let i = 0; i < pos.count; i++) {
    let t = life.getX(i) + dt;
    if (t >= maxLife.getX(i)) {
      pos.setXYZ(
        i,
        camX + (Math.random() - 0.5) * spread * 2,
        y,
        camZ + (Math.random() - 0.5) * spread * 2
      );
      t = 0;
      maxLife.setX(i, 0.8 + Math.random() * 2.4);
      size.setX(i, 14 + Math.random() * 36);
    } else {
      pos.setY(i, y);
    }
    life.setX(i, t);
  }
  pos.needsUpdate = true;
  life.needsUpdate = true;
  maxLife.needsUpdate = true;
  size.needsUpdate = true;
}

let rippleAcc = 0;
let lastRippleX = 0;
let lastRippleZ = 0;

/** Emit anime rings when a play body walks through the water plane. */
export function tickPlayWaterRipples(scene: THREE.Scene, dt: number) {
  rippleAcc += dt;
  if (rippleAcc < 0.32) return;
  let walker: THREE.Object3D | undefined = peekPlayQuery()?.playAs || undefined;
  if (!walker) {
    scene.traverse((o) => {
      if (walker) return;
      if (o.userData?.playAs || o.userData?.player) walker = o;
    });
  }
  if (!walker) return;
  const y = walker.position.y;
  if (y > WORLD_STACK.waterY + 1.6 || y < WORLD_STACK.waterY - 2.4) return;
  const dx = walker.position.x - lastRippleX;
  const dz = walker.position.z - lastRippleZ;
  if (dx * dx + dz * dz < 0.18) return;
  lastRippleX = walker.position.x;
  lastRippleZ = walker.position.z;
  rippleAcc = 0;
  emitWaterRipple(walker.position.x, walker.position.z);
}
