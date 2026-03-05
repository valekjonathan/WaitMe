import type { CapacitorConfig } from '@capacitor/cli';

// Para desarrollo: CAPACITOR_USE_DEV_SERVER=true npx cap sync ios
const useDevServer = process.env.CAPACITOR_USE_DEV_SERVER === 'true';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  ...(useDevServer && {
    server: {
      url: 'http://192.168.0.11:5173',
      cleartext: true,
    },
  }),
};

export default config;
