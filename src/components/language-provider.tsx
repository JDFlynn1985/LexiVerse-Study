
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { locales, LocaleType } from '@/lib/locales';

/**
 * @fileOverview Language Provider integrated with i18nexus and i18next.
 * Maintains backward compatibility for existing object-style translation access.
 */

interface LanguageContextType {
  language: LocaleType;
  setLanguage: (lang: LocaleType) => void;
  t: any; // Translation object for the active locale
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();
  const [language, setLanguageState] = useState<LocaleType>('en-US');

  useEffect(() => {
    const savedLang = localStorage.getItem('lexiverse_lang') as LocaleType;
    if (savedLang) {
      setLanguageState(savedLang);
      i18nInstance.changeLanguage(savedLang);
    }
  }, [i18nInstance]);

  const setLanguage = (lang: LocaleType) => {
    setLanguageState(lang);
    i18nInstance.changeLanguage(lang);
    localStorage.setItem('lexiverse_lang', lang);
  };

  /**
   * Helper to return the entire translation tree as an object for backward compatibility.
   * This prevents needing to refactor all `t.nav.dashboard` style accesses.
   */
  const getLegacyTranslationObject = () => {
    // Return current resource bundle or fallback to local static bundle
    const bundle = i18nInstance.getResourceBundle(language, 'translation') || locales[language];
    return bundle;
  };

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ 
        language, 
        setLanguage, 
        t: getLegacyTranslationObject() 
      }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
