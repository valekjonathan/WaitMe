#!/usr/bin/env node
/**
 * Añade com.waitme.app://auth/callback a Supabase Redirect URLs (uri_allow_list)
 * usando la Management API. Requiere SUPABASE_ACCESS_TOKEN en .env.
 *
 * Ejecutar: node scripts/ensure-oauth-redirect-ios.js
 * O con token: SUPABASE_ACCESS_TOKEN=xxx node scripts/ensure-oauth-redirect-ios.js
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const IOS_REDIRECT = 'com.waitme.app://auth/callback';
const API_BASE = 'https://api.supabase.com/v1';

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

function loadEnv() {
  const cwd = process.cwd();
  const paths = ['.env', '.env.local', '.env.development'];
  let env = {};
  for (const p of paths) {
    const loaded = loadEnvFile(resolve(cwd, p));
    env = { ...env, ...loaded };
  }
  return env;
}

function extractProjectRef(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? m[1] : null;
}

async function main() {
  const env = loadEnv();
  const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;

  const ref = extractProjectRef(supabaseUrl);
  if (!ref) {
    console.error('[ensure-oauth] ERROR: No se pudo extraer project ref de VITE_SUPABASE_URL');
    console.error('  Ejemplo: https://abcdefgh.supabase.co → ref = abcdefgh');
    process.exit(1);
  }

  if (!token) {
    console.log('\n=== CONFIGURACIÓN OAUTH iOS (obligatoria) ===\n');
    console.log('Bloqueo: SUPABASE_ACCESS_TOKEN no encontrado.');
    console.log('Buscado en: process.env, .env, .env.local, .env.development');
    console.log('\nURL que DEBE estar en Supabase Redirect URLs:');
    console.log('  ', IOS_REDIRECT);
    console.log('\nPara añadirla automáticamente:');
    console.log('  1. Crea un token en https://supabase.com/dashboard/account/tokens');
    console.log('  2. Añade a .env: SUPABASE_ACCESS_TOKEN=tu_token');
    console.log('  3. Ejecuta: node scripts/ensure-oauth-redirect-ios.js');
    console.log('\nO manualmente (único bloqueo externo):');
    console.log('  ', `https://supabase.com/dashboard/project/${ref}/auth/url-configuration`);
    console.log('  Añade:', IOS_REDIRECT);
    console.log('\n');
    process.exit(0);
  }

  try {
    const res = await fetch(`${API_BASE}/projects/${ref}/config/auth`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`GET auth config failed: ${res.status} ${await res.text()}`);
    }
    const config = await res.json();
    const current = config.uri_allow_list || '';
    const urls = current
      ? current
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean)
      : [];
    if (urls.includes(IOS_REDIRECT)) {
      console.log('[ensure-oauth] OK: com.waitme.app://auth/callback ya está en Redirect URLs');
      process.exit(0);
    }
    urls.push(IOS_REDIRECT);
    const newList = urls.join(',');

    const patchRes = await fetch(`${API_BASE}/projects/${ref}/config/auth`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uri_allow_list: newList }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`PATCH auth config failed: ${patchRes.status} ${errText}`);
    }
    console.log('[ensure-oauth] OK: com.waitme.app://auth/callback añadido a Redirect URLs');
  } catch (err) {
    console.error('[ensure-oauth] ERROR:', err.message);
    console.error('\nFallback manual:');
    console.error('  ', `https://supabase.com/dashboard/project/${ref}/auth/url-configuration`);
    console.error('  Añade:', IOS_REDIRECT);
    process.exit(0); // No bloquear build; usuario puede añadir manualmente
  }
}

main();
