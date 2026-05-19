import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { devvit } from '@devvit/start/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwind(), devvit()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
    },
  },
});
