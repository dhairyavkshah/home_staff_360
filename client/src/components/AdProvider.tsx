import { useHybridAds } from "@/hooks/useHybridAds";
import { AdOverlay } from "./AdOverlay";

export function AdProvider() {
  const { currentAd, showAd, adProvider, dismissAd } = useHybridAds();

  if (!showAd || !currentAd || adProvider !== "custom") {
    return null;
  }

  return <AdOverlay ad={currentAd} onClose={dismissAd} />;
}
