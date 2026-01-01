import { Capacitor } from '@capacitor/core';
import { SafeArea, SystemBarsStyle } from '@capacitor-community/safe-area';

export async function initSafeArea(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const isDarkMode = document.documentElement.classList.contains('dark');
    await SafeArea.setSystemBarsStyle({
      style: isDarkMode ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch {
  }
}

export async function updateStatusBarTheme(isDark: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SafeArea.setSystemBarsStyle({
      style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch {
  }
}
