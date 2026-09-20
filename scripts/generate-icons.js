import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'public', 'logo.svg');
const publicDir = path.join(projectRoot, 'public');

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. 512x512 App Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo-512.png'));
  console.log('✓ Created logo-512.png');

  // 2. 192x192 App Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'logo-192.png'));
  console.log('✓ Created logo-192.png');

  // 3. Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 4. Favicon 64x64
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created favicon.png');

  // 5. OpenGraph Image for WhatsApp / Social (1200x630 slate-900 background with AquaCon green logo centered)
  const logoResized = await sharp(svgBuffer)
    .resize(360, 360)
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a slate-900
    }
  })
    .composite([
      {
        input: logoResized,
        top: 135,
        left: 420
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ Created og-image.png');
}

generate().catch(console.error);
