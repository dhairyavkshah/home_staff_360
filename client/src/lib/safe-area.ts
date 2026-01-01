import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initSafeArea(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });

    const isDarkMode = document.documentElement.classList.contains('dark');
    await StatusBar.setStyle({ style: isDarkMode ? Style.Dark : Style.Light });

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: isDarkMode ? '#1a1a1a' : '#ffffff' });
    }
  } catch {
  }
}

export async function updateStatusBarTheme(isDark: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: isDark ? '#1a1a1a' : '#ffffff' });
    }
  } catch {
  }
}
