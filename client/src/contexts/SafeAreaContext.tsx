import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { subscribeToInsets, getSafeAreaInsets, initSafeArea, type SafeAreaInsets } from '@/lib/safe-area';

interface SafeAreaContextValue {
  insets: SafeAreaInsets;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  availableHeight: number;
}

const DEFAULT_CONTEXT: SafeAreaContextValue = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  isKeyboardVisible: false,
  keyboardHeight: 0,
  availableHeight: 800,
};

const SafeAreaContext = createContext<SafeAreaContextValue>(DEFAULT_CONTEXT);

export function useSafeArea(): SafeAreaContextValue {
  return useContext(SafeAreaContext);
}

interface SafeAreaProviderProps {
  children: ReactNode;
}

export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const [insets, setInsets] = useState<SafeAreaInsets>(getSafeAreaInsets());
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  const updateKeyboardState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
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
  }, []);

  useEffect(() => {
    initSafeArea();
    
    const unsubscribe = subscribeToInsets((newInsets) => {
      setInsets(newInsets);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;

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

  const contextValue: SafeAreaContextValue = {
    insets,
    isKeyboardVisible,
    keyboardHeight,
    availableHeight,
  };

  return (
    <SafeAreaContext.Provider value={contextValue}>
      {children}
    </SafeAreaContext.Provider>
  );
}

export function getEffectiveBottomInset(
  insets: SafeAreaInsets,
  isKeyboardVisible: boolean,
  keyboardHeight: number
): number {
  if (isKeyboardVisible && keyboardHeight > 0) {
    return keyboardHeight;
  }
  return insets.bottom;
}
