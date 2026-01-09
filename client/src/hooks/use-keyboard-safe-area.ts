import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

interface KeyboardSafeArea {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

const INITIAL_STATE: KeyboardSafeArea = {
  isKeyboardVisible: false,
  keyboardHeight: 0,
  viewportHeight: 800,
  safeAreaTop: 48,
  safeAreaBottom: 0,
};

export function useKeyboardSafeArea(): KeyboardSafeArea {
  const [state, setState] = useState<KeyboardSafeArea>(INITIAL_STATE);

  const updateSafeAreas = useCallback(() => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return { top: 48, bottom: 0 };
      }
      
      const style = getComputedStyle(document.documentElement);
      const topValue = style.getPropertyValue('--app-safe-area-top')?.trim();
      const bottomValue = style.getPropertyValue('--app-safe-area-bottom')?.trim();
      
      const parseValue = (val: string | undefined): number => {
        if (!val) return 0;
        const cleaned = val.replace('px', '').trim();
        const parsed = parseInt(cleaned, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      };
      
      return {
        top: Math.max(parseValue(topValue), 48),
        bottom: Math.max(parseValue(bottomValue), 0),
      };
    } catch {
      return { top: 48, bottom: 0 };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    try {
      if (!Capacitor.isNativePlatform()) {
        return;
      }
    } catch {
      return;
    }

    let initialViewportHeight = 800;
    try {
      initialViewportHeight = window.visualViewport?.height || window.innerHeight || 800;
    } catch {
      // Use default
    }
    
    const safeAreas = updateSafeAreas();
    
    setState(prev => ({
      ...prev,
      viewportHeight: initialViewportHeight,
      safeAreaTop: safeAreas.top,
      safeAreaBottom: safeAreas.bottom,
    }));

    const handleResize = () => {
      try {
        const currentHeight = window.visualViewport?.height || window.innerHeight || 800;
        const heightDiff = initialViewportHeight - currentHeight;
        const isKeyboardVisible = heightDiff > 100;
        
        setState(prev => ({
          ...prev,
          isKeyboardVisible,
          keyboardHeight: isKeyboardVisible ? heightDiff : 0,
          viewportHeight: currentHeight,
        }));

        document.documentElement.style.setProperty(
          '--keyboard-visible',
          isKeyboardVisible ? '1' : '0'
        );
        document.documentElement.style.setProperty(
          '--keyboard-height',
          `${isKeyboardVisible ? heightDiff : 0}px`
        );
        document.documentElement.style.setProperty(
          '--available-height',
          `${currentHeight}px`
        );
      } catch {
        // Ignore errors in edge cases
      }
    };

    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
      }
      window.addEventListener('resize', handleResize);

      handleResize();

      return () => {
        try {
          if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleResize);
          }
          window.removeEventListener('resize', handleResize);
        } catch {
          // Ignore cleanup errors
        }
      };
    } catch {
      // Ignore errors in event attachment
    }
  }, [updateSafeAreas]);

  return state;
}

const DEFAULT_SAFE_AREAS = { top: 48, bottom: 0 };

export function getSafeAreaValues(): { top: number; bottom: number } {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return DEFAULT_SAFE_AREAS;
    }
    
    const style = getComputedStyle(document.documentElement);
    const topValue = style.getPropertyValue('--app-safe-area-top')?.trim();
    const bottomValue = style.getPropertyValue('--app-safe-area-bottom')?.trim();
    
    const parseValue = (val: string | undefined): number => {
      if (!val) return 0;
      const cleaned = val.replace('px', '').trim();
      const parsed = parseInt(cleaned, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    
    return {
      top: Math.max(parseValue(topValue), 48),
      bottom: Math.max(parseValue(bottomValue), 0),
    };
  } catch {
    return DEFAULT_SAFE_AREAS;
  }
}

export function getAvailableViewportHeight(): number {
  try {
    if (typeof window === 'undefined') return 800;
    return window.visualViewport?.height || window.innerHeight;
  } catch {
    return 800;
  }
}
