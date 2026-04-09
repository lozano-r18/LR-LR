import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // In local dev, Vite doesn't run Vercel serverless functions.
        // This proxy forwards /api/feed directly to the HabiHub XML feed CDN.
        '/api/feed': {
          target: 'https://medianewbuild.com',
          changeOrigin: true,
          rewrite: () => '/file/hh-media-bucket/agents/781e7ba1-700a-427f-9cab-aeb1350fa1dc/feed_sol.xml',
        },
      },
    },
  };
});
