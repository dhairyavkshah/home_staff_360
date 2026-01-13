import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { ExitAppDialog } from "@/components/ExitAppDialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useNavigation } from "@/lib/navigation";
import { registerDirtyTrackingContext } from "@/hooks/use-dirty-tracker";

// Helper to check if running on native platform using window-based detection
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

interface DirtyTrackingContextType {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
  handleBackPress: () => boolean;
}

const DirtyTrackingContext = createContext<DirtyTrackingContextType | null>(null);

export function DirtyTrackingProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { currentScreen, goBack, canGoBack } = useNavigation();
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const [pendingBackNavigation, setPendingBackNavigation] = useState(false);

  const homeScreens = ["home", "staff-home"];
  const isOnHomeScreen = homeScreens.includes(currentScreen);
  
  const screensBlockingBackButton = [
    "auth",
    "role-selection", 
    "onboarding",
    "permissions",
    "pin-setup",
    "set-password",
    "launcher"
  ];
  const shouldBlockBackButton = screensBlockingBackButton.includes(currentScreen);

  useEffect(() => {
    registerDirtyTrackingContext({ setDirty: setIsDirty });
    return () => registerDirtyTrackingContext(null);
  }, []);

  const confirmNavigation = useCallback((callback: () => void) => {
    if (isDirty) {
      setPendingCallback(() => callback);
      setShowUnsavedDialog(true);
    } else {
      callback();
    }
  }, [isDirty]);

  const handleBackPress = useCallback((): boolean => {
    if (shouldBlockBackButton) {
      return true;
    }

    if (isDirty) {
      setPendingBackNavigation(true);
      setShowUnsavedDialog(true);
      return true;
    }

    if (canGoBack) {
      goBack();
      return true;
    }

    if (isOnHomeScreen) {
      setShowExitDialog(true);
      return true;
    }

    return false;
  }, [isDirty, isOnHomeScreen, canGoBack, goBack, shouldBlockBackButton]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    } else if (pendingBackNavigation) {
      setPendingBackNavigation(false);
      if (isOnHomeScreen) {
        setShowExitDialog(true);
      } else if (canGoBack) {
        goBack();
      }
    }
  }, [pendingCallback, pendingBackNavigation, isOnHomeScreen, canGoBack, goBack]);

  const handleContinueEditing = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingCallback(null);
    setPendingBackNavigation(false);
  }, []);

  const handleExitApp = useCallback(async () => {
    setShowExitDialog(false);
    if (isNativePlatform()) {
      try {
        const { App } = await import("@capacitor/app");
        await App.exitApp();
      } catch (error) {
        console.error("Failed to exit app:", error);
      }
    }
  }, []);

  const handleStayInApp = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  useEffect(() => {
    if (!isNativePlatform()) return;

    let listenerHandle: any = null;

    async function setupBackButtonListener() {
      try {
        const { App } = await import("@capacitor/app");
        listenerHandle = await App.addListener("backButton", ({ canGoBack: browserCanGoBack }) => {
          const handled = handleBackPress();
          if (!handled && !browserCanGoBack) {
            setShowExitDialog(true);
          }
        });
      } catch (error) {
        console.error("Failed to setup back button listener:", error);
      }
    }

    setupBackButtonListener();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [handleBackPress]);

  useEffect(() => {
    setIsDirty(false);
  }, [currentScreen]);

  return (
    <DirtyTrackingContext.Provider
      value={{
        isDirty,
        setDirty: setIsDirty,
        confirmNavigation,
        handleBackPress,
      }}
    >
      {children}
      
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
        title={t("unsavedChangesTitle")}
        description={t("unsavedChangesDescription")}
        discardLabel={t("discardChanges")}
        cancelLabel={t("continueEditing")}
      />

      <ExitAppDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onExit={handleExitApp}
        onStay={handleStayInApp}
      />
    </DirtyTrackingContext.Provider>
  );
}

export function useDirtyTracking() {
  const context = useContext(DirtyTrackingContext);
  if (!context) {
    throw new Error("useDirtyTracking must be used within a DirtyTrackingProvider");
  }
  return context;
}

export function useDirtyForm(formIsDirty: boolean) {
  const { setDirty } = useDirtyTracking();
  
  useEffect(() => {
    setDirty(formIsDirty);
    return () => setDirty(false);
  }, [formIsDirty, setDirty]);
}
