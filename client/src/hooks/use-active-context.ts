import { useSyncExternalStore, useMemo } from "react";
import { storage } from "@/lib/storage";

let activeContextVersion = 0;
const listeners = new Set<() => void>();

function getSnapshot() {
  return activeContextVersion;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function notifyActiveContextChange() {
  activeContextVersion++;
  listeners.forEach((listener) => listener());
}

export function useActiveContext() {
  const version = useSyncExternalStore(subscribe, getSnapshot);
  
  return useMemo(() => {
    const profile = storage.getProfile();
    const isHome = profile?.type === "HOME";
    
    const activeId = storage.getActiveAccountId();
    const activeAccount = activeId ? storage.getAccount(activeId) : null;
    const showAllContexts = storage.getShowAllContexts();
    
    return {
      contextLabel: activeAccount?.name || undefined,
      contextMode: isHome ? "home" as const : "staff" as const,
      isHome,
      activeAccount,
      profile,
      showAllContexts,
    };
  }, [version]);
}
