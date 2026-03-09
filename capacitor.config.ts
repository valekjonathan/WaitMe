import type { CapacitorConfig } from '@capacitor/cli';

/**
 * MODO A) INSTALACIÓN NORMAL (ios:fresh, ios:dev)
 * - Sin server.url → usa build empaquetada local
 * - Funciona siempre sin servidor dev
 * - Nunca pantalla blanca por dependencia de localhost
 *
 * MODO B) LIVE RELOAD (ios:live)
 * - server.url solo si CAP_LIVE_RELOAD=true o CAPACITOR_USE_DEV_SERVER=true
 * - Solo para desarrollo; cap run --live-reload inyecta URL en runtime
 * - No contamina la app instalada normal
 */
const useLiveReload =
  process.env.CAP_LIVE_RELOAD === 'true' || process.env.CAPACITOR_USE_DEV_SERVER === 'true';
const serverUrl = process.env.CAPACITOR_DEV_SERVER_URL || 'http://localhost:5173';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  ...(useLiveReload && {
    server: {
      url: serverUrl,
      cleartext: true,
    },
  }),
};

export default config;
