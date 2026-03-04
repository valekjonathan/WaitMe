import type { CapacitorConfig } from '@capacitor/cli';

const useDevServer = process.env.CAPACITOR_USE_DEV_SERVER === 'true';
const devUrl = process.env.CAPACITOR_DEV_SERVER || 'http://192.168.0.10:5173';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  ...(useDevServer && {
    server: { url: devUrl, cleartext: true },
  }),
};

export default config;
