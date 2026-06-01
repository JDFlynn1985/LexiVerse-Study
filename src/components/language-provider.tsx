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
    } else {
      // Automatic detection logic
      const systemLang = navigator.language; // e.g., 'en-US', 'es-AR', 'fr-FR'
      const supportedLocales = Object.keys(locales) as LocaleType[];
      
      // 1. Try exact match (e.g., 'en-GB' -> 'en-GB')
      if (locales[systemLang as LocaleType]) {
        setLanguageState(systemLang as LocaleType);
      } 
      else {
        // 2. Try matching the primary language code (e.g., 'es-AR' -> 'es-MX' or 'es-ES')
        const primaryCode = systemLang.split('-')[0]; // 'es', 'en', 'fr'
        const dialectMatch = supportedLocales.find(l => l.startsWith(primaryCode));
        
        if (dialectMatch) {
          setLanguageState(dialectMatch);
        } else {
          // 3. Final default
          setLanguageState('en-US');
        }
      }
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
