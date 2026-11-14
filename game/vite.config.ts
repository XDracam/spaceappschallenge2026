import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// One app, four station views (D-015). GitHub Pages serves it under
// /<repo>/, so the deploy workflow sets BASE_PATH; locally it's '/'.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [preact()],
  server: { port: 5173, strictPort: true },
});
