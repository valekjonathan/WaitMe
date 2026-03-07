#!/usr/bin/env node
/**
 * Imprime las URLs exactas que DEBEN estar en Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
 * Ejecutar: node scripts/print-supabase-redirect-urls.js
 */
const URLs = [
  'com.waitme.app://auth/callback',
  'com.waitme.app://',
  'capacitor://localhost',
  'http://localhost:5173',
  'http://localhost:5173/',
];

console.log('\n=== SUPABASE REDIRECT URLs (añadir en Dashboard) ===\n');
console.log('Supabase Dashboard → Authentication → URL Configuration → Redirect URLs\n');
URLs.forEach((u) => console.log('  ' + u));
console.log('\n=== FIN ===\n');
