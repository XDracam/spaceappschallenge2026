import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// One app, four station views (D-015). The deploy workflow reads BASE_PATH
// from GitHub Pages (custom domain: '/'; project URL: '/<repo>/').
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [preact()],
  server: { port: 5173, strictPort: true },
});
