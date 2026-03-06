#!/usr/bin/env node
/**
 * Diagnóstico del proyecto WaitMe.
 * Comprueba: .env, variables, estructura, build.
 * Uso: npm run diagnose
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_MAPBOX_TOKEN'];
const PLACEHOLDERS = ['PEGA_AQUI_EL_TOKEN', 'YOUR_MAPBOX_PUBLIC_TOKEN', 'tu_anon_key', 'TU_PROYECTO'];

let hasErrors = false;
let hasWarnings = false;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
  hasWarnings = true;
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
  hasErrors = true;
}

function parseEnv(content) {
  const env = {};
  if (!content) return env;
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = (m[2] || '').trim();
  }
  return env;
}

console.log('\n=== Diagnóstico WaitMe ===\n');

// 1. Existencia de .env
const envPath = join(ROOT, '.env');
if (!existsSync(envPath)) {
  fail('.env no existe. Copia .env.example a .env y configura las variables.');
} else {
  ok('.env existe');
  const envContent = readFileSync(envPath, 'utf8');
  const env = parseEnv(envContent);

  // 2. Variables necesarias
  for (const key of REQUIRED_ENV) {
    const val = env[key];
    if (!val) {
      fail(`${key} no está definida en .env`);
    } else if (PLACEHOLDERS.some((p) => val.includes(p))) {
      warn(`${key} tiene valor placeholder. Sustituye por valor real.`);
    } else {
      ok(`${key} configurada`);
    }
  }

  // 3. Supabase
  const url = env.VITE_SUPABASE_URL || '';
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  if (url && !url.includes('supabase.co')) {
    warn('VITE_SUPABASE_URL no parece una URL de Supabase válida');
  }
  if (url && key && !PLACEHOLDERS.some((p) => url.includes(p) || key.includes(p))) {
    ok('Supabase configurado (URL y anon key presentes)');
  }

  // 4. Mapbox
  const token = env.VITE_MAPBOX_TOKEN || '';
  if (token && !PLACEHOLDERS.some((p) => token.includes(p))) {
    if (token.startsWith('pk.')) {
      ok('Token Mapbox presente (formato pk.xxx)');
    } else {
      warn('VITE_MAPBOX_TOKEN no tiene formato pk.xxx típico');
    }
  }
}

// 5. Build de Vite
console.log('\n--- Build ---');
try {
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
  ok('Build de Vite posible');
} catch (e) {
  fail('Build falla. Ejecuta: npm run build');
}

// 6. Estructura básica
console.log('\n--- Estructura ---');
const requiredPaths = [
  'src/main.jsx',
  'src/App.jsx',
  'src/pages/Home.jsx',
  'src/lib/supabaseClient.js',
  'src/data/alerts.js',
  'supabase/migrations',
  'vite.config.js',
  'package.json',
];

for (const p of requiredPaths) {
  const full = join(ROOT, p);
  if (existsSync(full)) {
    ok(p);
  } else {
    fail(`${p} no existe`);
  }
}

// Resumen
console.log('\n--- Resumen ---');
if (hasErrors) {
  console.log('\n  Hay errores. Revisa los mensajes anteriores.');
  process.exit(1);
}
if (hasWarnings) {
  console.log('\n  Hay advertencias. El proyecto puede funcionar pero revisa la configuración.');
  process.exit(0);
}
console.log('\n  Todo OK. El proyecto está listo para desarrollo.\n');
process.exit(0);
