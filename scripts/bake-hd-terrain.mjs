/**
 * Node bake for ThreeFlow HD terrain packs.
 *
 * Drop editor exports into deploys/hd-terrain/in/:
 *   hd-{target}.raw.glb
 *   hd-{target}.deploy.json
 *
 * Then: pnpm bake:hd-terrain
 *
 * Prefers ObjectStore grudge-convert glb2glb (no --height on maps).
 * Falls back to npx @gltf-transform/cli draco.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inDir = join(root, 'deploys', 'hd-terrain', 'in');
const outDir = join(root, 'deploys', 'hd-terrain', 'out');

const CONVERT_CANDIDATES = [
  resolve(root, '..', 'ObjectStore', 'tools', 'grudge-convert', 'bin', 'grudge-convert.mjs'),
  resolve('F:/GitHub/ObjectStore/tools/grudge-convert/bin/grudge-convert.mjs'),
];

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
}

function bakeOne(rawGlb, destGlb) {
  mkdirSync(dirname(destGlb), { recursive: true });
  const convert = CONVERT_CANDIDATES.find((p) => existsSync(p));
  if (convert) {
    console.log('bake: grudge-convert glb2glb (no height fit)');
    if (run(process.execPath, [convert, 'glb2glb', rawGlb, '-o', destGlb, '--no-colliders'])) {
      return 'grudge-convert';
    }
  }
  console.log('bake: npx @gltf-transform/cli draco');
  if (run('npx', ['--yes', '@gltf-transform/cli', 'draco', rawGlb, destGlb, '--method', 'edgebreaker'])) {
    return 'gltf-transform-draco';
  }
  copyFileSync(rawGlb, destGlb);
  return 'copy-uncompressed';
}

mkdirSync(inDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const glbs = readdirSync(inDir).filter((f) => f.endsWith('.raw.glb'));
if (!glbs.length) {
  console.log(`No *.raw.glb in ${inDir}`);
  console.log('In ThreeFlow: Scene → HD terrain deploy pack, then move the two downloads here.');
  process.exit(0);
}

const index = [];
for (const file of glbs) {
  const id = file.replace(/^hd-/, '').replace(/\.raw\.glb$/, '');
  const jsonName = `hd-${id}.deploy.json`;
  const jsonPath = join(inDir, jsonName);
  const destDir = join(outDir, id);
  const destGlb = join(destDir, 'terrain.glb');
  const method = bakeOne(join(inDir, file), destGlb);
  let manifest = {
    target: { id },
    files: { rawGlb: file },
  };
  if (existsSync(jsonPath)) {
    manifest = JSON.parse(readFileSync(jsonPath, 'utf8'));
  }
  manifest.files = { ...(manifest.files || {}), rawGlb: file, bakedGlb: `out/${id}/terrain.glb` };
  manifest.bake = { method, at: new Date().toISOString() };
  writeFileSync(join(destDir, 'deploy.json'), JSON.stringify(manifest, null, 2));
  index.push({
    id,
    baked: `out/${id}/terrain.glb`,
    r2Key: manifest.r2Key,
    loadScreen: manifest.loadScreen,
    wrangler: manifest.wrangler,
  });
  console.log(`ok ${id} via ${method}`);
}

writeFileSync(join(outDir, 'index.json'), JSON.stringify({ version: 1, items: index }, null, 2));
console.log(`Wrote ${index.length} pack(s) to ${outDir}`);
console.log('Load screen: keep HelpersLoadScreen / ThreeFlow Loading up until the baked GLB HEAD is 200.');
