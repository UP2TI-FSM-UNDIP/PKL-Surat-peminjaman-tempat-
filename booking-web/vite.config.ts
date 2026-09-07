import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { tanstackRouter } from '@tanstack/router-plugin/vite'; // <--- Import ini
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [tanstackRouter(), react(), tailwindcss(), tsconfigPaths()],
  base: '/peminjaman-ruang/',
  server: {
    port: 20081,
    host: true,
    allowedHosts: ['apps-fsm.undip.ac.id', 'localhost', '10.137.58.124'],
  },
  optimizeDeps: {
    esbuildOptions: {
      supported: {
        'top-level-await': true,
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  resolve: {
    alias: {
      // Pastikan mengarah ke folder src yang benar
      '@': path.resolve(__dirname, './src'),

      // Alias backend Anda
      '@backend': path.resolve(__dirname, '../e-office-api-v2/src'),
    },
  },
});
