import { useCallback, useSyncExternalStore } from 'react';
import { storage } from '@/lib/storage';
import { formatCurrency as formatCurrencyFn, getCurrencySymbol as getSymbolFn } from '@/lib/currency';
import type { Currency } from '@shared/schema';

const CURRENCY_CHANGE_EVENT = 'currency-settings-changed';

function subscribeToCurrency(callback: () => void) {
  window.addEventListener(CURRENCY_CHANGE_EVENT, callback);
  return () => window.removeEventListener(CURRENCY_CHANGE_EVENT, callback);
}

function getCurrencySnapshot(): { currency: Currency; customSymbol: string | undefined } {
  const modeSettings = storage.getModeSettings();
  return {
    currency: modeSettings.currency,
    customSymbol: modeSettings.customCurrencySymbol,
  };
}

export function notifyCurrencyChange() {
  window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT));
}

export function useCurrency() {
  const { currency, customSymbol } = useSyncExternalStore(
    subscribeToCurrency,
    getCurrencySnapshot,
    getCurrencySnapshot
  );

  const formatCurrency = useCallback(
    (amount: number) => formatCurrencyFn(amount, currency, customSymbol),
    [currency, customSymbol]
  );

  const getCurrencySymbol = useCallback(
    () => getSymbolFn(currency, customSymbol),
    [currency, customSymbol]
  );

  return {
    currency,
    customSymbol,
    formatCurrency,
    getCurrencySymbol,
  };
}
