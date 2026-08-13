import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig((mode) => {
  const { VITE_APP_BASE_URL, VITE_APP_BUILD_NAME } = loadEnv(mode.mode, process.cwd());
  return {
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        vue: 'vue/dist/vue.esm-bundler.js',
      },
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
      },
    },
    assetsInclude: ['**/*.hdr', '**/*.glb'],
    base: VITE_APP_BASE_URL,
    build: {
      assetsDir: 'static',
      emptyOutDir: true,
      minify: 'esbuild',
      target: 'es2015',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: false,
      outDir: VITE_APP_BUILD_NAME,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          preview: resolve(__dirname, 'preview.html'),
        },
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
});
