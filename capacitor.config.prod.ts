import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Capacitor Configuration
 * 
 * This config is used for production/release builds.
 * Uses the bundled web application so release builds work offline.
 * 
 * Usage: Copy to capacitor.config.ts before building release AAB/APK
 * Or use: BUILD_ENV=production npm run build:android
 */
const config: CapacitorConfig = {
  appId: 'com.theteam360.homestaff360',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disable for production
    useLegacyBridge: false
  },
};

export default config;
