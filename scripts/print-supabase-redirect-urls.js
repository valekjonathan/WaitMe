#!/usr/bin/env node
/**
 * Imprime las URLs exactas que DEBEN estar en Supabase Redirect URLs.
 * Para iOS: com.waitme.app://auth/callback es OBLIGATORIA.
 *
 * Añadir automáticamente: npm run supabase:ensure-oauth-ios (requiere SUPABASE_ACCESS_TOKEN)
 * Manual: Supabase Dashboard → Auth → URL Configuration
 */
const IOS_NATIVE = 'com.waitme.app://auth/callback';
const URLs = [
  IOS_NATIVE,
  'com.waitme.app://',
  'capacitor://localhost',
  'http://localhost:5173',
  'http://localhost:5173/',
];

console.log('\n=== SUPABASE REDIRECT URLs ===\n');
console.log('iOS native (OBLIGATORIA):', IOS_NATIVE);
console.log('\nTodas las URLs compatibles:\n');
URLs.forEach((u) => console.log('  ' + u));
console.log('\nAñadir automáticamente: npm run supabase:ensure-oauth-ios');
console.log('=== FIN ===\n');
