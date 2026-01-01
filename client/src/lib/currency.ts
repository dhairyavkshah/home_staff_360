import { CURRENCIES, type Currency } from "@shared/schema";

export type CurrencyCode = Currency;

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "USD",
  customSymbol?: string
): string {
  const config = CURRENCIES[currency];
  const symbol = currency === "OTHER" && customSymbol ? customSymbol : config.symbol;
  
  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
    
    const formattedNumber = formatter.format(Math.abs(amount));
    const sign = amount < 0 ? "-" : "";
    
    return `${sign}${symbol}${formattedNumber}`;
  } catch {
    return `${symbol}${amount.toFixed(config.decimals)}`;
  }
}

export function getCurrencySymbol(currency: CurrencyCode, customSymbol?: string): string {
  if (currency === "OTHER" && customSymbol) {
    return customSymbol;
  }
  return CURRENCIES[currency].symbol;
}

export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCIES[currency].name;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
