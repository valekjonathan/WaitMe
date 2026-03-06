#!/usr/bin/env node
/**
 * Detecta la IP local para que iPhone/Simulator accedan al servidor Vite.
 * Prioriza en0 (WiFi) en macOS, luego la primera IPv4 no loopback.
 * Falla con mensaje claro si no hay IP válida.
 */
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        candidates.push({ name, address: addr.address });
      }
    }
  }

  const en0 = candidates.find((c) => c.name === 'en0');
  if (en0) return en0.address;

  const fallback = candidates[0]?.address;
  if (fallback) return fallback;

  console.error(
    '[get-ip] No se encontró IP local. Conecta a WiFi o asegúrate de tener una interfaz activa.'
  );
  process.exit(1);
}

console.log(getLocalIP());
