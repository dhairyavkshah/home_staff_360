import { useCallback, useSyncExternalStore, useMemo } from 'react';
import { storage } from '@/lib/storage';
import { formatCurrency as formatCurrencyFn, getCurrencySymbol as getSymbolFn } from '@/lib/currency';
import type { Currency } from '@shared/schema';

let currencyVersion = 0;
const currencyListeners = new Set<() => void>();

function subscribeToCurrency(callback: () => void) {
  currencyListeners.add(callback);
  return () => currencyListeners.delete(callback);
}

function getCurrencySnapshot(): number {
  return currencyVersion;
}

export function notifyCurrencyChange() {
  currencyVersion++;
  currencyListeners.forEach((listener) => listener());
}

export function useCurrency() {
  const version = useSyncExternalStore(
    subscribeToCurrency,
    getCurrencySnapshot,
    getCurrencySnapshot
  );
  
  const { currency, customSymbol } = useMemo(() => {
    const modeSettings = storage.getModeSettings();
    return {
      currency: modeSettings.currency,
      customSymbol: modeSettings.customCurrencySymbol,
    };
  }, [version]);

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
