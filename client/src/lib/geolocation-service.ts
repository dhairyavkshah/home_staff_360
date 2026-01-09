import { storage } from "./storage";
import { type Currency } from "@shared/schema";
// @ts-ignore - google-libphonenumber has no types but works correctly
import libphonenumber from "google-libphonenumber";
const PhoneNumberUtil = libphonenumber.PhoneNumberUtil;

export interface CountryInfo {
  code: string;
  name: string;
  currency: Currency;
}

// Complete list of ISO 3166-1 countries in alphabetical order
// Currency mappings: Use actual national currency for each country
export const COUNTRIES: CountryInfo[] = [
  { code: "AF", name: "Afghanistan", currency: "USD" },
  { code: "AL", name: "Albania", currency: "ALL" },
  { code: "DZ", name: "Algeria", currency: "DZD" },
  { code: "AD", name: "Andorra", currency: "EUR" },
  { code: "AO", name: "Angola", currency: "USD" },
  { code: "AG", name: "Antigua and Barbuda", currency: "XCD" },
  { code: "AR", name: "Argentina", currency: "ARS" },
  { code: "AM", name: "Armenia", currency: "AMD" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "AZ", name: "Azerbaijan", currency: "AZN" },
  { code: "BS", name: "Bahamas", currency: "BSD" },
  { code: "BH", name: "Bahrain", currency: "BHD" },
  { code: "BD", name: "Bangladesh", currency: "BDT" },
  { code: "BB", name: "Barbados", currency: "BBD" },
  { code: "BY", name: "Belarus", currency: "BYN" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "BZ", name: "Belize", currency: "BZD" },
  { code: "BJ", name: "Benin", currency: "XOF" },
  { code: "BT", name: "Bhutan", currency: "INR" },
  { code: "BO", name: "Bolivia", currency: "BOB" },
  { code: "BA", name: "Bosnia and Herzegovina", currency: "BAM" },
  { code: "BW", name: "Botswana", currency: "BWP" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "BN", name: "Brunei", currency: "USD" },
  { code: "BG", name: "Bulgaria", currency: "BGN" },
  { code: "BF", name: "Burkina Faso", currency: "XOF" },
  { code: "BI", name: "Burundi", currency: "USD" },
  { code: "CV", name: "Cabo Verde", currency: "CVE" },
  { code: "KH", name: "Cambodia", currency: "KHR" },
  { code: "CM", name: "Cameroon", currency: "XAF" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "CF", name: "Central African Republic", currency: "XAF" },
  { code: "TD", name: "Chad", currency: "XAF" },
  { code: "CL", name: "Chile", currency: "CLP" },
  { code: "CN", name: "China", currency: "CNY" },
  { code: "CO", name: "Colombia", currency: "COP" },
  { code: "KM", name: "Comoros", currency: "KMF" },
  { code: "CG", name: "Congo", currency: "XAF" },
  { code: "CD", name: "Congo (Democratic Republic)", currency: "CDF" },
  { code: "CR", name: "Costa Rica", currency: "CRC" },
  { code: "CI", name: "Cote d'Ivoire", currency: "XOF" },
  { code: "HR", name: "Croatia", currency: "EUR" },
  { code: "CU", name: "Cuba", currency: "CUP" },
  { code: "CY", name: "Cyprus", currency: "EUR" },
  { code: "CZ", name: "Czech Republic", currency: "CZK" },
  { code: "DK", name: "Denmark", currency: "DKK" },
  { code: "DJ", name: "Djibouti", currency: "DJF" },
  { code: "DM", name: "Dominica", currency: "XCD" },
  { code: "DO", name: "Dominican Republic", currency: "DOP" },
  { code: "EC", name: "Ecuador", currency: "USD" },
  { code: "EG", name: "Egypt", currency: "EGP" },
  { code: "SV", name: "El Salvador", currency: "USD" },
  { code: "GQ", name: "Equatorial Guinea", currency: "XAF" },
  { code: "ER", name: "Eritrea", currency: "ERN" },
  { code: "EE", name: "Estonia", currency: "EUR" },
  { code: "SZ", name: "Eswatini", currency: "USD" },
  { code: "ET", name: "Ethiopia", currency: "ETB" },
  { code: "FJ", name: "Fiji", currency: "FJD" },
  { code: "FI", name: "Finland", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "GA", name: "Gabon", currency: "XAF" },
  { code: "GM", name: "Gambia", currency: "GMD" },
  { code: "GE", name: "Georgia", currency: "GEL" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "GR", name: "Greece", currency: "EUR" },
  { code: "GD", name: "Grenada", currency: "XCD" },
  { code: "GT", name: "Guatemala", currency: "GTQ" },
  { code: "GN", name: "Guinea", currency: "GNF" },
  { code: "GW", name: "Guinea-Bissau", currency: "XOF" },
  { code: "GY", name: "Guyana", currency: "GYD" },
  { code: "HT", name: "Haiti", currency: "HTG" },
  { code: "HN", name: "Honduras", currency: "HNL" },
  { code: "HK", name: "Hong Kong", currency: "HKD" },
  { code: "HU", name: "Hungary", currency: "HUF" },
  { code: "IS", name: "Iceland", currency: "ISK" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "ID", name: "Indonesia", currency: "IDR" },
  { code: "IR", name: "Iran", currency: "IRR" },
  { code: "IQ", name: "Iraq", currency: "IQD" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "IL", name: "Israel", currency: "ILS" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "JM", name: "Jamaica", currency: "JMD" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "JO", name: "Jordan", currency: "JOD" },
  { code: "KZ", name: "Kazakhstan", currency: "KZT" },
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "KI", name: "Kiribati", currency: "USD" },
  { code: "KP", name: "Korea (North)", currency: "USD" },
  { code: "KR", name: "Korea (South)", currency: "KRW" },
  { code: "KW", name: "Kuwait", currency: "KWD" },
  { code: "KG", name: "Kyrgyzstan", currency: "KGS" },
  { code: "LA", name: "Laos", currency: "LAK" },
  { code: "LV", name: "Latvia", currency: "EUR" },
  { code: "LB", name: "Lebanon", currency: "LBP" },
  { code: "LS", name: "Lesotho", currency: "USD" },
  { code: "LR", name: "Liberia", currency: "LRD" },
  { code: "LY", name: "Libya", currency: "LYD" },
  { code: "LI", name: "Liechtenstein", currency: "CHF" },
  { code: "LT", name: "Lithuania", currency: "EUR" },
  { code: "LU", name: "Luxembourg", currency: "EUR" },
  { code: "MO", name: "Macau", currency: "MOP" },
  { code: "MG", name: "Madagascar", currency: "USD" },
  { code: "MW", name: "Malawi", currency: "USD" },
  { code: "MY", name: "Malaysia", currency: "MYR" },
  { code: "MV", name: "Maldives", currency: "MVR" },
  { code: "ML", name: "Mali", currency: "XOF" },
  { code: "MT", name: "Malta", currency: "EUR" },
  { code: "MH", name: "Marshall Islands", currency: "USD" },
  { code: "MR", name: "Mauritania", currency: "USD" },
  { code: "MU", name: "Mauritius", currency: "MUR" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "FM", name: "Micronesia", currency: "USD" },
  { code: "MD", name: "Moldova", currency: "MDL" },
  { code: "MC", name: "Monaco", currency: "EUR" },
  { code: "MN", name: "Mongolia", currency: "MNT" },
  { code: "ME", name: "Montenegro", currency: "EUR" },
  { code: "MA", name: "Morocco", currency: "MAD" },
  { code: "MZ", name: "Mozambique", currency: "MZN" },
  { code: "MM", name: "Myanmar", currency: "MMK" },
  { code: "NA", name: "Namibia", currency: "NAD" },
  { code: "NR", name: "Nauru", currency: "USD" },
  { code: "NP", name: "Nepal", currency: "NPR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "NI", name: "Nicaragua", currency: "NIO" },
  { code: "NE", name: "Niger", currency: "XOF" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "MK", name: "North Macedonia", currency: "MKD" },
  { code: "NO", name: "Norway", currency: "NOK" },
  { code: "OM", name: "Oman", currency: "OMR" },
  { code: "PK", name: "Pakistan", currency: "PKR" },
  { code: "PW", name: "Palau", currency: "USD" },
  { code: "PS", name: "Palestine", currency: "USD" },
  { code: "PA", name: "Panama", currency: "USD" },
  { code: "PG", name: "Papua New Guinea", currency: "PGK" },
  { code: "PY", name: "Paraguay", currency: "PYG" },
  { code: "PE", name: "Peru", currency: "PEN" },
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "PL", name: "Poland", currency: "PLN" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "QA", name: "Qatar", currency: "QAR" },
  { code: "RO", name: "Romania", currency: "RON" },
  { code: "RU", name: "Russia", currency: "RUB" },
  { code: "RW", name: "Rwanda", currency: "RWF" },
  { code: "KN", name: "Saint Kitts and Nevis", currency: "XCD" },
  { code: "LC", name: "Saint Lucia", currency: "XCD" },
  { code: "VC", name: "Saint Vincent and the Grenadines", currency: "XCD" },
  { code: "WS", name: "Samoa", currency: "WST" },
  { code: "SM", name: "San Marino", currency: "EUR" },
  { code: "ST", name: "Sao Tome and Principe", currency: "USD" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "SN", name: "Senegal", currency: "XOF" },
  { code: "RS", name: "Serbia", currency: "RSD" },
  { code: "SC", name: "Seychelles", currency: "SCR" },
  { code: "SL", name: "Sierra Leone", currency: "SLL" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "SK", name: "Slovakia", currency: "EUR" },
  { code: "SI", name: "Slovenia", currency: "EUR" },
  { code: "SB", name: "Solomon Islands", currency: "SBD" },
  { code: "SO", name: "Somalia", currency: "SOS" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "SS", name: "South Sudan", currency: "USD" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "LK", name: "Sri Lanka", currency: "LKR" },
  { code: "SD", name: "Sudan", currency: "SDG" },
  { code: "SR", name: "Suriname", currency: "SRD" },
  { code: "SE", name: "Sweden", currency: "SEK" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "SY", name: "Syria", currency: "USD" },
  { code: "TW", name: "Taiwan", currency: "TWD" },
  { code: "TJ", name: "Tajikistan", currency: "TJS" },
  { code: "TZ", name: "Tanzania", currency: "TZS" },
  { code: "TH", name: "Thailand", currency: "THB" },
  { code: "TL", name: "Timor-Leste", currency: "USD" },
  { code: "TG", name: "Togo", currency: "XOF" },
  { code: "TO", name: "Tonga", currency: "TOP" },
  { code: "TT", name: "Trinidad and Tobago", currency: "TTD" },
  { code: "TN", name: "Tunisia", currency: "TND" },
  { code: "TR", name: "Turkey", currency: "TRY" },
  { code: "TM", name: "Turkmenistan", currency: "TMT" },
  { code: "TV", name: "Tuvalu", currency: "USD" },
  { code: "UG", name: "Uganda", currency: "UGX" },
  { code: "UA", name: "Ukraine", currency: "UAH" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "UY", name: "Uruguay", currency: "UYU" },
  { code: "UZ", name: "Uzbekistan", currency: "UZS" },
  { code: "VU", name: "Vanuatu", currency: "VUV" },
  { code: "VA", name: "Vatican City", currency: "EUR" },
  { code: "VE", name: "Venezuela", currency: "VES" },
  { code: "VN", name: "Vietnam", currency: "VND" },
  { code: "YE", name: "Yemen", currency: "YER" },
  { code: "ZM", name: "Zambia", currency: "ZMW" },
  { code: "ZW", name: "Zimbabwe", currency: "ZWL" },
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

export function detectCountryFromPhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber) return null;
  
  try {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/-/g, "");
    
    const parsedNumber = phoneUtil.parse(cleanPhone);
    
    if (!phoneUtil.isValidNumber(parsedNumber)) {
      return null;
    }
    
    const regionCode = phoneUtil.getRegionCodeForNumber(parsedNumber);
    
    if (regionCode && COUNTRIES.some(c => c.code === regionCode)) {
      return regionCode;
    }
    
    return null;
  } catch {
    return null;
  }
}
