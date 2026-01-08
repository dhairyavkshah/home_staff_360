import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

interface SubscriptionData {
  id: string;
  productId: string;
  purchaseState: string;
  expiryTime: string | null;
  autoRenewing: boolean;
  currency: string | null;
  country: string | null;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: string | null;
  subscription: SubscriptionData | null;
}

let subscriptionVersion = 0;
const listeners = new Set<() => void>();

function getSnapshot() {
  return subscriptionVersion;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function notifySubscriptionChange() {
  subscriptionVersion++;
  listeners.forEach((listener) => listener());
}

export function useSubscription() {
  const version = useSyncExternalStore(subscribe, getSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    expiryDate: null,
    subscription: null,
  });
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/subscriptions/status", {
        credentials: "include",
      });
      if (response.ok) {
        const json = await response.json();
        // Handle API response format: { success: true, data: {...} }
        const data = json.data || json;
        setStatus({
          isSubscribed: data.isActive ?? false,
          expiryDate: data.expiryDate ?? null,
          subscription: data.subscription ?? null,
        });
      } else {
        setStatus({
          isSubscribed: false,
          expiryDate: null,
          subscription: null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch subscription status"));
      setStatus({
        isSubscribed: false,
        expiryDate: null,
        subscription: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus, version]);

  const refreshSubscription = useCallback(() => {
    notifySubscriptionChange();
    return fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  return {
    isLoading,
    isSubscribed: status.isSubscribed,
    expiryDate: status.expiryDate,
    subscription: status.subscription,
    error,
    refreshSubscription,
  };
}
