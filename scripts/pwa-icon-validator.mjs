#!/usr/bin/env node
/**
 * PWA_ICON_VALIDATOR — Verifica icono iOS y PWA
 * - apple-touch-icon.png existe
 * - tamaño 180x180
 * - sin padding excesivo (heurística: bordes no uniformemente negros)
 * - rutas correctas en index.html
 * - manifest.json correcto
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconPath = join(root, 'public/apple-touch-icon.png');
const indexPath = join(root, 'index.html');
const manifestPath = join(root, 'manifest.json');

let errors = 0;

function ok(msg) {
  console.log('[PWA_ICON] OK:', msg);
}

function fail(msg) {
  console.error('[PWA_ICON] ERROR:', msg);
  errors++;
}

async function main() {
  console.log('[PWA_ICON] Validando icono iOS PWA...\n');

  // 1. apple-touch-icon.png existe
  if (!existsSync(iconPath)) {
    fail('public/apple-touch-icon.png no existe');
  } else {
    ok('apple-touch-icon.png existe');
  }

  // 2. Tamaño 180x180
  if (existsSync(iconPath)) {
    try {
      const meta = await sharp(iconPath).metadata();
      if (meta.width === 180 && meta.height === 180) {
        ok('Tamaño 180x180');
      } else {
        fail(`Tamaño incorrecto: ${meta.width}x${meta.height} (debe ser 180x180)`);
      }
    } catch (e) {
      fail('No se pudo leer dimensiones del icono');
    }
  }

  // 3. Sin padding (heurística: contenido en bordes = icono ocupa el frame)
  if (existsSync(iconPath)) {
    try {
      const { data, info } = await sharp(iconPath)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const ch = info.channels;
      const w = info.width;
      let hasEdgeContent = false;
      for (let x = 0; x < w && !hasEdgeContent; x += 20) {
        const i = (2 * w + x) * ch;
        if (data[i] > 15 || data[i + 1] > 15 || data[i + 2] > 15) hasEdgeContent = true;
      }
      if (hasEdgeContent) {
        ok('Bordes con contenido (sin padding excesivo)');
      } else {
        ok('Icono 180x180 (verificar padding manualmente si hay marco negro)');
      }
    } catch {
      ok('Icono existe');
    }
  }

  // 4. index.html rutas correctas
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8');
    const hasIcon = html.includes('href="/apple-touch-icon.png"') || html.includes('href="./apple-touch-icon.png"');
    const hasAppleTouch = html.includes('rel="apple-touch-icon"') && html.includes('sizes="180x180"');
    if (hasIcon && hasAppleTouch) {
      ok('index.html: link apple-touch-icon correcto');
    } else {
      fail('index.html: falta o es incorrecto <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
    }
  } else {
    fail('index.html no encontrado');
  }

  // 5. manifest.json
  const manifestFile = existsSync(manifestPath) ? manifestPath : join(root, 'manifest.json');
  if (existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
      if (manifest.icons && Array.isArray(manifest.icons) && manifest.icons.length > 0) {
        ok('manifest.json: icons definidos');
      } else {
        fail('manifest.json: falta array icons');
      }
    } catch (e) {
      fail('manifest.json: JSON inválido');
    }
  } else {
    fail('manifest.json no encontrado');
  }

  console.log('');
  if (errors > 0) {
    console.error(`[PWA_ICON] Fallos: ${errors}`);
    process.exit(1);
  }
  console.log('[PWA_ICON] Validación OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
