import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Development Capacitor Configuration
 * 
 * This config is used for development/testing builds.
 * Uses the bundled web application so development builds work offline.
 * 
 * Usage: Copy to capacitor.config.ts before building dev APK
 * Or use: BUILD_ENV=development npm run build:android
 */
const config: CapacitorConfig = {
  appId: 'com.theteam360.homestaff360.dev',
  appName: 'Home Staff 360 DEV',
  webDir: 'dist/public',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Enable for dev debugging
    useLegacyBridge: false
  },
};

export default config;
