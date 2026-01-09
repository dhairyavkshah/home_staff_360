import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea, SystemBarsStyle } from "@capacitor-community/safe-area";

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SafeAreaContextValue {
  insets: SafeAreaInsets;
  isReady: boolean;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const SafeAreaContext = createContext<SafeAreaContextValue>({
  insets: DEFAULT_INSETS,
  isReady: false,
  isKeyboardVisible: false,
  keyboardHeight: 0,
});

export function useSafeArea() {
  return useContext(SafeAreaContext);
}

function measureCSSEnvInsets(): SafeAreaInsets {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return DEFAULT_INSETS;
  }
  
  const measureDiv = document.createElement('div');
  measureDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    padding-top: env(safe-area-inset-top, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    box-sizing: content-box;
    pointer-events: none;
    visibility: hidden;
    z-index: -9999;
  `;
  document.body.appendChild(measureDiv);
  
  const computed = window.getComputedStyle(measureDiv);
  
  const parsePixelValue = (value: string): number => {
    const num = parseFloat(value);
    return Number.isNaN(num) ? 0 : num;
  };
  
  const insets: SafeAreaInsets = {
    top: parsePixelValue(computed.paddingTop),
    right: parsePixelValue(computed.paddingRight),
    bottom: parsePixelValue(computed.paddingBottom),
    left: parsePixelValue(computed.paddingLeft),
  };
  
  document.body.removeChild(measureDiv);
  
  return insets;
}

function injectAppSafeAreaVariables(insets: SafeAreaInsets) {
  const root = document.documentElement;
  root.style.setProperty('--app-safe-area-top', `${insets.top}px`);
  root.style.setProperty('--app-safe-area-right', `${insets.right}px`);
  root.style.setProperty('--app-safe-area-bottom', `${insets.bottom}px`);
  root.style.setProperty('--app-safe-area-left', `${insets.left}px`);
}

interface SafeAreaProviderProps {
  children: ReactNode;
}

export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const [insets, setInsets] = useState<SafeAreaInsets>(DEFAULT_INSETS);
  const [isReady, setIsReady] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const initialViewportHeightRef = useRef<number | null>(null);

  const updateSystemBarsStyle = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const isDarkMode = document.documentElement.classList.contains('dark');
      await SafeArea.setSystemBarsStyle({
        style: isDarkMode ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      });
    } catch (error) {
      console.warn('[SafeArea] Failed to update system bars style:', error);
    }
  }, []);

  const refreshInsets = useCallback(() => {
    const measured = measureCSSEnvInsets();
    
    setInsets(measured);
    injectAppSafeAreaVariables(measured);
    
    return measured;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    initialViewportHeightRef.current = window.visualViewport?.height || window.innerHeight;
  }, []);

  useEffect(() => {
    async function initializeSafeArea() {
      if (Capacitor.isNativePlatform()) {
        try {
          await updateSystemBarsStyle();
        } catch (error) {
          console.warn('[SafeArea] Failed to update system bars:', error);
        }
      }

      setTimeout(() => {
        const insets = refreshInsets();
        console.log('[SafeArea] Initialized with insets:', insets);
        setIsReady(true);
      }, 300);
    }

    initializeSafeArea();
  }, [updateSystemBarsStyle, refreshInsets]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      setTimeout(() => {
        refreshInsets();
        if (initialViewportHeightRef.current === null) {
          initialViewportHeightRef.current = window.visualViewport?.height || window.innerHeight;
        }
      }, 200);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, [refreshInsets]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;

    const handleViewportChange = () => {
      const initialHeight = initialViewportHeightRef.current;
      if (!initialHeight) return;
      
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      const keyboardVisible = heightDiff > 100;
      
      setIsKeyboardVisible(keyboardVisible);
      setKeyboardHeight(keyboardVisible ? heightDiff : 0);
      
      document.documentElement.style.setProperty(
        '--keyboard-visible',
        keyboardVisible ? '1' : '0'
      );
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${keyboardVisible ? heightDiff : 0}px`
      );
      document.documentElement.style.setProperty(
        '--available-height',
        `${currentHeight}px`
      );
      
      if (keyboardVisible) {
        document.documentElement.classList.add('keyboard-open');
      } else {
        document.documentElement.classList.remove('keyboard-open');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateSystemBarsStyle();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [updateSystemBarsStyle]);

  return (
    <SafeAreaContext.Provider value={{ insets, isReady, isKeyboardVisible, keyboardHeight }}>
      {children}
    </SafeAreaContext.Provider>
  );
}
