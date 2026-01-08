import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea, SystemBarsStyle } from "@capacitor-community/safe-area";
import { StatusBar, Style } from "@capacitor/status-bar";

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
          // Disable WebView overlay mode - let Android handle system bar spacing
          // This makes the WebView resize below the status/navigation bars
          await StatusBar.setOverlaysWebView({ overlay: false });
          
          // Set status bar style based on theme
          const isDarkMode = document.documentElement.classList.contains('dark');
          await StatusBar.setStyle({ 
            style: isDarkMode ? Style.Dark : Style.Light 
          });
          await StatusBar.setBackgroundColor({ color: isDarkMode ? '#000000' : '#ffffff' });
          
          // Also set system bars style via SafeArea plugin for consistency
          await SafeArea.setSystemBarsStyle({
            style: isDarkMode ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
          });

          // Since overlay is disabled, Android handles the spacing
          // We set zero insets because the WebView is already below the status bar
          const finalInsets = { top: 0, right: 0, bottom: 0, left: 0 };
          setInsets(finalInsets);

          // Set CSS custom properties to zero since overlay is disabled
          document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
          document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
          document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
          document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
          document.documentElement.style.setProperty('--app-safe-area-top', '0px');
          document.documentElement.style.setProperty('--app-safe-area-bottom', '0px');
          document.documentElement.style.setProperty('--app-safe-area-left', '0px');
          document.documentElement.style.setProperty('--app-safe-area-right', '0px');

          console.log('Safe area initialized: overlay disabled, Android handles system bar spacing');
          setIsReady(true);
        } catch (error) {
          console.error('Failed to initialize safe area:', error);
          // Fallback - mark as ready with zero insets
          setInsets(defaultInsets);
          document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
          document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
          document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
          document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
          document.documentElement.style.setProperty('--app-safe-area-top', '0px');
          document.documentElement.style.setProperty('--app-safe-area-bottom', '0px');
          document.documentElement.style.setProperty('--app-safe-area-left', '0px');
          document.documentElement.style.setProperty('--app-safe-area-right', '0px');
          setIsReady(true);
        }
      } else {
        // Web browser - no safe area needed
        setIsReady(true);
      }
    }

    initializeSafeArea();
  }, []);

  // Listen for theme changes to update status bar
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkMode = document.documentElement.classList.contains('dark');
          StatusBar.setStyle({ 
            style: isDarkMode ? Style.Dark : Style.Light 
          }).catch(console.error);
          StatusBar.setBackgroundColor({ 
            color: isDarkMode ? '#000000' : '#ffffff' 
          }).catch(console.error);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <SafeAreaContext.Provider value={{ insets, isReady }}>
      {children}
    </SafeAreaContext.Provider>
  );
}
