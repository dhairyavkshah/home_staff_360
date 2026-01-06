import type { Advertisement, InsertAdImpression } from "@shared/schema";

const AD_LAST_SHOWN_KEY = "hm_ad_last_shown";
const AD_SESSION_ID_KEY = "hm_ad_session_id";
const AD_INTERVAL_MS = 300 * 1000;

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

class AdService {
  private trackingInterval: number | null = null;
  private sessionStartTime: number = 0;

  constructor() {
    this.ensureSessionId();
  }

  private ensureSessionId(): string {
    let sessionId = sessionStorage.getItem(AD_SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(AD_SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  }

  getSessionId(): string {
    return this.ensureSessionId();
  }

  startTracking(): void {
    if (this.trackingInterval) return;
    this.sessionStartTime = Date.now();
  }

  stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  shouldShowAd(): boolean {
    try {
      const lastShownStr = localStorage.getItem(AD_LAST_SHOWN_KEY);
      if (!lastShownStr) {
        return true;
      }

      const lastShown = parseInt(lastShownStr, 10);
      if (isNaN(lastShown)) {
        return true;
      }

      const elapsed = Date.now() - lastShown;
      return elapsed >= AD_INTERVAL_MS;
    } catch {
      return true;
    }
  }

  markAdShown(): void {
    try {
      localStorage.setItem(AD_LAST_SHOWN_KEY, Date.now().toString());
    } catch {
      console.error("Failed to save ad timestamp");
    }
  }

  async getNextAd(): Promise<Advertisement | null> {
    try {
      const response = await fetch("/api/ads/next", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch ad: ${response.status}`);
      }

      const data = await response.json();
      return data.ad || null;
    } catch (error) {
      console.error("Error fetching next ad:", error);
      return null;
    }
  }

  async recordImpression(data: Omit<InsertAdImpression, "sessionId">): Promise<boolean> {
    try {
      const impressionData: InsertAdImpression = {
        ...data,
        sessionId: this.getSessionId(),
      };

      const response = await fetch("/api/ads/impression", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(impressionData),
      });

      return response.ok;
    } catch (error) {
      console.error("Error recording impression:", error);
      return false;
    }
  }

  getTimeSinceLastAd(): number {
    try {
      const lastShownStr = localStorage.getItem(AD_LAST_SHOWN_KEY);
      if (!lastShownStr) {
        return AD_INTERVAL_MS;
      }

      const lastShown = parseInt(lastShownStr, 10);
      if (isNaN(lastShown)) {
        return AD_INTERVAL_MS;
      }

      return Date.now() - lastShown;
    } catch {
      return AD_INTERVAL_MS;
    }
  }

  getTimeUntilNextAd(): number {
    const timeSince = this.getTimeSinceLastAd();
    return Math.max(0, AD_INTERVAL_MS - timeSince);
  }
}

export const adService = new AdService();
export type { AdService };
