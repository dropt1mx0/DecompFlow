import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { en } from "./en";
import { ru } from "./ru";

export type Language = "en" | "ru";
export type TranslationDict = typeof en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, fallback?: string) => string;
  l: TranslationDict;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "decompflow_language";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ru") {
      return saved;
    }
  } catch {
    // ignore
  }

  // Detect from browser / system
  try {
    if (typeof navigator !== "undefined" && navigator.language) {
      if (navigator.language.toLowerCase().startsWith("ru")) {
        return "ru";
      }
    }
  } catch {
    // ignore
  }

  return "en";
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const l: TranslationDict = useMemo(() => {
    return language === "ru" ? (ru as TranslationDict) : en;
  }, [language]);

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    let current: any = l;
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English dictionary
        let fallbackVal: any = en;
        for (const fk of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && fk in fallbackVal) {
            fallbackVal = fallbackVal[fk];
          } else {
            return fallback ?? keyPath;
          }
        }
        return typeof fallbackVal === "string" ? fallbackVal : fallback ?? keyPath;
      }
    }
    return typeof current === "string" ? current : fallback ?? keyPath;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, l }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      language: "en",
      setLanguage: () => {},
      t: (path: string, fb?: string) => fb ?? path,
      l: en,
    };
  }
  return ctx;
};
