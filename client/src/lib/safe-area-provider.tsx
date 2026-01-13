import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea as SafeAreaCommunity, SystemBarsStyle } from "@capacitor-community/safe-area";
import { SafeArea as SafeAreaPlugin } from "capacitor-plugin-safe-area";

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
    async function initializeSafeArea() {
      if (!Capacitor.isNativePlatform()) {
        setIsReady(true);
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

      try {
        const result = await SafeAreaPlugin.getSafeAreaInsets();
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
          await SafeAreaPlugin.addListener('safeAreaChanged', (data) => {
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
          // Listener not supported, use polling
          const interval = setInterval(async () => {
            try {
              const refreshResult = await SafeAreaPlugin.getSafeAreaInsets();
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

          return () => clearInterval(interval);
        }
      } catch {
        setInsets(androidFallbackInsets);
        updateCSSProperties(androidFallbackInsets);
        setIsReady(true);
      }
    }

    initializeSafeArea();
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
