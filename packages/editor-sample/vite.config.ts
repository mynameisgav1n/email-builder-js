import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/email-builder-js/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        myemails: resolve(__dirname, 'myemails.html'),
        templates: resolve(__dirname, 'templates.html'),
      },
    },
  },
});
