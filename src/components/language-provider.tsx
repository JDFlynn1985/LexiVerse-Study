'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { locales, LocaleType } from '@/lib/locales';

interface LanguageContextType {
  language: LocaleType;
  setLanguage: (lang: LocaleType) => void;
  t: any; // Translation function or object
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LocaleType>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('lexiverse_lang') as LocaleType;
    if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: LocaleType) => {
    setLanguageState(lang);
    localStorage.setItem('lexiverse_lang', lang);
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
