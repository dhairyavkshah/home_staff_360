import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theteam360.homestaff360',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    useLegacyBridge: false
  },
};

export default config;
