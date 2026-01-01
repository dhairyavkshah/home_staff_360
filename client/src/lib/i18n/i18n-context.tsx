import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Language } from "@shared/schema";
import { translations, type TranslationKey } from "./translations";
import { storage } from "@/lib/storage";

interface InterpolationParams {
  [key: string]: string | number;
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: InterpolationParams) => string;
  tLabel: (key: string, fallback: string, params?: InterpolationParams) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const settings = storage.getSettings();
    return settings.language || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    const settings = storage.getSettings();
    storage.saveSettings({ ...settings, language: lang });
  };

  useEffect(() => {
    const settings = storage.getSettings();
    if (settings.language && settings.language !== language) {
      setLanguageState(settings.language);
    }
  }, []);

  const t = (key: TranslationKey, params?: InterpolationParams): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }
    return text;
  };

  const tLabel = (key: string, fallback: string, params?: InterpolationParams): string => {
    const langTranslations = translations[language] as Record<string, string> | undefined;
    const enTranslations = translations.en as Record<string, string>;
    let text = langTranslations?.[key] || enTranslations[key];
    if (!text || text === key) {
      text = fallback;
    }
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, tLabel }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useTranslation() {
  return useI18n();
}
