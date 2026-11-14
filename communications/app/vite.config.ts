import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Port 5175 so comms runs next to the mission planner (5173) and science (5174).
// The shared event system lives in ../../shared and must be served too.
export default defineConfig({
  plugins: [preact()],
  server: { port: 5175, strictPort: true, fs: { allow: ['..', '../../shared'] } },
});
