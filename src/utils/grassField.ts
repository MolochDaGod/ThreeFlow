/**
 * Vanilla GrassField bind — stylized-components GrassField (Cortiz, MIT).
 * https://github.com/MolochDaGod/stylized-components/tree/main/src/components/grassField
 *
 * Rewires an existing terrain mesh. Area-weighted blades on that mesh.
 * Shared groundDirt() for ground + blades. Not a second ground plane.
 * Not Next/R3F. Flowers are procedural (no demo textures). Season presets
 * recolor the same uniforms. Foliage tint rewires existing leaf meshes.
 */
import * as THREE from 'three';
import {
  WORLD_WIND,
  type GrassSeasonId,
  type TerrainLookId,
} from '@/config/fleetSystems';
import { peekPlayQuery } from './contentLayers';

function skipMesh(o: THREE.Object3D): boolean {
  const layer = String(o.userData?.contentLayer || '');
  return (
    Boolean(o.userData?.harvestKind) ||
    layer === 'harvestable' ||
    layer === 'item'
  );
}

const MAX_ROCKS = 24;
const MAX_SHADOW_TAPS = 4;
export const GRASS_NAME = '__grassField';
export const FLOWER_NAME = '__grassFlowers';

const GROUND_MASK_UNIFORMS = /* glsl */ `
 uniform vec3 uDirtColor;
 uniform float uDirtScale;
 uniform float uDirtCoverage;
 uniform float uDirtSoftness;
 uniform float uDirtWarp;
`;

const GROUND_MASK_GLSL = /* glsl */ `
 float _gmHash(vec2 p) {
 p = fract(p * vec2(127.1, 311.7));
 p += dot(p, p + 19.19);
 return fract(p.x * p.y);
 }
 float _gmNoise(vec2 p) {
 vec2 i = floor(p);
 vec2 f = fract(p);
 vec2 u = f * f * (3.0 - 2.0 * f);
 return mix(
 mix(_gmHash(i), _gmHash(i + vec2(1.0, 0.0)), u.x),
 mix(_gmHash(i + vec2(0.0, 1.0)), _gmHash(i + vec2(1.0, 1.0)), u.x),
 u.y
 );
 }
 float _gmFbm(vec2 p) {
 float v = 0.0, a = 0.5, n = 0.0;
 for (int i = 0; i < 4; i++) {
 v += a * _gmNoise(p);
 n += a;
 p = p * 2.03 + vec2(3.1, 7.7);
 a *= 0.5;
 }
 return v / max(n, 0.001);
 }
 float groundDirt(vec2 worldXZ) {
 vec2 p = worldXZ * uDirtScale;
 if (uDirtWarp > 0.001) {
 vec2 w = vec2(_gmFbm(p + vec2(11.3, 2.7)), _gmFbm(p + vec2(5.9, 17.1)));
 p += (w - 0.5) * uDirtWarp;
 }
 float n = _gmFbm(p);
 float threshold = 1.0 - uDirtCoverage;
 return smoothstep(threshold - uDirtSoftness, threshold + uDirtSoftness, n);
 }
`;

type FieldU = Record<string, THREE.IUniform>;

function makeUniforms(look: TerrainLookId): FieldU {
  const tropical = look !== 'mountain';
  return {
    uTime: { value: 0 },
    uWindStrength: { value: tropical ? 0.1 : 0.08 },
    uWindSpeed: { value: tropical ? 1.3 : 1.6 },
    uWindFreq: { value: 0.4 },
    uWindTurb: { value: 0.3 },
    uWindLean: { value: 0.45 },
    uWindDir: { value: new THREE.Vector2(1, 0) },
    uWindFixLocal: { value: 1 },
    uGrassBottom: { value: new THREE.Color(tropical ? '#4f7c13' : '#6a6a38') },
    uGrassTop: { value: new THREE.Color(tropical ? '#79a01c' : '#b8b05a') },
    uBrightness: { value: 0.8 },
    uGradStart: { value: 0.15 },
    uGradEnd: { value: 1 },
    uGradPower: { value: 1.6 },
    uPatchLush: { value: new THREE.Color(tropical ? '#6f9a2a' : '#8a8038') },
    uPatchDry: { value: new THREE.Color(tropical ? '#b8a94e' : '#c4a06a') },
    uPatchStrength: { value: 0.35 },
    uPatchScale: { value: 0.15 },
    uPatchBias: { value: 1.6 },
    uShadowStrength: { value: 0.55 },
    uShadowSamples: { value: 4 },
    uShadowSampleY: { value: 0.4 },
    uShadowRadius: { value: 0.3 },
    uDirtColor: { value: new THREE.Color(tropical ? '#ac956c' : '#8a7a62') },
    uDirtScale: { value: tropical ? 0.4 : 0.28 },
    uDirtCoverage: { value: tropical ? 0.38 : 0.55 },
    uDirtSoftness: { value: 0.07 },
    uDirtWarp: { value: 0.2 },
    uDirtCut: { value: tropical ? 1 : 0.75 },
    uDirtBlend: { value: 0.8 },
    uRocks: {
      value: Array.from({ length: MAX_ROCKS }, () => new THREE.Vector4()),
    },
    uRockCount: { value: 0 },
    uRockRadiusMul: { value: 1 },
    uRockFalloff: { value: 0.35 },
    uRockFlatten: { value: 0.85 },
    uRockBend: { value: 0.25 },
    uSunDir: { value: new THREE.Vector3(0.4, 1, 0.2).normalize() },
    uSunColor: { value: new THREE.Color(1, 1, 1) },
    uTransColor: { value: new THREE.Color(tropical ? '#c1e54d' : '#e8d878') },
    uTransStrength: { value: tropical ? 2.2 : 1.4 },
    uTransPower: { value: 3 },
    uTransTip: { value: 0.6 },
    uTransShadow: { value: 1 },
    uDebugChannel: { value: 0 },
    uTintFloor: { value: 1 },
    uFlatFloorNormal: { value: 1 },
    uGndVarColor: { value: new THREE.Color('#c4a77d') },
    uGndVarScale: { value: 1.24 },
    uGndVarStrength: { value: 0.85 },
    uGndGrainScale: { value: 6.7 },
    uGndGrainStrength: { value: 0.9 },
    uGndReliefScale: { value: 0.5 },
    uGndReliefStrength: { value: 0.15 },
    uFlDirtMax: { value: tropical ? 0.48 : 0.28 },
    uColorR: { value: new THREE.Color(tropical ? '#f2d15a' : '#e8c878') },
    uColorG: { value: new THREE.Color(tropical ? '#fff1a8' : '#d8c090') },
    uColorB: { value: new THREE.Color(tropical ? '#e87a3a' : '#c4783a') },
    uColorStem: { value: new THREE.Color(tropical ? '#3d6b1e' : '#5a5a28') },
    uBendAmp: { value: 0.04 },
    uBendFreq: { value: 4 },
    uLeafBottom: { value: new THREE.Color(tropical ? '#1c3b23' : '#3a3a20') },
    uLeafTop: { value: new THREE.Color(tropical ? '#5c8338' : '#7a7a40') },
  };
}

function bladeHalfWidth(t: number) {
  return 0.5 * Math.pow(1 - t, 1.2);
}

function makeBladeGeometry(segments = 3): THREE.BufferGeometry {
  const seg = Math.max(1, Math.round(segments));
  const positions = new Float32Array((seg * 2 + 1) * 3);
  for (let i = 0; i < seg; i++) {
    const t = i / seg;
    const w = bladeHalfWidth(t);
    positions[i * 6] = -w;
    positions[i * 6 + 1] = t;
    positions[i * 6 + 3] = w;
    positions[i * 6 + 4] = t;
  }
  positions[seg * 6 + 1] = 1;
  const indices: number[] = [];
  for (let i = 0; i < seg - 1; i++) {
    const l = i * 2;
    indices.push(l, l + 2, l + 1, l + 1, l + 2, l + 3);
  }
  const lastL = (seg - 1) * 2;
  indices.push(lastL, seg * 2, lastL + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeBladeMaterial(u: FieldU): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
 #define MAX_ROCKS ${MAX_ROCKS}
 #define GRASS_SHADOW_TAPS ${MAX_SHADOW_TAPS}
 ${GROUND_MASK_UNIFORMS}
 ${GROUND_MASK_GLSL}
 uniform float uTime;
 uniform float uWindStrength;
 uniform float uWindSpeed;
 uniform float uWindFreq;
 uniform float uWindTurb;
 uniform float uWindLean;
 uniform vec2 uWindDir;
 uniform float uWindFixLocal;
 uniform float uDirtCut;
 uniform float uShadowSampleY;
 uniform float uShadowRadius;
 uniform vec4 uRocks[MAX_ROCKS];
 uniform int uRockCount;
 uniform float uRockRadiusMul;
 uniform float uRockFalloff;
 uniform float uRockFlatten;
 uniform float uRockBend;
 uniform float uPatchScale;
 varying float vBH;
 varying vec3 vWorldPos;
 varying vec3 vBladeN;
 varying float vDirt;
 varying float vPatch;
 varying float vRockInfl;
 #ifdef USE_SHADOWMAP
 varying vec4 vGrassShCoord[GRASS_SHADOW_TAPS];
 #endif`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
 vec2 baseXZ = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
 vDirt = groundDirt(baseXZ);
 vPatch = _gmFbm(baseXZ * uPatchScale);
 float rockInfl = 0.0;
 vec2 rockAway = vec2(1.0, 0.0);
 for (int i = 0; i < MAX_ROCKS; i++) {
 if (i >= uRockCount) break;
 vec4 rock = uRocks[i];
 vec2 d = baseXZ - rock.xz;
 float dist = length(d);
 float rad = rock.w * uRockRadiusMul;
 float infl = 1.0 - smoothstep(rad, rad + uRockFalloff, dist);
 if (infl > rockInfl) {
 rockInfl = infl;
 rockAway = dist > 1e-4 ? d / dist : vec2(1.0, 0.0);
 }
 }
 vRockInfl = rockInfl;
 float shrink = (1.0 - uDirtCut * vDirt) * (1.0 - uRockFlatten * rockInfl);
 transformed.y *= shrink;
 vBH = position.y * shrink;
 float hMask = vBH * vBH;
 vec3 wPos = (instanceMatrix * vec4(position, 1.0)).xyz;
 vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
 float primary = sin(dot(wPos.xz, uWindDir) * uWindFreq + uTime * uWindSpeed);
 float second = sin(dot(wPos.xz, uWindDir) * uWindFreq * 2.6 + uTime * uWindSpeed * 1.8 + 1.3) * 0.35;
 vec2 perp = vec2(-uWindDir.y, uWindDir.x);
 float turb = sin(dot(wPos.xz, perp) * uWindFreq * 1.9 + uTime * uWindSpeed * 0.7 + 2.6) * uWindTurb;
 float swing = (primary + second + turb) * uWindStrength * hMask;
 float lean = uWindLean * hMask;
 mat3 instRot = mat3(
 normalize(vec3(instanceMatrix[0])),
 normalize(vec3(instanceMatrix[1])),
 normalize(vec3(instanceMatrix[2]))
 );
 vec3 windWrong = vec3(uWindDir.x, 0.0, uWindDir.y);
 vec3 windRight = transpose(instRot) * windWrong;
 vec3 windLocal = mix(windWrong, windRight, uWindFixLocal);
 transformed += windLocal * (swing + lean);
 if (rockInfl > 0.001) {
 vec3 awayLocal = transpose(instRot) * vec3(rockAway.x, 0.0, rockAway.y);
 transformed += awayLocal * (uRockBend * rockInfl * hMask);
 }
 vBladeN = normalize(mat3(modelMatrix) * instRot * normal);`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
 vec4 worldPosition = vec4(1e6, 1e6, 1e6, 1.0);
 #endif
 #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
 vec3 _shBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
 vec3 _shTip = (modelMatrix * instanceMatrix * vec4(0.0, 1.0, 0.0, 1.0)).xyz;
 vec3 _shCenter = mix(_shBase, _shTip, uShadowSampleY);
 float _rot = fract(sin(dot(_shBase.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831853;
 for (int _k = 0; _k < GRASS_SHADOW_TAPS; _k++) {
 float _a = _rot + 6.2831853 * (float(_k) + 0.5) / float(GRASS_SHADOW_TAPS);
 vec2 _off = vec2(cos(_a), sin(_a)) * uShadowRadius;
 vGrassShCoord[_k] = directionalShadowMatrix[0] * vec4(_shCenter + vec3(_off.x, 0.0, _off.y), 1.0);
 }
 #endif`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `#include <defaultnormal_vertex>
 transformedNormal = normalize(mat3(viewMatrix) * vec3(0.0, 1.0, 0.0));`
    );
    shader.fragmentShader =
      `#define GRASS_SHADOW_TAPS ${MAX_SHADOW_TAPS}
 varying float vBH; varying vec3 vWorldPos; varying vec3 vBladeN;
 varying float vDirt; varying float vPatch;
 uniform vec3 uGrassBottom; uniform vec3 uGrassTop; uniform float uBrightness;
 uniform float uGradStart; uniform float uGradEnd; uniform float uGradPower;
 uniform vec3 uDirtColor; uniform float uDirtBlend;
 uniform vec3 uPatchLush; uniform vec3 uPatchDry;
 uniform float uPatchStrength; uniform float uPatchBias;
 uniform int uShadowSamples; uniform float uShadowStrength;
 uniform vec3 uSunDir; uniform vec3 uSunColor;
 uniform vec3 uTransColor; uniform float uTransStrength;
 uniform float uTransPower; uniform float uTransTip; uniform float uTransShadow;
 #ifdef USE_SHADOWMAP
 varying vec4 vGrassShCoord[GRASS_SHADOW_TAPS];
 #endif\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
 normal = normalize(mat3(viewMatrix) * vec3(0.0, 1.0, 0.0));`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `float _gT = clamp((vBH - uGradStart) / max(uGradEnd - uGradStart, 0.001), 0.0, 1.0);
 _gT = pow(_gT, uGradPower);
 vec3 _bladeCol = mix(uGrassBottom, uGrassTop, _gT);
 float _pt = pow(clamp(vPatch, 0.0, 1.0), uPatchBias);
 _bladeCol = mix(_bladeCol, mix(uPatchLush, uPatchDry, _pt), uPatchStrength);
 _bladeCol = mix(_bladeCol, uDirtColor, vDirt * uDirtBlend);
 vec4 diffuseColor = vec4(_bladeCol * uBrightness, opacity);`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
 {
 float _shadow = 1.0;
 #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
 DirectionalLightShadow _dls = directionalLightShadows[0];
 float _sSum = 0.0; int _sN = 0;
 for (int _k = 0; _k < GRASS_SHADOW_TAPS; _k++) {
 if (_k >= uShadowSamples) break;
 _sSum += getShadow(directionalShadowMap[0], _dls.shadowMapSize, _dls.shadowIntensity, _dls.shadowBias, _dls.shadowRadius, vGrassShCoord[_k]);
 _sN++;
 }
 _shadow = _sSum / float(max(_sN, 1));
 #endif
 gl_FragColor.rgb *= (1.0 - uShadowStrength * (1.0 - _shadow));
 vec3 _L = normalize(uSunDir);
 vec3 _V = normalize(cameraPosition - vWorldPos);
 float _back = pow(max(dot(_V, -_L), 0.0), uTransPower);
 float _thin = mix(1.0, vBH, uTransTip);
 float _edge = 1.0 - abs(dot(normalize(vBladeN), _L));
 float _sh = mix(1.0, _shadow, uTransShadow);
 gl_FragColor.rgb += uTransColor * uSunColor * uTransStrength * _back * _thin * _edge * _sh;
 }`
    );
  };
  return mat;
}

function makeGroundMaterial(
  u: FieldU,
  base?: THREE.Color
): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ side: THREE.FrontSide });
  if (base) mat.color.copy(base);
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader =
      `#define GRASS_SHADOW_TAPS ${MAX_SHADOW_TAPS}
 uniform float uFlatFloorNormal; uniform float uShadowRadius;
 varying vec2 vGndXZ;
 #ifdef USE_SHADOWMAP
 varying vec4 vGndShCoord[GRASS_SHADOW_TAPS];
 #endif\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `#include <defaultnormal_vertex>
 vec3 _upView = normalize(mat3(viewMatrix) * vec3(0.0, 1.0, 0.0));
 transformedNormal = normalize(mix(transformedNormal, _upView, uFlatFloorNormal));`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
 vGndXZ = (modelMatrix * vec4(transformed, 1.0)).xz;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
 vec4 worldPosition = vec4(1e6, 1e6, 1e6, 1.0);
 #endif
 #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
 vec3 _gwp = (modelMatrix * vec4(transformed, 1.0)).xyz;
 for (int _k = 0; _k < GRASS_SHADOW_TAPS; _k++) {
 float _a = 6.2831853 * (float(_k) + 0.5) / float(GRASS_SHADOW_TAPS);
 vec2 _off = vec2(cos(_a), sin(_a)) * uShadowRadius;
 vGndShCoord[_k] = directionalShadowMatrix[0] * vec4(_gwp + vec3(_off.x, 0.0, _off.y), 1.0);
 }
 #endif`
    );
    shader.fragmentShader =
      `#define GRASS_SHADOW_TAPS ${MAX_SHADOW_TAPS}
 varying vec2 vGndXZ;
 uniform vec3 uGrassBottom; uniform float uBrightness; uniform float uTintFloor;
 uniform vec3 uPatchLush; uniform vec3 uPatchDry;
 uniform float uPatchStrength; uniform float uPatchScale; uniform float uPatchBias;
 uniform vec3 uGndVarColor; uniform float uGndVarScale; uniform float uGndVarStrength;
 uniform float uGndGrainScale; uniform float uGndGrainStrength;
 uniform float uGndReliefScale; uniform float uGndReliefStrength;
 uniform int uShadowSamples; uniform float uShadowStrength;
 #ifdef USE_SHADOWMAP
 varying vec4 vGndShCoord[GRASS_SHADOW_TAPS];
 #endif\n` +
      GROUND_MASK_UNIFORMS +
      GROUND_MASK_GLSL +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
 #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
 {
 DirectionalLightShadow _dls = directionalLightShadows[0];
 float _sSum = 0.0; int _sN = 0;
 for (int _k = 0; _k < GRASS_SHADOW_TAPS; _k++) {
 if (_k >= uShadowSamples) break;
 _sSum += getShadow(directionalShadowMap[0], _dls.shadowMapSize, _dls.shadowIntensity, _dls.shadowBias, _dls.shadowRadius, vGndShCoord[_k]);
 _sN++;
 }
 gl_FragColor.rgb *= (1.0 - uShadowStrength * (1.0 - _sSum / float(max(_sN, 1))));
 }
 #endif`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `float _dirt = groundDirt(vGndXZ);
 float _pt = pow(clamp(_gmFbm(vGndXZ * uPatchScale), 0.0, 1.0), uPatchBias);
 vec3 _grassTint = mix(uGrassBottom, mix(uPatchLush, uPatchDry, _pt), uPatchStrength);
 vec3 _gndCol = mix(diffuse, _grassTint * uBrightness, uTintFloor);
 _gndCol = mix(_gndCol, uDirtColor * uBrightness, _dirt);
 float _var = _gmFbm(vGndXZ * uGndVarScale) - 0.5;
 float _grain = _gmFbm(vGndXZ * uGndGrainScale) - 0.5;
 vec3 _varCol = uGndVarColor * uBrightness;
 _gndCol += (_varCol - _gndCol) * _var * uGndVarStrength * _dirt;
 _gndCol += (_varCol - _gndCol) * _grain * uGndGrainStrength * _dirt;
 vec4 diffuseColor = vec4(max(_gndCol, vec3(0.0)), opacity);`
    );
  };
  return mat;
}

function seededLcg(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function scatterBlades(
  surface: THREE.Mesh,
  u: FieldU,
  density: number,
  maxCount: number,
  minLen: number,
  maxLen: number
): THREE.InstancedMesh | null {
  surface.updateMatrixWorld(true);
  const pos = surface.geometry.getAttribute('position');
  if (!pos) return null;
  const idx = surface.geometry.index;
  const mw = surface.matrixWorld;
  const verts: number[] = [];
  const cumArea: number[] = [];
  let totalArea = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const step = triCount > 8000 ? Math.ceil(triCount / 4000) : 1;
  for (let f = 0; f < triCount; f += step) {
    const i0 = idx ? idx.getX(f * 3) : f * 3;
    const i1 = idx ? idx.getX(f * 3 + 1) : f * 3 + 1;
    const i2 = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;
    a.fromBufferAttribute(pos, i0).applyMatrix4(mw);
    b.fromBufferAttribute(pos, i1).applyMatrix4(mw);
    c.fromBufferAttribute(pos, i2).applyMatrix4(mw);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac);
    const dbl = n.length();
    if (dbl < 1e-8) continue;
    totalArea += dbl * 0.5;
    cumArea.push(totalArea);
    verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  if (!cumArea.length || totalArea < 0.5) return null;
  const count = Math.min(
    Math.max(1, Math.round(density * totalArea)),
    maxCount
  );
  const mat = makeBladeMaterial(u);
  mat.transparent = false;
  mat.depthWrite = true;
  const im = new THREE.InstancedMesh(makeBladeGeometry(3), mat, count);
  im.name = GRASS_NAME;
  im.castShadow = false;
  im.receiveShadow = true;
  im.frustumCulled = false;
  im.userData.grassField = true;
  im.userData.physLayer = 'IgnoreRaycast';
  const rng = seededLcg(Math.abs(Math.round(totalArea * 131)) || 1);
  const dummy = new THREE.Object3D();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = rng() * totalArea;
    let lo = 0;
    let hi = cumArea.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumArea[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const t = lo * 9;
    let uu = rng();
    let vv = rng();
    if (uu + vv > 1) {
      uu = 1 - uu;
      vv = 1 - vv;
    }
    const w = 1 - uu - vv;
    p.set(
      verts[t] * w + verts[t + 3] * uu + verts[t + 6] * vv,
      verts[t + 1] * w + verts[t + 4] * uu + verts[t + 7] * vv,
      verts[t + 2] * w + verts[t + 5] * uu + verts[t + 8] * vv
    );
    dummy.position.copy(p);
    dummy.rotation.set(
      (rng() - 0.5) * 0.35,
      rng() * Math.PI * 2,
      (rng() - 0.5) * 0.18
    );
    dummy.scale.set(0.06, minLen + rng() * (maxLen - minLen), 1);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return im;
}

function makeFlowerGeometry(): THREE.BufferGeometry {
  const w = 0.11;
  const h = 0.2;
  const positions = new Float32Array([
    -w,
    0,
    0,
    w,
    0,
    0,
    w,
    h,
    0,
    -w,
    h,
    0,
    0,
    0,
    -w,
    0,
    0,
    w,
    0,
    h,
    w,
    0,
    h,
    -w,
  ]);
  const uvs = new Float32Array([
    0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1,
  ]);
  const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeFlowerMaterial(u: FieldU): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.4,
    depthWrite: false,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
 ${GROUND_MASK_UNIFORMS}
 ${GROUND_MASK_GLSL}
 uniform float uTime;
 uniform float uWindStrength;
 uniform float uWindSpeed;
 uniform float uWindFreq;
 uniform float uWindTurb;
 uniform float uWindLean;
 uniform vec2 uWindDir;
 uniform float uBendAmp;
 uniform float uBendFreq;
 uniform float uFlDirtMax;
 varying vec2 vFlUv;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
 vFlUv = uv;
 vec2 _flBaseXZ = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
 if (groundDirt(_flBaseXZ) > uFlDirtMax) {
 transformed = vec3(0.0);
 }
 float _flH = transformed.y * transformed.y;
 vec3 _flWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
 mat3 _flRot = mat3(
 normalize(vec3(instanceMatrix[0])),
 normalize(vec3(instanceMatrix[1])),
 normalize(vec3(instanceMatrix[2]))
 );
 vec3 _flWindLocal = transpose(_flRot) * vec3(uWindDir.x, 0.0, uWindDir.y);
 float _flPrimary = sin(dot(_flWorld.xz, uWindDir) * uWindFreq + uTime * uWindSpeed);
 float _flSecond = sin(dot(_flWorld.xz, uWindDir) * uWindFreq * 2.6 + uTime * uWindSpeed * 1.8 + 1.3) * 0.35;
 vec2 _flPerp = vec2(-uWindDir.y, uWindDir.x);
 float _flTurb = sin(dot(_flWorld.xz, _flPerp) * uWindFreq * 1.9 + uTime * uWindSpeed * 0.7 + 2.6) * uWindTurb;
 transformed += _flWindLocal * ((_flPrimary + _flSecond + _flTurb) * uWindStrength * _flH + uWindLean * _flH);
 transformed.x += sin(transformed.y * uBendFreq + uTime * uWindSpeed * 0.4 + _flWorld.x * 0.7) * uBendAmp * _flH;`
    );
    shader.fragmentShader =
      `varying vec2 vFlUv;
 uniform vec3 uColorR; uniform vec3 uColorG; uniform vec3 uColorB;
 uniform vec3 uColorStem; uniform vec3 uGrassBottom; uniform float uBrightness;\n` +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec2 _uv = vFlUv * 2.0 - 1.0;
 float _a = atan(_uv.y, _uv.x);
 float _r = length(_uv);
 float _petals = 0.52 + 0.48 * cos(5.0 * _a);
 if (_r > _petals * 0.92) discard;
 float _center = 1.0 - smoothstep(0.12, 0.28, _r);
 vec3 _petal = mix(uColorR, uColorB, 0.5 + 0.5 * sin(_a * 2.5));
 _petal = mix(_petal, uColorG, _center);
 vec3 _flCol = mix(uGrassBottom, mix(uColorStem, _petal, smoothstep(0.08, 0.35, _r)), smoothstep(0.0, 0.45, vFlUv.y));
 vec4 diffuseColor = vec4(_flCol * uBrightness, opacity);`
    );
  };
  return mat;
}

function scatterFlowers(
  surface: THREE.Mesh,
  u: FieldU,
  density: number,
  maxCount: number
): THREE.InstancedMesh | null {
  surface.updateMatrixWorld(true);
  const pos = surface.geometry.getAttribute('position');
  if (!pos) return null;
  const idx = surface.geometry.index;
  const mw = surface.matrixWorld;
  const verts: number[] = [];
  const cumArea: number[] = [];
  let totalArea = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const step = triCount > 8000 ? Math.ceil(triCount / 4000) : 1;
  for (let f = 0; f < triCount; f += step) {
    const i0 = idx ? idx.getX(f * 3) : f * 3;
    const i1 = idx ? idx.getX(f * 3 + 1) : f * 3 + 1;
    const i2 = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;
    a.fromBufferAttribute(pos, i0).applyMatrix4(mw);
    b.fromBufferAttribute(pos, i1).applyMatrix4(mw);
    c.fromBufferAttribute(pos, i2).applyMatrix4(mw);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac);
    const dbl = n.length();
    if (dbl < 1e-8) continue;
    totalArea += dbl * 0.5;
    cumArea.push(totalArea);
    verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  if (!cumArea.length || totalArea < 0.5) return null;
  const count = Math.min(
    Math.max(1, Math.round(density * totalArea)),
    maxCount
  );
  const im = new THREE.InstancedMesh(
    makeFlowerGeometry(),
    makeFlowerMaterial(u),
    count
  );
  im.name = FLOWER_NAME;
  im.castShadow = false;
  im.receiveShadow = false;
  im.frustumCulled = false;
  im.userData.grassField = true;
  im.userData.physLayer = 'IgnoreRaycast';
  const rng = seededLcg(
    (Math.abs(Math.round(totalArea * 911)) || 2) ^ 0x9e3779b9
  );
  const dummy = new THREE.Object3D();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = rng() * totalArea;
    let lo = 0;
    let hi = cumArea.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumArea[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const t = lo * 9;
    let uu = rng();
    let vv = rng();
    if (uu + vv > 1) {
      uu = 1 - uu;
      vv = 1 - vv;
    }
    const w = 1 - uu - vv;
    p.set(
      verts[t] * w + verts[t + 3] * uu + verts[t + 6] * vv,
      verts[t + 1] * w + verts[t + 4] * uu + verts[t + 7] * vv,
      verts[t + 2] * w + verts[t + 5] * uu + verts[t + 8] * vv
    );
    dummy.position.copy(p);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    const s = 0.85 + rng() * 0.5;
    dummy.scale.set(s, 0.7 + rng() * 0.5, s);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return im;
}

function tintFoliage(root: THREE.Object3D, u: FieldU) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.material) return;
    const s = `${m.name} ${m.userData?.harvestKind || ''}`.toLowerCase();
    if (!/leaf|pine|foliage|canopy|needles|bush|frond/.test(s)) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      const lamb = mat as THREE.MeshLambertMaterial;
      if (!lamb.isMaterial) continue;
      lamb.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u);
        shader.fragmentShader =
          `uniform vec3 uLeafBottom; uniform vec3 uLeafTop; uniform float uBrightness;\n` +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          `float _lt = clamp(diffuse.g, 0.0, 1.0);
 vec3 _leaf = mix(uLeafBottom, uLeafTop, _lt) * uBrightness;
 vec4 diffuseColor = vec4(_leaf, opacity);`
        );
      };
      lamb.needsUpdate = true;
    }
  });
}

type Field = { root: THREE.Object3D; u: FieldU };
const fields: Field[] = [];

export function disposeGrassField(root: THREE.Object3D) {
  const doomed: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (
      o.userData?.grassField ||
      o.name === GRASS_NAME ||
      o.name === FLOWER_NAME
    )
      doomed.push(o);
  });
  for (const o of doomed) {
    o.removeFromParent();
    const m = o as THREE.InstancedMesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mat) => mat?.dispose?.());
  }
  for (let i = fields.length - 1; i >= 0; i--) {
    if (fields[i].root === root || !fields[i].root.parent) fields.splice(i, 1);
  }
}

function collectRocks(root: THREE.Object3D): THREE.Vector4[] {
  const out: THREE.Vector4[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const s = `${m.name} ${m.userData?.harvestKind || ''}`.toLowerCase();
    if (
      !/rock|stone|boulder|cliff/.test(s) &&
      m.userData?.harvestKind !== 'stone'
    )
      return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    const bs = m.geometry.boundingSphere;
    if (!bs) return;
    const center = bs.center.clone().applyMatrix4(m.matrixWorld);
    const sc = new THREE.Vector3().setFromMatrixScale(m.matrixWorld);
    const radius =
      bs.radius * Math.max(Math.abs(sc.x), Math.abs(sc.y), Math.abs(sc.z));
    out.push(
      new THREE.Vector4(center.x, center.y, center.z, Math.max(radius, 0.4))
    );
  });
  return out;
}

/** Bind GrassField onto an existing terrain root. Seafloor = no blades. */
export function bindGrassField(
  root: THREE.Object3D,
  look: TerrainLookId
): number {
  disposeGrassField(root);
  if (look === 'seafloor') return 0;
  root.updateMatrixWorld(true);
  const grounds: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    if (
      skipMesh(m) ||
      m.userData.grassField ||
      m.name === GRASS_NAME ||
      m.name === FLOWER_NAME
    )
      return;
    if (m.userData.isTerrainMesh || m.userData.isTerrain || m === root)
      grounds.push(m);
  });
  if (!grounds.length) {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry && !skipMesh(m) && !m.userData.grassField)
        grounds.push(m);
    });
  }
  if (!grounds.length) return 0;
  const u = makeUniforms(look);
  const rocks = collectRocks(root);
  const slots = u.uRocks.value as THREE.Vector4[];
  const nR = Math.min(rocks.length, MAX_ROCKS);
  for (let i = 0; i < nR; i++) slots[i].copy(rocks[i]);
  u.uRockCount.value = nR;
  const density = look === 'mountain' ? 0.45 : 0.9;
  const maxEach = look === 'mountain' ? 5000 : 8000;
  const minLen = look === 'mountain' ? 0.08 : 0.15;
  const maxLen = look === 'mountain' ? 0.16 : 0.26;
  let blades = 0;
  let budget = maxEach;
  for (const g of grounds) {
    if (budget < 8) break;
    const src = (
      Array.isArray(g.material) ? g.material[0] : g.material
    ) as THREE.MeshStandardMaterial;
    g.material = makeGroundMaterial(u, src?.color);
    g.receiveShadow = true;
    const im = scatterBlades(g, u, density, budget, minLen, maxLen);
    if (!im) continue;
    root.add(im);
    budget -= im.count;
    blades += im.count;
    const fl = scatterFlowers(
      g,
      u,
      look === 'mountain' ? 0.06 : 0.14,
      look === 'mountain' ? 400 : 1200
    );
    if (fl) root.add(fl);
  }
  tintFoliage(root, u);
  fields.push({ root, u });
  root.userData.grassFieldBound = look;
  return blades;
}

export function applyGrassPreset(season: GrassSeasonId) {
  const autumn = season === 'autumn';
  for (const f of fields) {
    const setC = (key: string, hex: string) => {
      const u = f.u[key];
      if (u?.value instanceof THREE.Color) u.value.set(hex);
    };
    if (autumn) {
      setC('uGrassBottom', '#7e8005');
      setC('uGrassTop', '#d2db18');
      setC('uDirtColor', '#e2b329');
      setC('uGndVarColor', '#ffc866');
      setC('uTransColor', '#f8f454');
      setC('uColorR', '#f0b429');
      setC('uColorG', '#ffd978');
      setC('uColorB', '#c44a18');
      setC('uLeafBottom', '#ffaf36');
      setC('uLeafTop', '#ff1910');
      f.u.uDirtCoverage.value = 0.48;
      f.u.uDirtCut.value = 0.7;
      f.u.uDirtBlend.value = 1;
      f.u.uTransStrength.value = 3;
    } else {
      setC('uGrassBottom', '#4f7c13');
      setC('uGrassTop', '#79a01c');
      setC('uDirtColor', '#ac956c');
      setC('uGndVarColor', '#c4a77d');
      setC('uTransColor', '#c1e54d');
      setC('uColorR', '#f2d15a');
      setC('uColorG', '#fff1a8');
      setC('uColorB', '#e87a3a');
      setC('uLeafBottom', '#1c3b23');
      setC('uLeafTop', '#5c8338');
      f.u.uDirtCoverage.value = 0.41;
      f.u.uDirtCut.value = 1;
      f.u.uDirtBlend.value = 0.8;
      f.u.uTransStrength.value = 2.5;
    }
  }
}

const _sunPos = new THREE.Vector3();
const _sunTgt = new THREE.Vector3();
let _sunCached: THREE.DirectionalLight | undefined;

export function tickGrassField(dt: number, scene: THREE.Scene) {
  let sun = peekPlayQuery()?.sun || _sunCached;
  if (!sun || !sun.parent) {
    sun = undefined;
    scene.traverse((o) => {
      if (sun) return;
      const d = o as THREE.DirectionalLight;
      if (d.isDirectionalLight) sun = d;
    });
    _sunCached = sun;
  }
  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i];
    if (!f.root.parent) {
      fields.splice(i, 1);
      continue;
    }
    f.u.uTime.value = (Number(f.u.uTime.value) + dt) % 3600;
    (f.u.uWindDir.value as THREE.Vector2)
      .set(WORLD_WIND.dirX, WORLD_WIND.dirZ)
      .normalize();
    if (sun) {
      sun.getWorldPosition(_sunPos);
      sun.target.getWorldPosition(_sunTgt);
      (f.u.uSunDir.value as THREE.Vector3)
        .subVectors(_sunPos, _sunTgt)
        .normalize();
      (f.u.uSunColor.value as THREE.Color)
        .copy(sun.color)
        .multiplyScalar(sun.intensity);
    }
  }
}

export function isGrassFieldObject(o: THREE.Object3D): boolean {
  return Boolean(
    o.userData?.grassField || o.name === GRASS_NAME || o.name === FLOWER_NAME
  );
}
