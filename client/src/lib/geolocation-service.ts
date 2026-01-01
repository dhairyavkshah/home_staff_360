import { storage } from "./storage";
import { type Currency } from "@shared/schema";

export interface CountryInfo {
  code: string;
  name: string;
  currency: Currency;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "GR", name: "Greece", currency: "EUR" },
  { code: "CA", name: "Canada", currency: "USD" },
  { code: "AU", name: "Australia", currency: "USD" },
  { code: "SG", name: "Singapore", currency: "USD" },
  { code: "MY", name: "Malaysia", currency: "USD" },
  { code: "PH", name: "Philippines", currency: "USD" },
  { code: "JP", name: "Japan", currency: "USD" },
  { code: "KR", name: "South Korea", currency: "USD" },
  { code: "CN", name: "China", currency: "USD" },
  { code: "HK", name: "Hong Kong", currency: "USD" },
  { code: "TH", name: "Thailand", currency: "USD" },
  { code: "VN", name: "Vietnam", currency: "USD" },
  { code: "ID", name: "Indonesia", currency: "USD" },
  { code: "SA", name: "Saudi Arabia", currency: "AED" },
  { code: "QA", name: "Qatar", currency: "AED" },
  { code: "KW", name: "Kuwait", currency: "AED" },
  { code: "OM", name: "Oman", currency: "AED" },
  { code: "BH", name: "Bahrain", currency: "AED" },
  { code: "ZA", name: "South Africa", currency: "USD" },
  { code: "NG", name: "Nigeria", currency: "USD" },
  { code: "KE", name: "Kenya", currency: "USD" },
  { code: "EG", name: "Egypt", currency: "USD" },
  { code: "BR", name: "Brazil", currency: "USD" },
  { code: "MX", name: "Mexico", currency: "USD" },
  { code: "AR", name: "Argentina", currency: "USD" },
  { code: "CL", name: "Chile", currency: "USD" },
  { code: "CO", name: "Colombia", currency: "USD" },
  { code: "PK", name: "Pakistan", currency: "USD" },
  { code: "BD", name: "Bangladesh", currency: "USD" },
  { code: "LK", name: "Sri Lanka", currency: "USD" },
  { code: "NP", name: "Nepal", currency: "INR" },
  { code: "BT", name: "Bhutan", currency: "INR" },
];

export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCurrencyForCountry(countryCode: string): Currency {
  const country = getCountryByCode(countryCode);
  return country?.currency || "USD";
}

export async function detectCountryFromLocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const countryCode = await reverseGeocode(latitude, longitude);
          resolve(countryCode);
        } catch {
          resolve(null);
        }
      },
      () => {
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    // Note: Do not set User-Agent header as it's forbidden in browsers
    // OpenStreetMap Nominatim accepts requests without it for client-side apps
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const countryCode = data.address?.country_code?.toUpperCase();
    
    if (countryCode && COUNTRIES.some(c => c.code === countryCode)) {
      return countryCode;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function detectAndSaveCountry(): Promise<{ country: string; currency: Currency } | null> {
  const countryCode = await detectCountryFromLocation();
  
  if (countryCode) {
    const currency = getCurrencyForCountry(countryCode);
    const settings = storage.getSettings();
    
    // Only save if no country is already set - don't overwrite user's manual selection
    const shouldSetCountry = !settings.country;
    const shouldSetCurrency = !settings.currency || settings.currency === "USD";
    
    storage.saveSettings({
      ...settings,
      detectedCountry: countryCode,
      // Only update country/currency if not already set by user
      country: shouldSetCountry ? countryCode : settings.country,
      currency: shouldSetCurrency ? currency : settings.currency,
    });
    
    return { country: countryCode, currency };
  }
  
  return null;
}

export function getDetectedCountry(): string | undefined {
  const settings = storage.getSettings();
  return settings.detectedCountry;
}

export function getUserCountry(): string | undefined {
  const settings = storage.getSettings();
  return settings.country || settings.detectedCountry;
}
