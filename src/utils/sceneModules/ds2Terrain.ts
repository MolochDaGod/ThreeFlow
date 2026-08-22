import * as THREE from 'three';

/**
 * Hard Road DS2 terrain — https://hardroad.xyz/demos/ds2-terrain.html
 * CPU port of sculpt + stream-power + hydraulic droplets + thermal.
 * Editor mesh is 256² (demo render is 1536²). World units = metres.
 */

export type Ds2PresetId = 'mountains' | 'crags' | 'zone';
export type Ds2Quality = 'edit' | 'deploy';

export interface Ds2Params {
  seed: number;
  mountainH: number;
  washW: number;
  kdt: number;
  fluvIters: number;
  uplift: number;
  inertia: number;
  capacity: number;
  droplets: number;
  world: number;
  sim: number;
  mesh: number;
}

export const DS2_SOURCE = 'https://hardroad.xyz/demos/ds2-terrain.html';

/** Editor = viewport-safe. Deploy = denser mesh for Node/Draco sector bake. */
export function paramsForQuality(
  base: Ds2Params,
  quality: Ds2Quality
): Ds2Params {
  if (quality === 'edit') return { ...base };
  return {
    ...base,
    sim: Math.min(256, base.sim + 64),
    mesh: 384,
    fluvIters: base.fluvIters + 10,
    droplets: Math.round(base.droplets * 1.35),
  };
}

export const DS2_PRESETS: Record<Ds2PresetId, Ds2Params> = {
  mountains: {
    seed: 0x44533254,
    mountainH: 96,
    washW: 1,
    kdt: 0.12,
    fluvIters: 22,
    uplift: 0.9,
    inertia: 0.05,
    capacity: 4,
    droplets: 36000,
    world: 400,
    sim: 192,
    mesh: 256,
  },
  crags: {
    seed: 0x43524147,
    mountainH: 118,
    washW: 0.72,
    kdt: 0.16,
    fluvIters: 26,
    uplift: 1.15,
    inertia: 0.04,
    capacity: 5,
    droplets: 42000,
    world: 400,
    sim: 192,
    mesh: 256,
  },
  zone: {
    seed: 0x5a4f4e45,
    mountainH: 48,
    washW: 1.4,
    kdt: 0.07,
    fluvIters: 16,
    uplift: 0.45,
    inertia: 0.08,
    capacity: 3.5,
    droplets: 28000,
    world: 420,
    sim: 160,
    mesh: 224,
  },
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

class Simplex {
  p: Uint8Array;
  grad = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  constructor(seed = 1) {
    let s = seed >>> 0;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = (rand() * (i + 1)) | 0;
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }
  noise(x: number, y: number) {
    const F2 = 0.36602540378;
    const G2 = 0.2113248654;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = this.grad[this.p[ii + this.p[jj]] & 7];
      t0 *= t0;
      n += t0 * t0 * (g[0] * x0 + g[1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = this.grad[this.p[ii + i1 + this.p[jj + j1]] & 7];
      t1 *= t1;
      n += t1 * t1 * (g[0] * x1 + g[1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = this.grad[this.p[ii + 1 + this.p[jj + 1]] & 7];
      t2 *= t2;
      n += t2 * t2 * (g[0] * x2 + g[1] * y2);
    }
    return 70 * n;
  }
}

function fbm(
  nz: Simplex,
  x: number,
  y: number,
  oct: number,
  lac = 2,
  gain = 0.5
) {
  let a = 1;
  let f = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += a * nz.noise(x * f, y * f);
    norm += a;
    a *= gain;
    f *= lac;
  }
  return sum / norm;
}
const fbm01 = (nz: Simplex, x: number, y: number, o: number) =>
  fbm(nz, x, y, o) * 0.5 + 0.5;

function ridged(nz: Simplex, x: number, y: number, oct: number) {
  let a = 0.55;
  let f = 1;
  let sum = 0;
  let norm = 0;
  let w = 1;
  for (let o = 0; o < oct; o++) {
    let n = 1 - Math.abs(nz.noise(x * f, y * f));
    n *= n;
    n *= w;
    w = Math.min(1, Math.max(0, n * 2));
    sum += n * a;
    norm += a;
    a *= 0.5;
    f *= 2.13;
  }
  return sum / norm;
}

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSampler(arr: Float32Array, n: number) {
  return (u: number, v: number) => {
    const x = clamp(u, 0, 1) * (n - 1.001);
    const y = clamp(v, 0, 1) * (n - 1.001);
    const xi = x | 0;
    const yi = y | 0;
    const fx = x - xi;
    const fy = y - yi;
    const i = yi * n + xi;
    return (
      arr[i] * (1 - fx) * (1 - fy) +
      arr[i + 1] * fx * (1 - fy) +
      arr[i + n] * (1 - fx) * fy +
      arr[i + n + 1] * fx * fy
    );
  };
}

function pathCX(v: number, pa: number, pb: number) {
  return 0.5 + 0.17 * Math.sin(v * 6 + pa) + 0.06 * Math.sin(v * 13 + pb);
}

function valleyMask(
  u: number,
  v: number,
  washW: number,
  pa: number,
  pb: number
) {
  return smooth(0.34 * washW, 0.06 * washW, Math.abs(u - pathCX(v, pa, pb)));
}

function sculpt(
  map: Float32Array,
  n: number,
  nz: Simplex,
  P: Ds2Params,
  pa: number,
  pb: number
) {
  for (let j = 0; j < n; j++) {
    const v = j / (n - 1);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const wx = fbm(nz, u * 3 + 17.3, v * 3 + 9.1, 4);
      const wy = fbm(nz, u * 3 + 5.7, v * 3 + 31.4, 4);
      const pu = u + 0.15 * wx;
      const pv = v + 0.15 * wy;
      const d = Math.abs(u - pathCX(v, pa, pb));
      const valley = smooth(0.34, 0.06, d);
      let mount = smooth(0.09, 0.34, d);
      mount *= 0.5 + 0.5 * fbm01(nz, pu * 2.2 + 40, pv * 2.2 + 7, 3);
      let h = Math.pow(fbm01(nz, pu * 4, pv * 4, 5), 1.5) * 30;
      let mh =
        Math.pow(ridged(nz, pu * 3.2 + 11, pv * 3.2 + 3, 5), 1.35) *
        P.mountainH *
        mount;
      const cl = clamp(
        (fbm01(nz, pu * 1.6 + 80, pv * 1.6 + 2, 3) - 0.45) * 2.2,
        0,
        1
      );
      if (cl > 0.01 && mh > 1) {
        const step = 14;
        const f = mh / step;
        const shelf =
          (Math.floor(f) + smooth(0.3, 0.7, f - Math.floor(f))) * step;
        mh = lerp(mh, shelf, cl * 0.75 * mount);
      }
      h += mh;
      const pathH =
        6 + 5 * (Math.sin(v * 3.1) + 1) + 0.25 * Math.sin(v * 7.7 + u * 2);
      h = lerp(h, pathH, Math.pow(valley, 1.6));
      h +=
        1.6 *
        fbm(nz, pu * 14, pv * 14, 3) *
        (1 - valley * 0.9) *
        (0.2 + 0.8 * mount);
      map[j * n + i] = h;
    }
  }
}

async function streamPower(
  map: Float32Array,
  n: number,
  h0: Float32Array,
  opts: { iters: number; kdt: number; mexp: number; uplift: number },
  progress: (f: number) => Promise<void>
) {
  const { iters, kdt, mexp, uplift } = opts;
  const N2 = n * n;
  const rcv = new Int32Array(N2);
  const rd = new Float32Array(N2);
  const A = new Float32Array(N2);
  const order = new Uint32Array(N2);
  const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
  const DY = [-1, -1, -1, 0, 0, 1, 1, 1];
  const DD = [Math.SQRT2, 1, Math.SQRT2, 1, 1, Math.SQRT2, 1, Math.SQRT2];
  const U = new Float32Array(N2);
  for (let i = 0; i < N2; i++) U[i] = clamp((h0[i] - 20) / 110, 0, 1) * uplift;
  const BUCKETS = 2048;
  const counts = new Uint32Array(BUCKETS + 1);

  for (let it = 0; it < iters; it++) {
    let minH = Infinity;
    let maxH = -Infinity;
    for (let i = 0; i < N2; i++) {
      const h = map[i];
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
    const hr = maxH - minH || 1;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const c = j * n + i;
        const h = map[c];
        let best = c;
        let bs = 0;
        let bd = 1;
        for (let k = 0; k < 8; k++) {
          const x = i + DX[k];
          const y = j + DY[k];
          if (x < 0 || x >= n || y < 0 || y >= n) continue;
          const nb = y * n + x;
          const sl = (h - map[nb]) / DD[k];
          if (sl > bs) {
            bs = sl;
            best = nb;
            bd = DD[k];
          }
        }
        rcv[c] = best;
        rd[c] = bd;
      }
    }
    counts.fill(0);
    for (let i = 0; i < N2; i++)
      counts[
        clamp((((maxH - map[i]) / hr) * (BUCKETS - 1)) | 0, 0, BUCKETS - 1) + 1
      ]++;
    for (let b = 0; b < BUCKETS; b++) counts[b + 1] += counts[b];
    for (let i = 0; i < N2; i++)
      order[
        counts[
          clamp((((maxH - map[i]) / hr) * (BUCKETS - 1)) | 0, 0, BUCKETS - 1)
        ]++
      ] = i;
    A.fill(1);
    for (let o = 0; o < N2; o++) {
      const c = order[o];
      if (rcv[c] !== c) A[rcv[c]] += A[c];
    }
    for (let o = N2 - 1; o >= 0; o--) {
      const c = order[o];
      const r = rcv[c];
      if (r !== c) {
        const F = (kdt * Math.pow(A[c], mexp)) / rd[c];
        map[c] = (map[c] + F * map[r]) / (1 + F);
      }
      map[c] += U[c];
    }
    if ((it & 3) === 3) await progress(it / iters);
  }
}

function thermal(
  map: Float32Array,
  n: number,
  iterations: number,
  talus: number,
  rate: number
) {
  const nb = [-1, 1, -n, n];
  for (let it = 0; it < iterations; it++) {
    for (let j = 1; j < n - 1; j++) {
      for (let i = 1; i < n - 1; i++) {
        const idx = j * n + i;
        const h = map[idx];
        let maxD = 0;
        let maxK = -1;
        for (let k = 0; k < 4; k++) {
          const d = h - map[idx + nb[k]];
          if (d > maxD) {
            maxD = d;
            maxK = k;
          }
        }
        if (maxD > talus && maxK >= 0) {
          const m = (maxD - talus) * rate * 0.5;
          map[idx] -= m;
          map[idx + nb[maxK]] += m;
        }
      }
    }
  }
}

function sampleHG(map: Float32Array, n: number, x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const i = yi * n + xi;
  const h00 = map[i];
  const h10 = map[i + 1];
  const h01 = map[i + n];
  const h11 = map[i + n + 1];
  return {
    gx: (h10 - h00) * (1 - fy) + (h11 - h01) * fy,
    gy: (h01 - h00) * (1 - fx) + (h11 - h10) * fx,
    h:
      h00 * (1 - fx) * (1 - fy) +
      h10 * fx * (1 - fy) +
      h01 * (1 - fx) * fy +
      h11 * fx * fy,
  };
}

function makeBrush(radius: number) {
  const offs: number[][] = [];
  const wts: number[] = [];
  let sum = 0;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= radius) {
        const w = 1 - d / radius;
        offs.push([x, y]);
        wts.push(w);
        sum += w;
      }
    }
  }
  return { offs, wts: wts.map((w) => w / sum) };
}

function erodeDroplet(
  map: Float32Array,
  n: number,
  world: number,
  inertia: number,
  capacity: number,
  brush: { offs: number[][]; wts: number[] },
  rand: () => number
) {
  let x = 1 + rand() * (n - 3);
  let y = 1 + rand() * (n - 3);
  let dx = 0;
  let dy = 0;
  let speed = 1;
  let water = 1;
  let sediment = 0;
  const cellS = world / (n - 1);
  for (let life = 0; life < 45; life++) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const { gx, gy, h } = sampleHG(map, n, x, y);
    dx = dx * inertia - gx * (1 - inertia);
    dy = dy * inertia - gy * (1 - inertia);
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-8) break;
    dx /= len;
    dy /= len;
    x += dx;
    y += dy;
    if (x < 1 || x >= n - 2 || y < 1 || y >= n - 2) break;
    const nh = sampleHG(map, n, x, y).h;
    const dh = nh - h;
    const cap = Math.max(-dh * speed * water * capacity, 0.01);
    if (sediment > cap || dh > 0) {
      const amt = dh > 0 ? Math.min(dh, sediment) : (sediment - cap) * 0.3;
      sediment -= amt;
      const i = yi * n + xi;
      map[i] += amt * (1 - fx) * (1 - fy);
      map[i + 1] += amt * fx * (1 - fy);
      map[i + n] += amt * (1 - fx) * fy;
      map[i + n + 1] += amt * fx * fy;
    } else {
      const sTan = Math.sqrt(gx * gx + gy * gy) / cellS;
      const steep = smooth(0.839, 1.19, sTan);
      if (steep > 0.002) {
        const amt = Math.min((cap - sediment) * 0.3, -dh) * steep;
        for (let b = 0; b < brush.offs.length; b++) {
          const bx = xi + brush.offs[b][0];
          const by = yi + brush.offs[b][1];
          if (bx < 0 || bx >= n || by < 0 || by >= n) continue;
          const idx = by * n + bx;
          const take = Math.min(map[idx], amt * brush.wts[b]);
          map[idx] -= take;
          sediment += take;
        }
      }
    }
    speed = Math.sqrt(Math.max(0, speed * speed + dh * -4));
    water *= 0.988;
    if (water < 0.01) break;
  }
}

function imposeWash(
  map: Float32Array,
  n: number,
  washW: number,
  pa: number,
  pb: number
) {
  for (let j = 0; j < n; j++) {
    const v = j / (n - 1);
    const pH = 6 + 5 * (Math.sin(v * 3.1) + 1);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const w = Math.pow(valleyMask(u, v, washW, pa, pb), 1.6) * 0.8;
      if (w > 0.01)
        map[j * n + i] = lerp(
          map[j * n + i],
          pH + 0.25 * Math.sin(v * 7.7 + u * 2),
          w
        );
    }
  }
}

export async function generateDs2Terrain(
  preset: Ds2PresetId,
  onProgress?: (pct: number, msg: string) => void,
  quality: Ds2Quality = 'edit',
  seedOverride?: number
): Promise<THREE.Group> {
  const P = paramsForQuality(DS2_PRESETS[preset], quality);
  if (seedOverride != null && Number.isFinite(seedOverride)) {
    P.seed = seedOverride >>> 0;
  }
  const report = async (pct: number, msg: string) => {
    onProgress?.(pct, msg);
    await tick();
  };
  await report(2, 'sculpting Hard Road terrain');
  const nz = new Simplex(P.seed);
  const rand = mulberry(P.seed ^ 0x9e3779b9);
  const pa = rand() * 6.283;
  const pb = rand() * 6.283;
  const simMap = new Float32Array(P.sim * P.sim);
  sculpt(simMap, P.sim, nz, P, pa, pb);

  await report(8, 'fluvial incision');
  await streamPower(
    simMap,
    P.sim,
    simMap.slice(),
    { iters: P.fluvIters, kdt: P.kdt, mexp: 0.5, uplift: P.uplift },
    async (f) => {
      await report(8 + 28 * f, `fluvial ${Math.round(f * 100)}%`);
    }
  );
  imposeWash(simMap, P.sim, P.washW, pa, pb);

  const brush = makeBrush(3);
  let done = 0;
  const chunk = 4000;
  while (done < P.droplets) {
    const n = Math.min(chunk, P.droplets - done);
    for (let k = 0; k < n; k++)
      erodeDroplet(simMap, P.sim, P.world, P.inertia, P.capacity, brush, rand);
    done += n;
    await report(
      38 + 22 * (done / P.droplets),
      `hydraulic ${Math.round((100 * done) / P.droplets)}%`
    );
  }

  await report(62, 'thermal settling');
  thermal(simMap, P.sim, 8, (P.world / (P.sim - 1)) * 2.14, 0.3);

  await report(70, 'upsample');
  const sample = makeSampler(simMap, P.sim);
  const hiMap = new Float32Array(P.mesh * P.mesh);
  for (let j = 0; j < P.mesh; j++) {
    const v = j / (P.mesh - 1);
    for (let i = 0; i < P.mesh; i++) {
      const u = i / (P.mesh - 1);
      hiMap[j * P.mesh + i] = sample(u, v);
    }
  }
  imposeWash(hiMap, P.mesh, P.washW, pa, pb);
  thermal(hiMap, P.mesh, 3, (P.world / (P.mesh - 1)) * 2.14, 0.28);

  await report(88, 'meshing');
  const geo = new THREE.PlaneGeometry(P.world, P.world, P.mesh - 1, P.mesh - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cell = P.world / (P.mesh - 1);
  const sand = new THREE.Color(0xc4b896);
  const grass = new THREE.Color(0x6a7848);
  const rock = new THREE.Color(0x8a8780);
  const peak = new THREE.Color(0xd4d0c6);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = hiMap[i] ?? 0;
    pos.setY(i, h);
    const x = i % P.mesh;
    const z = (i / P.mesh) | 0;
    let gx = 0;
    let gz = 0;
    if (x > 0 && x < P.mesh - 1 && z > 0 && z < P.mesh - 1) {
      gx = (hiMap[z * P.mesh + x + 1] - hiMap[z * P.mesh + x - 1]) / (2 * cell);
      gz =
        (hiMap[(z + 1) * P.mesh + x] - hiMap[(z - 1) * P.mesh + x]) /
        (2 * cell);
    }
    const slope = Math.sqrt(gx * gx + gz * gz);
    const u = x / (P.mesh - 1);
    const v = z / (P.mesh - 1);
    const wash = valleyMask(u, v, P.washW, pa, pb);
    tmp.copy(grass);
    tmp.lerp(sand, wash);
    tmp.lerp(rock, clamp(slope * 1.8, 0, 1));
    tmp.lerp(peak, clamp((h - P.mountainH * 0.55) / 40, 0, 1));
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
    flatShading: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `ds2-${preset}`;

  const root = new THREE.Group();
  root.name = `Hard Road ${preset}`;
  root.userData = {
    isTransformControls: true,
    hardroad: DS2_SOURCE,
    ds2Preset: preset,
    ds2Quality: quality,
    ds2Seed: P.seed,
    worldMeters: P.world,
    sim: P.sim,
    mesh: P.mesh,
  };
  root.add(mesh);
  await report(100, 'ready');
  return root;
}
