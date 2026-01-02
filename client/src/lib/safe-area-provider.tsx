import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea, SystemBarsStyle } from "@capacitor-community/safe-area";

interface SafeAreaContextValue {
  insets: { top: number; right: number; bottom: number; left: number };
  isReady: boolean;
}

const defaultInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const SafeAreaContext = createContext<SafeAreaContextValue>({
  insets: defaultInsets,
  isReady: false,
});

export function useSafeArea() {
  return useContext(SafeAreaContext);
}

interface SafeAreaProviderProps {
  children: ReactNode;
}

export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const [insets, setInsets] = useState(defaultInsets);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeSafeArea() {
      if (Capacitor.isNativePlatform()) {
        try {
          const isDarkMode = document.documentElement.classList.contains('dark');
          await SafeArea.setSystemBarsStyle({
            style: isDarkMode ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
          });

          setTimeout(() => {
            const computedStyle = getComputedStyle(document.documentElement);
            const top = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10) || 0;
            const right = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10) || 0;
            const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10) || 0;
            const left = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10) || 0;

            setInsets({ top, right, bottom, left });

            if (top > 0) {
              document.documentElement.style.setProperty('--app-safe-area-top', `${top}px`);
            }
            if (bottom > 0) {
              document.documentElement.style.setProperty('--app-safe-area-bottom', `${bottom}px`);
            }

            console.log('Safe area insets detected:', { top, right, bottom, left });
            setIsReady(true);
          }, 100);
        } catch (error) {
          console.error('Failed to initialize safe area:', error);
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    }

    initializeSafeArea();
  }, []);

  return (
    <SafeAreaContext.Provider value={{ insets, isReady }}>
      {children}
    </SafeAreaContext.Provider>
  );
}
