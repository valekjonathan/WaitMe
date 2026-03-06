import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'http://192.168.0.15:5173',
    cleartext: true,
  },
};

export default config;
