import { useState, useEffect, useCallback, useRef } from "react";
import type { Advertisement } from "@shared/schema";
import { adService } from "@/lib/ad-service";

const AD_CHECK_INTERVAL_MS = 30 * 1000;

interface UseAdsReturn {
  currentAd: Advertisement | null;
  showAd: boolean;
  dismissAd: () => void;
  isLoading: boolean;
  triggerAdCheck: () => Promise<void>;
}

export function useAds(): UseAdsReturn {
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const checkInProgressRef = useRef(false);

  const checkAndShowAd = useCallback(async () => {
    if (checkInProgressRef.current || showAd || isLoading) {
      return;
    }

    if (!adService.shouldShowAd()) {
      return;
    }

    checkInProgressRef.current = true;
    setIsLoading(true);

    try {
      const ad = await adService.getNextAd();
      if (ad) {
        setCurrentAd(ad);
        setShowAd(true);
        adService.markAdShown();
      }
    } catch (error) {
      console.error("Error checking for ads:", error);
    } finally {
      setIsLoading(false);
      checkInProgressRef.current = false;
    }
  }, [showAd, isLoading]);

  const dismissAd = useCallback(() => {
    setShowAd(false);
    setCurrentAd(null);
  }, []);

  const triggerAdCheck = useCallback(async () => {
    await checkAndShowAd();
  }, [checkAndShowAd]);

  useEffect(() => {
    adService.startTracking();

    const initialCheck = setTimeout(() => {
      checkAndShowAd();
    }, 1000);

    const intervalCheck = setInterval(() => {
      checkAndShowAd();
    }, AD_CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalCheck);
      adService.stopTracking();
    };
  }, [checkAndShowAd]);

  return {
    currentAd,
    showAd,
    dismissAd,
    isLoading,
    triggerAdCheck,
  };
}
