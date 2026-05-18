import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');
const nextStaticSrc = path.join(root, '.next', 'static');
const nextStaticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(root, 'public');
const publicDest = path.join(standaloneDir, 'public');

function ensureDirExists(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`${label} not found: ${dirPath}`);
  }
}

function copyIfExists(src, dest, label) {
  if (!fs.existsSync(src)) {
    console.log(`[prepare-standalone] skip ${label}: source not found`);
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`[prepare-standalone] copied ${label}`);
}

try {
  ensureDirExists(standaloneDir, 'Standalone output');
  ensureDirExists(nextStaticSrc, 'Next static assets');

  copyIfExists(nextStaticSrc, nextStaticDest, '.next/static');
  copyIfExists(publicSrc, publicDest, 'public');

  console.log('[prepare-standalone] assets are ready');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[prepare-standalone] failed: ${message}`);
  process.exit(1);
}
