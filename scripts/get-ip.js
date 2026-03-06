#!/usr/bin/env node
/**
 * Detecta la IP local para que iPhone/Simulator accedan al servidor Vite.
 * Prioriza en0 (WiFi) en macOS, luego la primera IPv4 no loopback.
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

  return candidates[0]?.address || 'localhost';
}

console.log(getLocalIP());
