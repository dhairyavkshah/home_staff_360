import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { ExitAppDialog } from "@/components/ExitAppDialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useNavigation } from "@/lib/navigation";
import { registerDirtyTrackingContext } from "@/hooks/use-dirty-tracker";

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
    if (isDirty) {
      setPendingBackNavigation(true);
      setShowUnsavedDialog(true);
      return true;
    }

    if (isOnHomeScreen && !canGoBack) {
      setShowExitDialog(true);
      return true;
    }

    if (canGoBack) {
      goBack();
      return true;
    }

    return false;
  }, [isDirty, isOnHomeScreen, canGoBack, goBack]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    } else if (pendingBackNavigation) {
      setPendingBackNavigation(false);
      if (isOnHomeScreen && !canGoBack) {
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

  const handleExitApp = useCallback(() => {
    setShowExitDialog(false);
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.exitApp();
    }
  }, []);

  const handleStayInApp = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonHandler = CapacitorApp.addListener("backButton", ({ canGoBack: browserCanGoBack }) => {
      const handled = handleBackPress();
      if (!handled && !browserCanGoBack) {
        setShowExitDialog(true);
      }
    });

    return () => {
      backButtonHandler.then(handler => handler.remove());
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
