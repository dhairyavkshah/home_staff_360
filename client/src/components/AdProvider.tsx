import { useHybridAds, AD_EXCLUDED_SCREENS } from "@/hooks/useHybridAds";
import { AdOverlay } from "./AdOverlay";
import { useNavigation } from "@/lib/navigation";

export function AdProvider() {
  const { currentScreen } = useNavigation();
  const { currentAd, secondAd, showAd, adProvider, dismissAd } = useHybridAds(currentScreen);

  if (!showAd || !currentAd || adProvider !== "custom") {
    return null;
  }

  if (AD_EXCLUDED_SCREENS.includes(currentScreen)) {
    return null;
  }

  return <AdOverlay ad={currentAd} secondAd={secondAd} onClose={dismissAd} />;
}
