#!/usr/bin/env node
/**
 * Genera apple-touch-icon.png desde el logo de Home.jsx.
 * Fuente: src/assets/d2ae993d3_WaitMe.png
 * Salida: public/apple-touch-icon.png
 *
 * ESTRATEGIA: Trim + crop cuadrado centrado, resize directo 180x180.
 * Sin canvas, sin composite, sin padding negro.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcLogo = path.join(root, 'src/assets/d2ae993d3_WaitMe.png');
const outPath = path.join(root, 'public/apple-touch-icon.png');

const SIZE = 180;

// Región que contiene el badge: top 700px (badge + margen, sin texto)
const BADGE_REGION_HEIGHT = 700;

async function main() {
  // 1. Extraer región del badge (top 700px)
  const topRegion = await sharp(srcLogo)
    .extract({ left: 0, top: 0, width: 1024, height: BADGE_REGION_HEIGHT })
    .toBuffer();

  // 2. Trim: bounding box real del badge (elimina negro exterior)
  const trimmed = await sharp(topRegion)
    .trim({ threshold: 20 })
    .toBuffer({ resolveWithObject: true });

  const tw = trimmed.info.width;
  const th = trimmed.info.height;

  // 3. Crop CUADRADO centrado del icono completo
  const sq = Math.min(tw, th);
  const cropLeft = Math.floor((tw - sq) / 2);
  const cropTop = Math.floor((th - sq) / 2);

  // 4. Resize directo a 180x180 — SIN canvas, SIN composite, SIN offset
  await sharp(trimmed.data)
    .extract({ left: cropLeft, top: cropTop, width: sq, height: sq })
    .resize(SIZE, SIZE, { fit: 'fill' })
    .removeAlpha()
    .png()
    .toFile(outPath);

  console.log('OK:', outPath);
  console.log('Bounding box (trimmed):', tw, 'x', th);
  console.log('Square crop:', sq, 'x', sq);
  const meta = await sharp(outPath).metadata();
  console.log('Output:', meta.width, 'x', meta.height, '| no padding');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
