import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Stable across checkouts; clients must replay the same rules and authored content. */
function buildIdentity(): string {
  const hash = createHash('sha256');
  const add = (file: string) => {
    hash.update(relative(root, file).split('\\').join('/'));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  };
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) add(file);
    }
  };
  walk(join(root, 'src'));
  for (const file of ['package-lock.json', 'index.html', 'vite.config.ts']) add(join(root, file));
  return hash.digest('hex').slice(0, 20);
}

// One app, four station views (D-015). The deploy workflow reads BASE_PATH
// from GitHub Pages (custom domain: '/'; project URL: '/<repo>/').
export default defineConfig(({ command }) => ({
  base: process.env.BASE_PATH ?? '/',
  plugins: [preact()],
  define: { __MC_BUILD_ID__: JSON.stringify(command === 'build' ? buildIdentity() : 'development') },
  server: { port: 5173, strictPort: true },
}));
