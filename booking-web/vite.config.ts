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
  resolve: {
    alias: {
      // Pastikan mengarah ke folder src yang benar
      '@': path.resolve(__dirname, './src'),

      // Alias backend Anda
      '@backend': path.resolve(__dirname, '../e-office-api-v2/src'),
    },
  },
});
