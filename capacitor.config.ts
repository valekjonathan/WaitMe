import type { CapacitorConfig } from '@capacitor/cli';

/**
 * MODO A) INSTALACIÓN NORMAL (ios:refresh, ios:fresh, producción)
 * - Sin server.url → usa build empaquetada local
 * - Nunca pantalla blanca por dependencia de localhost
 *
 * MODO B) DEV SERVER (solo ios:auto, dev-ios.sh)
 * - server.url SOLO si CAPACITOR_USE_DEV_SERVER === "true"
 * - Si no existe esa variable, NO debe existir server.url
 */
const useDevServer = process.env.CAPACITOR_USE_DEV_SERVER === 'true';
const serverUrl = process.env.CAPACITOR_DEV_SERVER_URL || 'http://localhost:5173';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  ...(useDevServer && {
    server: {
      url: serverUrl,
      cleartext: true,
    },
  }),
};

export default config;
