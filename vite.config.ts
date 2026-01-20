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
      // 设置最终构建的浏览器兼容目标
      target: 'es2015',
      // 构建后是否生成 source map 文件
      sourcemap: false,
      //  chunk 大小警告的限制（以 kbs 为单位）
      chunkSizeWarningLimit: 2000,
      // 启用/禁用 gzip 压缩大小报告
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
