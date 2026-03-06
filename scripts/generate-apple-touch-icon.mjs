#!/usr/bin/env node
/**
 * Genera apple-touch-icon.png desde el logo de Home.jsx.
 * Fuente: src/assets/d2ae993d3_WaitMe.png
 * Salida: public/apple-touch-icon.png
 *
 * ESTRATEGIA (ver docs/AUDITORIA_FINAL_ICONO_IOS.md):
 * - Extraer SOLO el cuadrado cristal (badge con flechas + cuadrado blanco)
 * - Sin canvas negro extra, sin marco negro alrededor
 * - Badge ocupa 96-98% del área (172-176px) con margen mínimo para Apple
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcLogo = path.join(root, 'src/assets/d2ae993d3_WaitMe.png');
const outPath = path.join(root, 'public/apple-touch-icon.png');

const SIZE = 180;

// Recorte exacto del cuadrado cristal en el asset 1024x1024:
// El badge está centrado en la mitad superior. Crop ajustado para capturar
// solo el badge sin el marco negro exterior del asset.
const SRC_W = 1024;
const CROP_SIZE = 480; // cuadrado que contiene solo el badge (sin recortar)
const CROP_LEFT = Math.floor((SRC_W - CROP_SIZE) / 2); // 272
const CROP_TOP = 40; // badge empieza ~40px desde arriba

async function main() {
  // Extraer solo el cuadrado cristal y escalar a 180x180.
  // SIN canvas negro extra: el badge ES el icono, ocupa todo el frame.
  // Margen mínimo: el badge tiene bordes redondeados; al escalar a 180x180
  // el contenido útil queda ~96-98% (esquinas redondeadas del badge).
  await sharp(srcLogo)
    .extract({ left: CROP_LEFT, top: CROP_TOP, width: CROP_SIZE, height: CROP_SIZE })
    .resize(SIZE, SIZE, { fit: 'fill' })
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
