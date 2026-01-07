import type { Advertisement } from "@shared/schema";
import { adService } from "./ad-service";
import { admobService } from "./admob-service";
import { Capacitor } from "@capacitor/core";

export type AdProvider = "custom" | "admob" | "none";
export type AdSourcePreference = "custom_first" | "admob_first" | "admob_only" | "custom_only";

interface HybridAdConfig {
  sourcePreference: AdSourcePreference;
  admobAppId?: string;
  admobInterstitialId?: string;
  admobRewardedId?: string;
  admobTestMode: boolean;
}

const HYBRID_AD_CONFIG_KEY = "hm_hybrid_ad_config";

class HybridAdService {
  private config: HybridAdConfig = {
    sourcePreference: "custom_first",
    admobTestMode: true,
  };
  private admobInitialized = false;
  private isNativeApp = false;

  constructor() {
    this.isNativeApp = Capacitor.isNativePlatform();
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(HYBRID_AD_CONFIG_KEY);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("[HybridAd] Failed to load config:", error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(HYBRID_AD_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error("[HybridAd] Failed to save config:", error);
    }
  }

  async initialize(): Promise<void> {
    if (this.isNativeApp && !this.admobInitialized) {
      const admobConfig: any = {
        testMode: this.config.admobTestMode,
      };

      if (this.config.admobInterstitialId) {
        admobConfig.interstitialAdUnitId = this.config.admobInterstitialId;
      }
      if (this.config.admobRewardedId) {
        admobConfig.rewardedAdUnitId = this.config.admobRewardedId;
      }

      this.admobInitialized = await admobService.initialize(admobConfig);
      
      if (this.admobInitialized) {
        await admobService.prepareInterstitial();
      }
    }
  }

  updateConfig(newConfig: Partial<HybridAdConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();

    if (newConfig.admobInterstitialId || newConfig.admobRewardedId) {
      admobService.updateConfig({
        interstitialAdUnitId: this.config.admobInterstitialId || "",
        rewardedAdUnitId: this.config.admobRewardedId || "",
        testMode: this.config.admobTestMode,
      });
    }
  }

  getConfig(): HybridAdConfig {
    return { ...this.config };
  }

  shouldShowAd(): boolean {
    return adService.shouldShowAd();
  }

  markAdShown(): void {
    adService.markAdShown();
  }

  async getNextAd(): Promise<{ ad: Advertisement | null; provider: AdProvider }> {
    const preference = this.config.sourcePreference;

    if (preference === "admob_only") {
      return { ad: null, provider: "admob" };
    }

    if (preference === "custom_only" || preference === "custom_first") {
      const customAd = await adService.getNextAd();
      if (customAd) {
        return { ad: customAd, provider: "custom" };
      }
      
      if (preference === "custom_first" && this.isNativeApp && this.admobInitialized) {
        return { ad: null, provider: "admob" };
      }
      
      return { ad: null, provider: "none" };
    }

    if (preference === "admob_first") {
      if (this.isNativeApp && this.admobInitialized) {
        return { ad: null, provider: "admob" };
      }
      
      const customAd = await adService.getNextAd();
      if (customAd) {
        return { ad: customAd, provider: "custom" };
      }
      
      return { ad: null, provider: "none" };
    }

    return { ad: null, provider: "none" };
  }

  async showAdMobInterstitial(): Promise<boolean> {
    if (!this.isNativeApp || !this.admobInitialized) {
      return false;
    }

    const shown = await admobService.showInterstitial();
    
    if (shown) {
      this.markAdShown();
      await admobService.prepareInterstitial();
    }
    
    return shown;
  }

  async showAdMobRewarded(): Promise<{ type: string; amount: number } | null> {
    if (!this.isNativeApp || !this.admobInitialized) {
      return null;
    }

    await admobService.prepareRewardedAd();
    const reward = await admobService.showRewardedAd();
    
    if (reward) {
      this.markAdShown();
    }
    
    return reward;
  }

  async recordCustomAdImpression(
    data: Parameters<typeof adService.recordImpression>[0]
  ): Promise<boolean> {
    return adService.recordImpression(data);
  }

  isNative(): boolean {
    return this.isNativeApp;
  }

  isAdMobReady(): boolean {
    return this.admobInitialized;
  }

  getSourcePreference(): AdSourcePreference {
    return this.config.sourcePreference;
  }
}

export const hybridAdService = new HybridAdService();
