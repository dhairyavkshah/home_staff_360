import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Development Capacitor Configuration
 * 
 * This config is used for development/testing builds.
 * Points to the Replit development URL.
 * 
 * Usage: Copy to capacitor.config.ts before building dev APK
 * Or use: BUILD_ENV=development npm run build:android
 */
const config: CapacitorConfig = {
  appId: 'com.theteam360.homestaff360.dev',
  appName: 'Home Staff 360 DEV',
  webDir: 'dist/public',
  server: {
    // Development URL - your Replit workspace URL
    // This will be replaced during build with the actual dev URL
    url: process.env.DEV_SERVER_URL || 'https://homestaff360-dev.replit.app',
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      '*.replit.app',
      '*.replit.dev',
      'localhost',
      '127.0.0.1'
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Enable for dev debugging
    useLegacyBridge: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
