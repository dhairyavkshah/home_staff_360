import { useState, useEffect, useCallback, useRef } from "react";
import type { Advertisement } from "@shared/schema";
import { hybridAdService, AdProvider } from "@/lib/hybrid-ad-service";

const AD_CHECK_INTERVAL_MS = 30 * 1000;
const AD_INITIAL_DELAY_MS = 60 * 1000;

export const AD_EXCLUDED_SCREENS = [
  "launcher",
  "auth",
  "onboarding",
  "permissions",
  "pin-entry",
  "pin-setup",
  "splash",
  "role-selection",
  "privacy-policy",
];

interface UseHybridAdsReturn {
  currentAd: Advertisement | null;
  showAd: boolean;
  adProvider: AdProvider;
  dismissAd: () => void;
  isLoading: boolean;
  triggerAdCheck: () => Promise<void>;
  showAdMobInterstitial: () => Promise<boolean>;
  showAdMobRewarded: () => Promise<{ type: string; amount: number } | null>;
}

export function useHybridAds(currentScreen?: string): UseHybridAdsReturn {
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [adProvider, setAdProvider] = useState<AdProvider>("none");
  const [isLoading, setIsLoading] = useState(false);
  const checkInProgressRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      hybridAdService.initialize();
    }
  }, []);

  const checkAndShowAd = useCallback(async () => {
    if (checkInProgressRef.current || showAd || isLoading) {
      return;
    }

    if (currentScreen && AD_EXCLUDED_SCREENS.includes(currentScreen)) {
      return;
    }

    if (!hybridAdService.shouldShowAd()) {
      return;
    }

    checkInProgressRef.current = true;
    setIsLoading(true);

    try {
      const result = await hybridAdService.getNextAd();
      
      if (result.provider === "admob" && hybridAdService.isNative() && hybridAdService.isAdMobReady()) {
        setAdProvider("admob");
        setShowAd(true);
        const shown = await hybridAdService.showAdMobInterstitial();
        if (shown) {
          setShowAd(false);
          setAdProvider("none");
        }
      } else if (result.ad) {
        setCurrentAd(result.ad);
        setAdProvider("custom");
        setShowAd(true);
        hybridAdService.markAdShown();
      }
    } catch (error) {
      console.error("Error checking for ads:", error);
    } finally {
      setIsLoading(false);
      checkInProgressRef.current = false;
    }
  }, [showAd, isLoading, currentScreen]);

  const dismissAd = useCallback(() => {
    setShowAd(false);
    setCurrentAd(null);
    setAdProvider("none");
  }, []);

  const triggerAdCheck = useCallback(async () => {
    await checkAndShowAd();
  }, [checkAndShowAd]);

  const showAdMobInterstitial = useCallback(async () => {
    if (!hybridAdService.isNative() || !hybridAdService.isAdMobReady()) {
      return false;
    }
    return hybridAdService.showAdMobInterstitial();
  }, []);

  const showAdMobRewarded = useCallback(async () => {
    if (!hybridAdService.isNative() || !hybridAdService.isAdMobReady()) {
      return null;
    }
    return hybridAdService.showAdMobRewarded();
  }, []);

  useEffect(() => {
    const initialCheck = setTimeout(() => {
      checkAndShowAd();
    }, AD_INITIAL_DELAY_MS);

    const intervalCheck = setInterval(() => {
      checkAndShowAd();
    }, AD_CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalCheck);
    };
  }, [checkAndShowAd]);

  return {
    currentAd,
    showAd,
    adProvider,
    dismissAd,
    isLoading,
    triggerAdCheck,
    showAdMobInterstitial,
    showAdMobRewarded,
  };
}
