import { storage } from "./storage";
import { type Currency } from "@shared/schema";

export interface CountryInfo {
  code: string;
  name: string;
  currency: Currency;
}

// Complete list of ISO 3166-1 countries in alphabetical order
// Currency mappings: Use actual currency where supported, USD as fallback
export const COUNTRIES: CountryInfo[] = [
  { code: "AF", name: "Afghanistan", currency: "USD" },
  { code: "AL", name: "Albania", currency: "EUR" },
  { code: "DZ", name: "Algeria", currency: "USD" },
  { code: "AD", name: "Andorra", currency: "EUR" },
  { code: "AO", name: "Angola", currency: "USD" },
  { code: "AG", name: "Antigua and Barbuda", currency: "USD" },
  { code: "AR", name: "Argentina", currency: "USD" },
  { code: "AM", name: "Armenia", currency: "USD" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "AZ", name: "Azerbaijan", currency: "USD" },
  { code: "BS", name: "Bahamas", currency: "USD" },
  { code: "BH", name: "Bahrain", currency: "USD" },
  { code: "BD", name: "Bangladesh", currency: "USD" },
  { code: "BB", name: "Barbados", currency: "USD" },
  { code: "BY", name: "Belarus", currency: "USD" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "BZ", name: "Belize", currency: "USD" },
  { code: "BJ", name: "Benin", currency: "USD" },
  { code: "BT", name: "Bhutan", currency: "INR" },
  { code: "BO", name: "Bolivia", currency: "USD" },
  { code: "BA", name: "Bosnia and Herzegovina", currency: "EUR" },
  { code: "BW", name: "Botswana", currency: "USD" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "BN", name: "Brunei", currency: "USD" },
  { code: "BG", name: "Bulgaria", currency: "EUR" },
  { code: "BF", name: "Burkina Faso", currency: "USD" },
  { code: "BI", name: "Burundi", currency: "USD" },
  { code: "CV", name: "Cabo Verde", currency: "USD" },
  { code: "KH", name: "Cambodia", currency: "USD" },
  { code: "CM", name: "Cameroon", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "CF", name: "Central African Republic", currency: "USD" },
  { code: "TD", name: "Chad", currency: "USD" },
  { code: "CL", name: "Chile", currency: "USD" },
  { code: "CN", name: "China", currency: "CNY" },
  { code: "CO", name: "Colombia", currency: "USD" },
  { code: "KM", name: "Comoros", currency: "USD" },
  { code: "CG", name: "Congo", currency: "USD" },
  { code: "CD", name: "Congo (Democratic Republic)", currency: "USD" },
  { code: "CR", name: "Costa Rica", currency: "USD" },
  { code: "CI", name: "Cote d'Ivoire", currency: "USD" },
  { code: "HR", name: "Croatia", currency: "EUR" },
  { code: "CU", name: "Cuba", currency: "USD" },
  { code: "CY", name: "Cyprus", currency: "EUR" },
  { code: "CZ", name: "Czech Republic", currency: "CZK" },
  { code: "DK", name: "Denmark", currency: "DKK" },
  { code: "DJ", name: "Djibouti", currency: "USD" },
  { code: "DM", name: "Dominica", currency: "USD" },
  { code: "DO", name: "Dominican Republic", currency: "USD" },
  { code: "EC", name: "Ecuador", currency: "USD" },
  { code: "EG", name: "Egypt", currency: "USD" },
  { code: "SV", name: "El Salvador", currency: "USD" },
  { code: "GQ", name: "Equatorial Guinea", currency: "USD" },
  { code: "ER", name: "Eritrea", currency: "USD" },
  { code: "EE", name: "Estonia", currency: "EUR" },
  { code: "SZ", name: "Eswatini", currency: "USD" },
  { code: "ET", name: "Ethiopia", currency: "USD" },
  { code: "FJ", name: "Fiji", currency: "USD" },
  { code: "FI", name: "Finland", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "GA", name: "Gabon", currency: "USD" },
  { code: "GM", name: "Gambia", currency: "USD" },
  { code: "GE", name: "Georgia", currency: "USD" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "GH", name: "Ghana", currency: "USD" },
  { code: "GR", name: "Greece", currency: "EUR" },
  { code: "GD", name: "Grenada", currency: "USD" },
  { code: "GT", name: "Guatemala", currency: "USD" },
  { code: "GN", name: "Guinea", currency: "USD" },
  { code: "GW", name: "Guinea-Bissau", currency: "USD" },
  { code: "GY", name: "Guyana", currency: "USD" },
  { code: "HT", name: "Haiti", currency: "USD" },
  { code: "HN", name: "Honduras", currency: "USD" },
  { code: "HK", name: "Hong Kong", currency: "HKD" },
  { code: "HU", name: "Hungary", currency: "HUF" },
  { code: "IS", name: "Iceland", currency: "USD" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "ID", name: "Indonesia", currency: "USD" },
  { code: "IR", name: "Iran", currency: "USD" },
  { code: "IQ", name: "Iraq", currency: "USD" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "IL", name: "Israel", currency: "ILS" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "JM", name: "Jamaica", currency: "USD" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "JO", name: "Jordan", currency: "USD" },
  { code: "KZ", name: "Kazakhstan", currency: "USD" },
  { code: "KE", name: "Kenya", currency: "USD" },
  { code: "KI", name: "Kiribati", currency: "USD" },
  { code: "KP", name: "Korea (North)", currency: "USD" },
  { code: "KR", name: "Korea (South)", currency: "USD" },
  { code: "KW", name: "Kuwait", currency: "USD" },
  { code: "KG", name: "Kyrgyzstan", currency: "USD" },
  { code: "LA", name: "Laos", currency: "USD" },
  { code: "LV", name: "Latvia", currency: "EUR" },
  { code: "LB", name: "Lebanon", currency: "USD" },
  { code: "LS", name: "Lesotho", currency: "USD" },
  { code: "LR", name: "Liberia", currency: "USD" },
  { code: "LY", name: "Libya", currency: "USD" },
  { code: "LI", name: "Liechtenstein", currency: "CHF" },
  { code: "LT", name: "Lithuania", currency: "EUR" },
  { code: "LU", name: "Luxembourg", currency: "EUR" },
  { code: "MO", name: "Macau", currency: "USD" },
  { code: "MG", name: "Madagascar", currency: "USD" },
  { code: "MW", name: "Malawi", currency: "USD" },
  { code: "MY", name: "Malaysia", currency: "USD" },
  { code: "MV", name: "Maldives", currency: "USD" },
  { code: "ML", name: "Mali", currency: "USD" },
  { code: "MT", name: "Malta", currency: "EUR" },
  { code: "MH", name: "Marshall Islands", currency: "USD" },
  { code: "MR", name: "Mauritania", currency: "USD" },
  { code: "MU", name: "Mauritius", currency: "USD" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "FM", name: "Micronesia", currency: "USD" },
  { code: "MD", name: "Moldova", currency: "USD" },
  { code: "MC", name: "Monaco", currency: "EUR" },
  { code: "MN", name: "Mongolia", currency: "USD" },
  { code: "ME", name: "Montenegro", currency: "EUR" },
  { code: "MA", name: "Morocco", currency: "USD" },
  { code: "MZ", name: "Mozambique", currency: "USD" },
  { code: "MM", name: "Myanmar", currency: "USD" },
  { code: "NA", name: "Namibia", currency: "USD" },
  { code: "NR", name: "Nauru", currency: "USD" },
  { code: "NP", name: "Nepal", currency: "INR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "NI", name: "Nicaragua", currency: "USD" },
  { code: "NE", name: "Niger", currency: "USD" },
  { code: "NG", name: "Nigeria", currency: "USD" },
  { code: "MK", name: "North Macedonia", currency: "USD" },
  { code: "NO", name: "Norway", currency: "NOK" },
  { code: "OM", name: "Oman", currency: "USD" },
  { code: "PK", name: "Pakistan", currency: "USD" },
  { code: "PW", name: "Palau", currency: "USD" },
  { code: "PS", name: "Palestine", currency: "USD" },
  { code: "PA", name: "Panama", currency: "USD" },
  { code: "PG", name: "Papua New Guinea", currency: "USD" },
  { code: "PY", name: "Paraguay", currency: "USD" },
  { code: "PE", name: "Peru", currency: "USD" },
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "PL", name: "Poland", currency: "PLN" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "QA", name: "Qatar", currency: "USD" },
  { code: "RO", name: "Romania", currency: "EUR" },
  { code: "RU", name: "Russia", currency: "RUB" },
  { code: "RW", name: "Rwanda", currency: "USD" },
  { code: "KN", name: "Saint Kitts and Nevis", currency: "USD" },
  { code: "LC", name: "Saint Lucia", currency: "USD" },
  { code: "VC", name: "Saint Vincent and the Grenadines", currency: "USD" },
  { code: "WS", name: "Samoa", currency: "USD" },
  { code: "SM", name: "San Marino", currency: "EUR" },
  { code: "ST", name: "Sao Tome and Principe", currency: "USD" },
  { code: "SA", name: "Saudi Arabia", currency: "USD" },
  { code: "SN", name: "Senegal", currency: "USD" },
  { code: "RS", name: "Serbia", currency: "USD" },
  { code: "SC", name: "Seychelles", currency: "USD" },
  { code: "SL", name: "Sierra Leone", currency: "USD" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "SK", name: "Slovakia", currency: "EUR" },
  { code: "SI", name: "Slovenia", currency: "EUR" },
  { code: "SB", name: "Solomon Islands", currency: "USD" },
  { code: "SO", name: "Somalia", currency: "USD" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "SS", name: "South Sudan", currency: "USD" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "LK", name: "Sri Lanka", currency: "USD" },
  { code: "SD", name: "Sudan", currency: "USD" },
  { code: "SR", name: "Suriname", currency: "USD" },
  { code: "SE", name: "Sweden", currency: "SEK" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "SY", name: "Syria", currency: "USD" },
  { code: "TW", name: "Taiwan", currency: "TWD" },
  { code: "TJ", name: "Tajikistan", currency: "USD" },
  { code: "TZ", name: "Tanzania", currency: "USD" },
  { code: "TH", name: "Thailand", currency: "THB" },
  { code: "TL", name: "Timor-Leste", currency: "USD" },
  { code: "TG", name: "Togo", currency: "USD" },
  { code: "TO", name: "Tonga", currency: "USD" },
  { code: "TT", name: "Trinidad and Tobago", currency: "USD" },
  { code: "TN", name: "Tunisia", currency: "USD" },
  { code: "TR", name: "Turkey", currency: "USD" },
  { code: "TM", name: "Turkmenistan", currency: "USD" },
  { code: "TV", name: "Tuvalu", currency: "USD" },
  { code: "UG", name: "Uganda", currency: "USD" },
  { code: "UA", name: "Ukraine", currency: "USD" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "UY", name: "Uruguay", currency: "USD" },
  { code: "UZ", name: "Uzbekistan", currency: "USD" },
  { code: "VU", name: "Vanuatu", currency: "USD" },
  { code: "VA", name: "Vatican City", currency: "EUR" },
  { code: "VE", name: "Venezuela", currency: "USD" },
  { code: "VN", name: "Vietnam", currency: "USD" },
  { code: "YE", name: "Yemen", currency: "USD" },
  { code: "ZM", name: "Zambia", currency: "USD" },
  { code: "ZW", name: "Zimbabwe", currency: "USD" },
];

export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCurrencyForCountry(countryCode: string): Currency {
  const country = getCountryByCode(countryCode);
  return country?.currency || "USD";
}

let cachedCountryCode: string | null = null;

export async function detectCountryFromIP(): Promise<string | null> {
  if (cachedCountryCode) {
    return cachedCountryCode;
  }

  const apis = [
    async () => {
      const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      return data.country_code?.toUpperCase();
    },
    async () => {
      const response = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      return data.country?.toUpperCase();
    },
    async () => {
      const response = await fetch('https://freeipapi.com/api/json/', { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      return data.countryCode?.toUpperCase();
    },
  ];

  for (const apiFn of apis) {
    try {
      const countryCode = await apiFn();
      if (countryCode && COUNTRIES.some(c => c.code === countryCode)) {
        cachedCountryCode = countryCode;
        return countryCode;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function detectCountryFromLocation(): Promise<string | null> {
  const ipCountry = await detectCountryFromIP();
  if (ipCountry) {
    return ipCountry;
  }

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
