#!/usr/bin/env node
/**
 * Genera apple-touch-icon.png desde el logo exacto de Home.jsx.
 * Fuente: src/assets/d2ae993d3_WaitMe.png
 * Salida: public/apple-touch-icon.png
 * - 180x180
 * - Fondo negro #000000
 * - Logo ~92% del área
 * - Sin transparencia
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcLogo = path.join(root, 'src/assets/d2ae993d3_WaitMe.png');
const outPath = path.join(root, 'public/apple-touch-icon.png');

const SIZE = 180;
const LOGO_RATIO = 0.92; // logo ocupa ~92% del área
const logoSize = Math.round(SIZE * LOGO_RATIO);

async function main() {
  const logo = await sharp(srcLogo)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .ensureAlpha()
    .toBuffer();

  const padding = (SIZE - logoSize) / 2;

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([{ input: logo, left: Math.round(padding), top: Math.round(padding) }])
    .removeAlpha()
    .png()
    .toFile(outPath);

  console.log('OK:', outPath);
  const meta = await sharp(outPath).metadata();
  console.log('Size:', meta.width, 'x', meta.height);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
