import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homestaff360.app',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  server: {
    // For development testing - change to production URL before Play Store release
    url: 'https://10ac9132-0137-4782-ad57-b35fc62d1787-00-16jmimdw4iwio.sisko.replit.dev',
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
