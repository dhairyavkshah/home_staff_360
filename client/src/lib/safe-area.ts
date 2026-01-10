import { Capacitor } from '@capacitor/core';
import { SafeArea as SafeAreaCommunity, SystemBarsStyle } from '@capacitor-community/safe-area';
import { SafeArea as SafeAreaPlugin } from 'capacitor-plugin-safe-area';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const DEFAULT_INSETS: SafeAreaInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const ANDROID_FALLBACK_INSETS: SafeAreaInsets = {
  top: 48,
  bottom: 48,
  left: 0,
  right: 0,
};

let cachedInsets: SafeAreaInsets = DEFAULT_INSETS;
let insetsListeners: ((insets: SafeAreaInsets) => void)[] = [];
let isInitialized = false;

function updateCSSProperties(insets: SafeAreaInsets): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--app-safe-area-top', `${insets.top}px`);
  root.style.setProperty('--app-safe-area-bottom', `${insets.bottom}px`);
  root.style.setProperty('--app-safe-area-left', `${insets.left}px`);
  root.style.setProperty('--app-safe-area-right', `${insets.right}px`);
}

function notifyListeners(insets: SafeAreaInsets): void {
  insetsListeners.forEach(listener => {
    try {
      listener(insets);
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeToInsets(listener: (insets: SafeAreaInsets) => void): () => void {
  insetsListeners.push(listener);
  listener(cachedInsets);
  
  return () => {
    insetsListeners = insetsListeners.filter(l => l !== listener);
  };
}

export function getSafeAreaInsets(): SafeAreaInsets {
  return cachedInsets;
}

async function fetchInsetsFromPlugin(): Promise<SafeAreaInsets> {
  try {
    const result = await SafeAreaPlugin.getSafeAreaInsets();
    const insets = result.insets;
    
    return {
      top: Math.max(insets.top || 0, 0),
      bottom: Math.max(insets.bottom || 0, 0),
      left: Math.max(insets.left || 0, 0),
      right: Math.max(insets.right || 0, 0),
    };
  } catch {
    return ANDROID_FALLBACK_INSETS;
  }
}

async function fetchAndSetInsets(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    cachedInsets = DEFAULT_INSETS;
    updateCSSProperties(cachedInsets);
    return;
  }

  const insets = await fetchInsetsFromPlugin();
  
  if (insets.top === 0 && insets.bottom === 0) {
    cachedInsets = ANDROID_FALLBACK_INSETS;
  } else {
    cachedInsets = insets;
  }
  
  updateCSSProperties(cachedInsets);
  notifyListeners(cachedInsets);
}

export async function initSafeArea(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;
  
  if (!Capacitor.isNativePlatform()) {
    cachedInsets = DEFAULT_INSETS;
    updateCSSProperties(cachedInsets);
    return;
  }

  try {
    const isDarkMode = document.documentElement.classList.contains('dark');
    await SafeAreaCommunity.setSystemBarsStyle({
      style: isDarkMode ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch {
    // Ignore style errors
  }

  await fetchAndSetInsets();
  
  try {
    await SafeAreaPlugin.addListener('safeAreaChanged', (data) => {
      const insets = data.insets;
      cachedInsets = {
        top: Math.max(insets.top || 0, 0),
        bottom: Math.max(insets.bottom || 0, 0),
        left: Math.max(insets.left || 0, 0),
        right: Math.max(insets.right || 0, 0),
      };
      
      if (cachedInsets.top === 0 && cachedInsets.bottom === 0) {
        cachedInsets = ANDROID_FALLBACK_INSETS;
      }
      
      updateCSSProperties(cachedInsets);
      notifyListeners(cachedInsets);
    });
  } catch {
    // Fallback polling for devices without listener support
    setInterval(async () => {
      await fetchAndSetInsets();
    }, 1000);
  }
}

export async function updateStatusBarTheme(isDark: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SafeAreaCommunity.setSystemBarsStyle({
      style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch {
    // Ignore errors
  }
}

export async function refreshSafeAreaInsets(): Promise<SafeAreaInsets> {
  await fetchAndSetInsets();
  return cachedInsets;
}
