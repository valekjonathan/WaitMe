#!/usr/bin/env node
/**
 * Detecta IP local y devuelve URL del servidor Vite para Capacitor Live Reload.
 * Usado por ios:auto para que Simulator e iPhone físico carguen desde el Mac.
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
    '[setDevServer] No se encontró IP local. Conecta a WiFi o asegúrate de tener una interfaz activa.'
  );
  process.exit(1);
}

const port = process.env.PORT || 5173;
const url = `http://${getLocalIP()}:${port}`;
console.log(url);
