import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import wasm from 'vite-plugin-wasm';
import { resolve } from 'path';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ANIM_PACKS_DISK = 'D:/Games/Models/_anim_packs';
const WARLORDS_LIBRARY_DISK = 'D:/Games/Models/erawarlords';

function serveAnimPacksDisk() {
  return {
    name: 'serve-anim-packs-disk',
    configureServer(server: {
      middlewares: {
        use: (fn: (req: { url?: string }, res: any, next: () => void) => void) => void;
      };
    }) {
      server.middlewares.use((req, res, next) => {
        const url = String(req.url || '').split('?')[0];
        if (url === '/api/anim-packs' || url === '/api/anim-packs/') {
          const idx = join(ANIM_PACKS_DISK, 'retargeted', 'index.json');
          if (!existsSync(idx)) {
            res.statusCode = 404;
            res.end('{"files":[]}');
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          createReadStream(idx).pipe(res);
          return;
        }
        if (url.startsWith('/warlords-library/')) {
          const rel = decodeURIComponent(url.slice('/warlords-library/'.length));
          if (!rel || rel.includes('..')) {
            res.statusCode = 403;
            res.end();
            return;
          }
          const file = join(WARLORDS_LIBRARY_DISK, rel);
          if (!existsSync(file) || !statSync(file).isFile()) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.setHeader(
            'Content-Type',
            file.endsWith('.json') ? 'application/json' : 'application/octet-stream'
          );
          createReadStream(file).pipe(res);
          return;
        }
        if (!url.startsWith('/anim-packs/')) {
          next();
          return;
        }
        const rel = decodeURIComponent(url.slice('/anim-packs/'.length));
        if (!rel || rel.includes('..')) {
          res.statusCode = 403;
          res.end();
          return;
        }
        const file = join(ANIM_PACKS_DISK, rel);
        if (!existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader(
          'Content-Type',
          file.endsWith('.json') ? 'application/json' : 'application/octet-stream'
        );
        createReadStream(file).pipe(res);
      });
    },
  };
}

// Rapier WASM via vite-plugin-wasm. Native TLA is es2022 (Vite 6.4 + tla plugin SWC crash).
// Vercel gzip/brotli is the HTTP compressor — do not add a second plugin.
export default defineConfig((mode) => {
 const env = loadEnv(mode.mode, process.cwd());
 const base = env.VITE_APP_BASE_URL || '/';
 const outDir = env.VITE_APP_BUILD_NAME || 'dist';
 return {
 plugins: [serveAnimPacksDisk(), wasm(), vue(), vueJsx()],
 resolve: {
 alias: {
 '@': resolve(__dirname, 'src'),
 vue: 'vue/dist/vue.esm-bundler.js',
 '@grudge-studio/core': resolve(__dirname, 'vendor/@grudge-studio/core/lib/index.js'),
 '@grudge-studio/asset-resolver': resolve(
 __dirname,
 'vendor/@grudge-studio/asset-resolver/lib/index.js'
 ),
 '@grudge-studio/assets': resolve(__dirname, 'vendor/@grudge-studio/assets/lib/index.js'),
 '@grudge-studio/animator': resolve(__dirname, 'vendor/@grudge-studio/animator/lib/index.js'),
 '@grudge-studio/engine': resolve(__dirname, 'vendor/@grudge-studio/engine/lib/index.js'),
 },
 dedupe: ['three', '@dimforge/rapier3d-compat'],
 },
 server: {
 host: '0.0.0.0',
 open: true,
 port: 1000,
 watch: {
 ignored: ['**/node_modules/**', '**/dist/**', '**/style/**'],
 },
 hmr: {
 overlay: false,
 },
 fs: {
 strict: false,
 allow: [
 resolve(__dirname),
 'D:/Games/Models/_anim_packs',
 'D:/Games/Models/erawarlords',
 ],
 },
 },
 assetsInclude: ['**/*.hdr', '**/*.glb', '**/*.wasm'],
 optimizeDeps: {
 exclude: ['@dimforge/rapier3d-compat'],
 },
 worker: {
 format: 'es',
 plugins: () => [wasm()],
 },
 base,
 build: {
 assetsDir: 'static',
 emptyOutDir: true,
 minify: 'esbuild',
 target: 'es2022',
 sourcemap: false,
 chunkSizeWarningLimit: 2000,
 reportCompressedSize: false,
 outDir,
 rollupOptions: {
 input: {
 index: resolve(__dirname, 'index.html'),
 preview: resolve(__dirname, 'preview.html'),
 },
 output: {
 chunkFileNames: 'js/[name]-[hash].js',
 entryFileNames: 'js/[name]-[hash].js',
 assetFileNames: 'assets/[name]-[hash].[ext]',
 manualChunks(id) {
 if (id.includes('node_modules/three')) return 'three';
 if (id.includes('@dimforge/rapier3d-compat')) return 'rapier';
 if (id.includes('node_modules/yuka')) return 'yuka';
 if (id.includes('three-mesh-bvh')) return 'bvh';
 if (id.includes('three-pathfinding')) return 'pathfinding';
 if (id.includes('element-plus') || id.includes('@element-plus')) return 'ui';
 return undefined;
 },
 },
 },
 },
 };
});
