#!/usr/bin/env node
/**
 * Ejecuta la migración de profiles directamente contra la base de datos.
 * Requiere: SUPABASE_DB_URL en .env o en entorno
 * Obtener en: Supabase Dashboard → Settings → Database → Connection string → URI
 * Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const migrationPath = join(rootDir, 'supabase/migrations/20260305120000_fix_profiles_rls_and_trigger.sql');

// Cargar .env si existe
const envPath = join(rootDir, '.env');
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Error: SUPABASE_DB_URL no configurado.');
  console.error('  Obtener en: Supabase Dashboard → Settings → Database → Connection string → URI');
  console.error('  Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
  process.exit(1);
}

async function run() {
  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const sql = readFileSync(migrationPath, 'utf8');
    await client.query(sql);
    console.log('Migración aplicada correctamente.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
