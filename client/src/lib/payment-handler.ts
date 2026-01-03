import { Capacitor } from "@capacitor/core";

export interface PaymentConfig {
  upiId: string;
  payeeName: string;
  paypalUsername: string;
  transactionNote: string;
}

export interface PaymentResult {
  success: boolean;
  method: "upi" | "paypal" | "manual";
  amount: number;
  currency: string;
}

const DEFAULT_CONFIG: PaymentConfig = {
  upiId: "dhairyavkshah@okhdfcbank",
  payeeName: "Dhairya Shah",
  paypalUsername: "dhairyavkshah",
  transactionNote: "Support HomeStaff360",
};

const DONOR_STORAGE_KEY = "hs360_donor_status";

export function validateAmount(amount: string | number): number | null {
  const parsed = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(parsed) || parsed <= 0 || !isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

export function buildUpiUrl(amount: number, config: PaymentConfig = DEFAULT_CONFIG): string {
  const validAmount = validateAmount(amount);
  if (!validAmount) {
    throw new Error("Invalid amount for UPI payment");
  }
  
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: config.payeeName,
    am: validAmount.toString(),
    cu: "INR",
    tn: config.transactionNote,
  });
  
  return `upi://pay?${params.toString()}`;
}

export function buildPayPalUrl(amount: number, currency: string, config: PaymentConfig = DEFAULT_CONFIG): string {
  const validAmount = validateAmount(amount);
  if (!validAmount) {
    throw new Error("Invalid amount for PayPal payment");
  }
  
  const currencyCode = currency.toUpperCase();
  return `https://www.paypal.me/${config.paypalUsername}/${validAmount}${currencyCode}`;
}

export function openUpiPayment(amount: number, config: PaymentConfig = DEFAULT_CONFIG): boolean {
  try {
    const validAmount = validateAmount(amount);
    if (!validAmount) {
      return false;
    }
    
    const upiUrl = buildUpiUrl(validAmount, config);
    
    if (Capacitor.isNativePlatform()) {
      window.open(upiUrl, "_system");
    } else {
      window.location.href = upiUrl;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to open UPI payment:", error);
    return false;
  }
}

export function openPayPalPayment(amount: number, currency: string, config: PaymentConfig = DEFAULT_CONFIG): boolean {
  try {
    const validAmount = validateAmount(amount);
    if (!validAmount) {
      return false;
    }
    
    const paypalUrl = buildPayPalUrl(validAmount, currency, config);
    window.open(paypalUrl, "_blank");
    
    return true;
  } catch (error) {
    console.error("Failed to open PayPal payment:", error);
    return false;
  }
}

export function markAsDonor(): void {
  try {
    localStorage.setItem(DONOR_STORAGE_KEY, JSON.stringify({
      isDonor: true,
      donatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Failed to save donor status:", error);
  }
}

export function getDonorStatus(): { isDonor: boolean; donatedAt: string | null } {
  try {
    const stored = localStorage.getItem(DONOR_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        isDonor: parsed.isDonor || false,
        donatedAt: parsed.donatedAt || null,
      };
    }
  } catch (error) {
    console.error("Failed to get donor status:", error);
  }
  return { isDonor: false, donatedAt: null };
}

export function isIndianUser(countryCode: string): boolean {
  return ["IN", "NP", "BT"].includes(countryCode.toUpperCase());
}

export const paymentConfig = DEFAULT_CONFIG;
