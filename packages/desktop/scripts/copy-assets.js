import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopDir = path.resolve(__dirname, '..');

// 1. Resolve source icon.png
const candidatePngSources = [
  path.join(desktopDir, 'resources', 'icon.png'),
  path.join(desktopDir, 'build', 'icon.png'),
  path.resolve(desktopDir, '../../docs/site/assets/mascot.png'),
];

const sourcePng = candidatePngSources.find(p => fs.existsSync(p));
if (!sourcePng) {
  console.error('[copy:assets] FATAL: Could not locate icon.png in candidate locations:', candidatePngSources);
  process.exit(1);
}

// 2. Resolve source icon.ico
const candidateIcoSources = [
  path.join(desktopDir, 'resources', 'icon.ico'),
  path.join(desktopDir, 'build', 'icon.ico'),
];
const sourceIco = candidateIcoSources.find(p => fs.existsSync(p));

// 3. Ensure destination directories exist
const targetDirs = [
  path.join(desktopDir, 'dist'),
  path.join(desktopDir, 'dist', 'main'),
  path.join(desktopDir, 'build'),
  path.join(desktopDir, 'resources'),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 4. Copy icon.png to all target destinations
const pngDestinations = [
  path.join(desktopDir, 'dist', 'icon.png'),
  path.join(desktopDir, 'dist', 'main', 'icon.png'),
  path.join(desktopDir, 'build', 'icon.png'),
  path.join(desktopDir, 'resources', 'icon.png'),
];

for (const dest of pngDestinations) {
  if (path.resolve(sourcePng) !== path.resolve(dest)) {
    fs.copyFileSync(sourcePng, dest);
  }
}
console.log(`[copy:assets] Successfully synchronized icon.png from ${path.relative(desktopDir, sourcePng)}`);

// 5. Copy icon.ico to all target destinations
if (sourceIco) {
  const icoDestinations = [
    path.join(desktopDir, 'dist', 'icon.ico'),
    path.join(desktopDir, 'build', 'icon.ico'),
    path.join(desktopDir, 'resources', 'icon.ico'),
  ];
  for (const dest of icoDestinations) {
    if (path.resolve(sourceIco) !== path.resolve(dest)) {
      fs.copyFileSync(sourceIco, dest);
    }
  }
  console.log(`[copy:assets] Successfully synchronized icon.ico from ${path.relative(desktopDir, sourceIco)}`);
} else {
  console.warn('[copy:assets] Warning: icon.ico not found, skipping ICO copy');
}
