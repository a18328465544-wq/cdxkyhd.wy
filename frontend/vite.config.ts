import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001';

  return {
    // The root .env is shared by the backend and frontend build; only VITE_ values are exposed to the browser.
    envDir: path.resolve(__dirname, '..'),
    plugins: [react(), tailwindcss()],
    build: { manifest: true },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
