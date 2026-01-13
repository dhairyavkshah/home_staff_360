import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

// Helper to check if running on native platform using window-based detection
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

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
  availableHeight: number;
  effectiveBottomInset: number;
}

const defaultInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const androidFallbackInsets: SafeAreaInsets = { top: 48, right: 0, bottom: 48, left: 0 };

const SafeAreaContext = createContext<SafeAreaContextValue>({
  insets: defaultInsets,
  isReady: false,
  isKeyboardVisible: false,
  keyboardHeight: 0,
  availableHeight: 800,
  effectiveBottomInset: 0,
});

export function useSafeArea() {
  return useContext(SafeAreaContext);
}

interface SafeAreaProviderProps {
  children: ReactNode;
}

export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const [insets, setInsets] = useState<SafeAreaInsets>(defaultInsets);
  const [isReady, setIsReady] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [initialHeight, setInitialHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  const updateCSSProperties = useCallback((safeInsets: SafeAreaInsets) => {
    const root = document.documentElement;
    root.style.setProperty('--app-safe-area-top', `${safeInsets.top}px`);
    root.style.setProperty('--app-safe-area-bottom', `${safeInsets.bottom}px`);
    root.style.setProperty('--app-safe-area-left', `${safeInsets.left}px`);
    root.style.setProperty('--app-safe-area-right', `${safeInsets.right}px`);
  }, []);

  const updateKeyboardState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialHeight - viewportHeight;
      const isVisible = heightDiff > 100;
      
      setIsKeyboardVisible(isVisible);
      setKeyboardHeight(isVisible ? heightDiff : 0);
      setAvailableHeight(viewportHeight);
      
      const root = document.documentElement;
      root.style.setProperty('--keyboard-visible', isVisible ? '1' : '0');
      root.style.setProperty('--keyboard-height', `${isVisible ? heightDiff : 0}px`);
      root.style.setProperty('--available-height', `${viewportHeight}px`);
    } catch {
      // Ignore errors
    }
  }, [initialHeight]);

  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let cachedSafeAreaPlugin: any = null;
    let listenerHandle: any = null;

    async function initializeSafeArea() {
      if (!isNativePlatform()) {
        setIsReady(true);
        return;
      }

      try {
        const { SafeArea: SafeAreaCommunity, SystemBarsStyle } = await import("@capacitor-community/safe-area");
        const isDarkMode = document.documentElement.classList.contains('dark');
        await SafeAreaCommunity.setSystemBarsStyle({
          style: isDarkMode ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
        });
      } catch {
        // Ignore style errors
      }

      try {
        const safeAreaModule = await import("capacitor-plugin-safe-area");
        cachedSafeAreaPlugin = safeAreaModule.SafeArea;
        
        const result = await cachedSafeAreaPlugin.getSafeAreaInsets();
        const pluginInsets = result.insets;
        
        let finalInsets: SafeAreaInsets = {
          top: Math.max(pluginInsets.top || 0, 0),
          right: Math.max(pluginInsets.right || 0, 0),
          bottom: Math.max(pluginInsets.bottom || 0, 0),
          left: Math.max(pluginInsets.left || 0, 0),
        };

        if (finalInsets.top === 0 && finalInsets.bottom === 0) {
          finalInsets = androidFallbackInsets;
        } else {
          finalInsets.top = Math.max(finalInsets.top, 24);
        }

        setInsets(finalInsets);
        updateCSSProperties(finalInsets);
        setIsReady(true);

        try {
          listenerHandle = await cachedSafeAreaPlugin.addListener('safeAreaChanged', (data: any) => {
            const newInsets = data.insets;
            let updatedInsets: SafeAreaInsets = {
              top: Math.max(newInsets.top || 0, 0),
              right: Math.max(newInsets.right || 0, 0),
              bottom: Math.max(newInsets.bottom || 0, 0),
              left: Math.max(newInsets.left || 0, 0),
            };

            if (updatedInsets.top === 0 && updatedInsets.bottom === 0) {
              updatedInsets = androidFallbackInsets;
            } else {
              updatedInsets.top = Math.max(updatedInsets.top, 24);
            }

            setInsets(updatedInsets);
            updateCSSProperties(updatedInsets);
          });
        } catch {
          // Listener not supported, use polling with cached plugin
          pollingInterval = setInterval(async () => {
            try {
              if (!cachedSafeAreaPlugin) return;
              
              const refreshResult = await cachedSafeAreaPlugin.getSafeAreaInsets();
              const refreshInsets = refreshResult.insets;
              
              let polledInsets: SafeAreaInsets = {
                top: Math.max(refreshInsets.top || 0, 24),
                right: Math.max(refreshInsets.right || 0, 0),
                bottom: Math.max(refreshInsets.bottom || 0, 0),
                left: Math.max(refreshInsets.left || 0, 0),
              };

              if (polledInsets.top === 0 && polledInsets.bottom === 0) {
                polledInsets = androidFallbackInsets;
              }

              setInsets(polledInsets);
              updateCSSProperties(polledInsets);
            } catch {
              // Ignore polling errors
            }
          }, 2000);
        }
      } catch {
        setInsets(androidFallbackInsets);
        updateCSSProperties(androidFallbackInsets);
        setIsReady(true);
      }
    }

    initializeSafeArea();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [updateCSSProperties]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setInitialHeight(window.innerHeight);
    updateKeyboardState();

    const handleResize = () => {
      updateKeyboardState();
      setTimeout(updateKeyboardState, 50);
      setTimeout(updateKeyboardState, 150);
    };

    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);
      }
      window.addEventListener('resize', handleResize);

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
          window.visualViewport.removeEventListener('scroll', handleResize);
        }
        window.removeEventListener('resize', handleResize);
      };
    } catch {
      // Ignore errors
    }
  }, [updateKeyboardState]);

  const effectiveBottomInset = isKeyboardVisible && keyboardHeight > 0 
    ? keyboardHeight 
    : insets.bottom;

  const contextValue: SafeAreaContextValue = {
    insets,
    isReady,
    isKeyboardVisible,
    keyboardHeight,
    availableHeight,
    effectiveBottomInset,
  };

  return (
    <SafeAreaContext.Provider value={contextValue}>
      {children}
    </SafeAreaContext.Provider>
  );
}
