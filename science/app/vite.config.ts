import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Port 5174 so the science app can run next to the mission planner (5173).
export default defineConfig({
  plugins: [preact()],
  server: { port: 5174, strictPort: true },
});
