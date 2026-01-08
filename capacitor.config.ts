import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homestaff360.app',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  server: {
    url: 'https://homestaff360.com',
    androidScheme: 'https',
    allowNavigation: ['homestaff360.com', 'www.homestaff360.com', '*.homestaff360.com', 'homestaff360.replit.app']
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
