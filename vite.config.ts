import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Las librerías de exportación/importación se cargan bajo demanda (dynamic import)
    chunkSizeWarningLimit: 700,
  },
});
