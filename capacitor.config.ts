import type { CapacitorConfig } from '@capacitor/cli';

const useDevServer = process.env.CAPACITOR_USE_DEV_SERVER === 'true';
const serverUrl = process.env.CAPACITOR_DEV_SERVER_URL || 'http://localhost:5173';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  // Simulator por defecto: iPhone 16e (usado por npm run ios:fresh / ios:dev)
  ...(useDevServer && {
    server: {
      url: serverUrl,
      cleartext: true,
    },
  }),
};

export default config;
