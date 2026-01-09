import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theteam360.homestaff360',
  appName: 'Home Staff 360',
  webDir: 'dist/public',
  server: {
    url: 'https://homestaff360.replit.app',
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'homestaff360.replit.app',
      '*.replit.app',
      '*.replit.dev'
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    useLegacyBridge: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#ffffff',
      statusBarContent: 'dark',
      navigationBarColor: '#ffffff',
      navigationBarContent: 'dark',
      offset: 0
    },
    SystemBars: {
      insetsHandling: 'disable'
    },
    Keyboard: {
      resizeOnFullScreen: false
    }
  }
};

export default config;
