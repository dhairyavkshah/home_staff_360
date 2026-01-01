import { Capacitor } from "@capacitor/core";
import { COUNTRIES, getDefaultCurrencyForCountry, type Currency } from "@shared/schema";

interface GeolocationResult {
  countryCode: string;
  currency: Currency;
  success: boolean;
}

const GEOLOCATION_STORAGE_KEY = "hs360_detected_country";

class GeolocationService {
  private isNative = Capacitor.isNativePlatform();

  async detectCountry(): Promise<GeolocationResult> {
    const cached = this.getCachedCountry();
    if (cached) {
      return {
        countryCode: cached,
        currency: getDefaultCurrencyForCountry(cached),
        success: true,
      };
    }

    try {
      const position = await this.getCurrentPosition();
      if (position) {
        const countryCode = await this.reverseGeocode(position.latitude, position.longitude);
        if (countryCode) {
          this.setCachedCountry(countryCode);
          return {
            countryCode,
            currency: getDefaultCurrencyForCountry(countryCode),
            success: true,
          };
        }
      }
    } catch (error) {
      console.log("Geolocation detection failed:", error);
    }

    return {
      countryCode: "US",
      currency: "USD",
      success: false,
    };
  }

  private async getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000,
        }
      );
    });
  }

  private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3`,
        {
          headers: {
            "User-Agent": "HomeStaff360/1.0",
          },
        }
      );
      
      if (!response.ok) {
        return this.getCountryFromCoordinates(lat, lon);
      }

      const data = await response.json();
      const countryCode = data.address?.country_code?.toUpperCase();
      
      if (countryCode && COUNTRIES.some(c => c.code === countryCode)) {
        return countryCode;
      }
      
      return this.getCountryFromCoordinates(lat, lon);
    } catch {
      return this.getCountryFromCoordinates(lat, lon);
    }
  }

  private getCountryFromCoordinates(lat: number, lon: number): string | null {
    if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97) {
      return "IN";
    }
    if (lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66) {
      return "US";
    }
    if (lat >= 50 && lat <= 60 && lon >= -8 && lon <= 2) {
      return "GB";
    }
    if (lat >= 22 && lat <= 26 && lon >= 51 && lon <= 56) {
      return "AE";
    }
    if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154) {
      return "AU";
    }
    if (lat >= 43 && lat <= 84 && lon >= -141 && lon <= -52) {
      return "CA";
    }
    if (lat >= 1 && lat <= 2 && lon >= 103 && lon <= 104) {
      return "SG";
    }
    return null;
  }

  private getCachedCountry(): string | null {
    try {
      return localStorage.getItem(GEOLOCATION_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private setCachedCountry(countryCode: string): void {
    try {
      localStorage.setItem(GEOLOCATION_STORAGE_KEY, countryCode);
    } catch {
      // Ignore storage errors
    }
  }

  clearCachedCountry(): void {
    try {
      localStorage.removeItem(GEOLOCATION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  async requestLocationPermission(): Promise<"granted" | "denied"> {
    if (this.isNative) {
      try {
        const position = await this.getCurrentPosition();
        return position ? "granted" : "denied";
      } catch {
        return "denied";
      }
    } else {
      try {
        const position = await this.getCurrentPosition();
        return position ? "granted" : "denied";
      } catch {
        return "denied";
      }
    }
  }

  async checkLocationPermission(): Promise<"granted" | "denied" | "prompt" | "unavailable"> {
    if (!navigator.geolocation) {
      return "unavailable";
    }

    if (!navigator.permissions) {
      return "prompt";
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      switch (result.state) {
        case "granted":
          return "granted";
        case "denied":
          return "denied";
        default:
          return "prompt";
      }
    } catch {
      return "prompt";
    }
  }
}

export const geolocationService = new GeolocationService();
