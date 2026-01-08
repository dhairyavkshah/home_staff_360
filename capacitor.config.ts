import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homestaff360.app',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  server: {
    url: 'https://www.homestaff360.com',
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
