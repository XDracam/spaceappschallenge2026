// Shared optional media tooling; uses the repository's declared Playwright dependency.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
export const { chromium } = createRequire(new URL('../playtest/package.json', import.meta.url))('playwright-core');
export function prepareCapture() {
  const output = process.env.CAPTURE_OUTPUT
    ? path.resolve(process.env.CAPTURE_OUTPUT)
    : fs.mkdtempSync(path.join(os.tmpdir(), 't-minus-capture-'));
  if (process.env.CAPTURE_OUTPUT) fs.mkdirSync(output); // Refuse to overwrite an existing capture.
  fs.mkdirSync(path.join(output, 'assets'));
  fs.mkdirSync(path.join(output, 'raw'));
  console.log(`New capture directory: ${output}`);
  const browserOptions = process.env.VIDEO_BROWSER_EXECUTABLE
    ? { executablePath: process.env.VIDEO_BROWSER_EXECUTABLE }
    : {};
  return { output: output + path.sep, url: process.env.GAME_URL ?? 'http://127.0.0.1:5199/', browserOptions };
}
