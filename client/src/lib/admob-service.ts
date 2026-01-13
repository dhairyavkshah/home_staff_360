import { Capacitor } from "@capacitor/core";
import { 
  AdMob, 
  AdOptions, 
  InterstitialAdPluginEvents, 
  RewardAdPluginEvents, 
  AdLoadInfo,
  AdmobConsentStatus,
  AdmobConsentDebugGeography,
  RewardAdOptions
} from "@capacitor-community/admob";

export type AdType = "interstitial" | "rewarded" | "banner";

interface AdMobConfig {
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
  bannerAdUnitId: string;
  testMode: boolean;
}

const DEFAULT_TEST_AD_UNITS = {
  interstitialAdUnitId: "ca-app-pub-3940256099942544/1033173712",
  rewardedAdUnitId: "ca-app-pub-3940256099942544/5224354917",
  bannerAdUnitId: "ca-app-pub-3940256099942544/6300978111",
  testMode: true,
};

class AdMobService {
  private initialized = false;
  private config: AdMobConfig = DEFAULT_TEST_AD_UNITS;
  private isNativeEnvironment = false;
  private consentStatus: AdmobConsentStatus | null = null;

  constructor() {
    this.isNativeEnvironment = Capacitor.isNativePlatform();
  }

  async initialize(customConfig?: Partial<AdMobConfig>): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    if (!this.isNativeEnvironment) {
      console.log("[AdMob] Not a native platform, skipping initialization");
      return false;
    }

    try {
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }

      await AdMob.initialize({
        testingDevices: this.config.testMode ? ["EMULATOR"] : [],
        initializeForTesting: this.config.testMode,
      });

      await this.requestConsentInfo();

      this.setupListeners();
      this.initialized = true;
      console.log("[AdMob] Initialized successfully");
      return true;
    } catch (error) {
      console.error("[AdMob] Failed to initialize:", error);
      return false;
    }
  }

  private async requestConsentInfo(): Promise<void> {
    try {
      const consentInfo = await AdMob.requestConsentInfo({
        debugGeography: this.config.testMode 
          ? AdmobConsentDebugGeography.EEA 
          : AdmobConsentDebugGeography.DISABLED,
        testDeviceIdentifiers: this.config.testMode ? ["EMULATOR"] : [],
      });

      this.consentStatus = consentInfo.status;

      if (consentInfo.isConsentFormAvailable && this.consentStatus === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm();
      }
    } catch (error) {
      console.error("[AdMob] Consent request failed:", error);
    }
  }

  private setupListeners(): void {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      console.log("[AdMob] Interstitial ad loaded");
    });

    AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      console.log("[AdMob] Interstitial ad shown");
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log("[AdMob] Interstitial ad dismissed");
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
      console.error("[AdMob] Interstitial ad failed to load:", error);
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error) => {
      console.error("[AdMob] Interstitial ad failed to show:", error);
    });

    AdMob.addListener(RewardAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      console.log("[AdMob] Rewarded ad loaded");
    });

    AdMob.addListener(RewardAdPluginEvents.Showed, () => {
      console.log("[AdMob] Rewarded ad shown");
    });

    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
      console.log("[AdMob] User earned reward:", reward);
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log("[AdMob] Rewarded ad dismissed");
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
      console.error("[AdMob] Rewarded ad failed to load:", error);
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
      console.error("[AdMob] Rewarded ad failed to show:", error);
    });
  }

  async prepareInterstitial(): Promise<boolean> {
    if (!this.initialized || !this.isNativeEnvironment) {
      return false;
    }

    try {
      const options: AdOptions = {
        adId: this.config.interstitialAdUnitId,
        isTesting: this.config.testMode,
      };

      await AdMob.prepareInterstitial(options);
      return true;
    } catch (error) {
      console.error("[AdMob] Failed to prepare interstitial:", error);
      return false;
    }
  }

  async showInterstitial(): Promise<boolean> {
    if (!this.initialized || !this.isNativeEnvironment) {
      return false;
    }

    try {
      await AdMob.showInterstitial();
      return true;
    } catch (error) {
      console.error("[AdMob] Failed to show interstitial:", error);
      return false;
    }
  }

  async prepareRewardedAd(): Promise<boolean> {
    if (!this.initialized || !this.isNativeEnvironment) {
      return false;
    }

    try {
      const options: RewardAdOptions = {
        adId: this.config.rewardedAdUnitId,
        isTesting: this.config.testMode,
      };

      await AdMob.prepareRewardVideoAd(options);
      return true;
    } catch (error) {
      console.error("[AdMob] Failed to prepare rewarded ad:", error);
      return false;
    }
  }

  async showRewardedAd(): Promise<{ type: string; amount: number } | null> {
    if (!this.initialized || !this.isNativeEnvironment) {
      return null;
    }

    return new Promise(async (resolve) => {
      let rewardListener: Awaited<ReturnType<typeof AdMob.addListener>> | null = null;
      let dismissListener: Awaited<ReturnType<typeof AdMob.addListener>> | null = null;

      const cleanup = async () => {
        if (rewardListener) await rewardListener.remove();
        if (dismissListener) await dismissListener.remove();
      };

      rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, async (reward) => {
        await cleanup();
        resolve({ type: reward.type, amount: reward.amount });
      });

      dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
        await cleanup();
        resolve(null);
      });

      try {
        await AdMob.showRewardVideoAd();
      } catch (error) {
        console.error("[AdMob] Failed to show rewarded ad:", error);
        await cleanup();
        resolve(null);
      }
    });
  }

  updateConfig(config: Partial<AdMobConfig>): void {
    this.config = { ...this.config, ...config };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isNative(): boolean {
    return this.isNativeEnvironment;
  }

  getConsentStatus(): AdmobConsentStatus | null {
    return this.consentStatus;
  }
}

export const admobService = new AdMobService();
