#!/usr/bin/env node
/**
 * Genera apple-touch-icon.png desde el logo de Home.jsx.
 * Fuente: src/assets/d2ae993d3_WaitMe.png
 * Salida: public/apple-touch-icon.png
 *
 * ESTRATEGIA (ver docs/AUDITORIA_ICONO_IOS_PWA.md):
 * El asset contiene icono (arriba ~55%) + texto (abajo ~45%).
 * El logo completo no escala bien a 180x180 (texto ilegible).
 * Usamos SOLO la parte cuadrada del icono (efecto cristal) que el usuario
 * ve en Home, ocupando el 100% del área útil.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcLogo = path.join(root, 'src/assets/d2ae993d3_WaitMe.png');
const outPath = path.join(root, 'public/apple-touch-icon.png');

const SIZE = 180;

// Región del icono cuadrado en el asset 1024x1024:
// top 55%, centrado horizontalmente
const SRC_SIZE = 1024;
const ICON_HEIGHT_RATIO = 0.55;
const iconHeight = Math.floor(SRC_SIZE * ICON_HEIGHT_RATIO); // 563
const iconSize = Math.min(SRC_SIZE, iconHeight);             // 563
const left = Math.floor((SRC_SIZE - iconSize) / 2);          // 230

async function main() {
  // 1. Extraer solo la región del icono (cuadrado con efecto cristal)
  const iconBuffer = await sharp(srcLogo)
    .extract({ left, top: 0, width: iconSize, height: iconSize })
    .resize(SIZE, SIZE, { fit: 'fill' })  // fill = escala exacta 180x180
    .ensureAlpha()
    .toBuffer();

  // 2. Componer sobre fondo negro (sin padding; icono ocupa 100%)
  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([{ input: iconBuffer, left: 0, top: 0 }])
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
