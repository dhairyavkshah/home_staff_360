import { type ReactNode, useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Only set up keyboard height tracking on native mobile platforms
    if (!isNative) {
      return;
    }

    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const heightDiff = windowHeight - viewportHeight;
        setKeyboardHeight(heightDiff > 50 ? heightDiff : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isNative]);

  return keyboardHeight;
}

export function AppLayout({ children, className = "" }: AppLayoutProps) {
  const keyboardHeight = useKeyboardHeight();
  const isKeyboardOpen = keyboardHeight > 0;
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Keep auto-scroll behavior for focused inputs on mobile
    if (isKeyboardOpen && isNative) {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [isKeyboardOpen, isNative]);

  // Only apply keyboard height adjustment on native mobile platforms
  const shouldApplyKeyboardHeight = isNative && isKeyboardOpen;

  return (
    <div 
      className={`app-container max-w-md mx-auto flex flex-col bg-background ${className}`}
      style={{ 
        height: shouldApplyKeyboardHeight ? `calc(100vh - ${keyboardHeight}px)` : '100vh',
        minHeight: shouldApplyKeyboardHeight ? `calc(100vh - ${keyboardHeight}px)` : '100vh'
      }}
    >
      <div className="safe-area-top" />
      {children}
      {!isKeyboardOpen && <div className="safe-area-bottom" />}
    </div>
  );
}

interface ScrollContentProps {
  children: ReactNode;
  className?: string;
}

export function ScrollContent({ children, className = "" }: ScrollContentProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className={`content-container px-4 pt-4 pb-6 flex flex-col gap-6 ${className}`}>
        {children}
      </div>
      <div className="safe-area-bottom" />
    </div>
  );
}
