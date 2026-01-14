import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Capacitor Configuration
 * 
 * This config is used for production/release builds.
 * Points to the published Replit app URL.
 * 
 * Usage: Copy to capacitor.config.ts before building release AAB/APK
 * Or use: BUILD_ENV=production npm run build:android
 */
const config: CapacitorConfig = {
  appId: 'com.theteam360.homestaff360',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  server: {
    // Production URL - your published Replit app
    url: 'https://homestaff360.replit.app',
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'homestaff360.replit.app'
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disable for production
    useLegacyBridge: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
