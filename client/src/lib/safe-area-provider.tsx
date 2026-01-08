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

          // Wait a bit for CSS env variables to be set by the plugin, then read them
          setTimeout(() => {
            const computedStyle = getComputedStyle(document.documentElement);
            const top = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10) || 0;
            const right = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10) || 0;
            const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10) || 0;
            const left = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10) || 0;

            // Ensure minimum values for Android status bar (typically 24-48dp depending on device)
            // Samsung S21FE has a taller status bar area, so use 48px minimum
            const finalTop = Math.max(top, 48);
            const finalBottom = Math.max(bottom, 0);
            
            setInsets({ top: finalTop, right, bottom: finalBottom, left });

            document.documentElement.style.setProperty('--app-safe-area-top', `${finalTop}px`);
            document.documentElement.style.setProperty('--app-safe-area-bottom', `${finalBottom}px`);
            document.documentElement.style.setProperty('--app-safe-area-left', `${left}px`);
            document.documentElement.style.setProperty('--app-safe-area-right', `${right}px`);

            console.log('Safe area insets detected:', { top: finalTop, right, bottom: finalBottom, left });
            setIsReady(true);
          }, 200);
        } catch (error) {
          console.error('Failed to initialize safe area:', error);
          // Set sensible defaults for Android
          const defaultTop = 32;
          const defaultBottom = 0;
          setInsets({ top: defaultTop, right: 0, bottom: defaultBottom, left: 0 });
          document.documentElement.style.setProperty('--app-safe-area-top', `${defaultTop}px`);
          document.documentElement.style.setProperty('--app-safe-area-bottom', `${defaultBottom}px`);
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
