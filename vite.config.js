import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/api-route-video/**'],
    },
    proxy: {
      '/api': {
        target: 'https://apiroute.subrouter.ai',
        changeOrigin: true,
      },
      '/v1': {
        target: 'https://apiroute.subrouter.ai',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
