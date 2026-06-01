'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { locales, LocaleType } from '@/lib/locales';

interface LanguageContextType {
  language: LocaleType;
  setLanguage: (lang: LocaleType) => void;
  t: any; // Translation object for the active locale
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LocaleType>('en-US');

  useEffect(() => {
    const savedLang = localStorage.getItem('lexiverse_lang') as LocaleType;
    if (savedLang && locales[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: LocaleType) => {
    if (locales[lang]) {
      setLanguageState(lang);
      localStorage.setItem('lexiverse_lang', lang);
    }
  };

  const t = locales[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
