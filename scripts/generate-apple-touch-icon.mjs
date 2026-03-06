#!/usr/bin/env node
/**
 * Genera apple-touch-icon.png desde el logo de Home.jsx.
 * Fuente: src/assets/d2ae993d3_WaitMe.png
 * Salida: public/apple-touch-icon.png
 *
 * ESTRATEGIA: Detectar bounding box real del badge cristal con trim,
 * extraer cuadrado centrado (NO porcentaje vertical), escalar a 94-96%.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcLogo = path.join(root, 'src/assets/d2ae993d3_WaitMe.png');
const outPath = path.join(root, 'public/apple-touch-icon.png');

const SIZE = 180;
const BADGE_RATIO = 0.95; // badge ocupa ~95% (94-96%)
const badgeSize = Math.round(SIZE * BADGE_RATIO); // 171

// Región que contiene el badge: top 700px (badge + margen, sin texto)
const BADGE_REGION_HEIGHT = 700;

async function main() {
  // 1. Extraer región del badge (top 700px, sin usar % vertical fijo)
  const topRegion = await sharp(srcLogo)
    .extract({ left: 0, top: 0, width: 1024, height: BADGE_REGION_HEIGHT })
    .toBuffer();

  // 2. Trim: detectar bounding box real del badge (elimina negro exterior)
  const trimmed = await sharp(topRegion)
    .trim({ threshold: 20 })
    .toBuffer({ resolveWithObject: true });

  const tw = trimmed.info.width;
  const th = trimmed.info.height;

  // 3. Crop CUADRADO centrado del icono completo
  const sq = Math.min(tw, th);
  const cropLeft = Math.floor((tw - sq) / 2);
  const cropTop = Math.floor((th - sq) / 2);

  const badge = await sharp(trimmed.data)
    .extract({ left: cropLeft, top: cropTop, width: sq, height: sq })
    .resize(badgeSize, badgeSize, { fit: 'fill' })
    .ensureAlpha()
    .toBuffer();

  // 4. Componer sobre fondo negro, centrado
  const offset = Math.floor((SIZE - badgeSize) / 2);

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([{ input: badge, left: offset, top: offset }])
    .removeAlpha()
    .png()
    .toFile(outPath);

  console.log('OK:', outPath);
  console.log('Bounding box (trimmed):', tw, 'x', th);
  console.log('Square crop:', sq, 'x', sq, '| offset:', cropLeft, cropTop);
  const meta = await sharp(outPath).metadata();
  console.log('Output:', meta.width, 'x', meta.height);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
