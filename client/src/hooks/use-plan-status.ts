import { useSyncExternalStore, useMemo } from "react";
import { storage } from "@/lib/storage";

let planStatusVersion = 0;
const listeners = new Set<() => void>();

function getSnapshot() {
  return planStatusVersion;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function notifyPlanStatusChange() {
  planStatusVersion++;
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  (window as any).__notifyPlanStatusChange = notifyPlanStatusChange;
}

export function usePlanStatus() {
  const version = useSyncExternalStore(subscribe, getSnapshot);
  
  return useMemo(() => {
    const planType = storage.getPlanType();
    const planInfo = storage.getPlanInfo();
    
    return {
      planType,
      isPremium: planType === "PREMIUM",
      status: planInfo.status,
      planInfo,
    };
  }, [version]);
}
