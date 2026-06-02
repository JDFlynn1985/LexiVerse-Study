
'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

/**
 * @fileOverview i18next configuration for i18nexus integration.
 * Connects to the i18nexus API for automated scholarly translations.
 */

// Placeholder for i18nexus API Key. 
// Researchers should set this in their environment variables.
const I18NEXUS_API_KEY = process.env.NEXT_PUBLIC_I18NEXUS_API_KEY || "YOUR_I18NEXUS_API_KEY";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'en-GB', 'es-MX', 'es-ES'],
    ns: ['translation'],
    defaultNS: 'translation',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // Point to i18nexus API for dynamic development, fallback to local for production
      loadPath: `https://api.i18nexus.com/project_resources/translations/{{lng}}/{{ns}}.json?api_key=${I18NEXUS_API_KEY}`,
    },
    react: {
      useSuspense: false, // Ensure consistent render with Next.js SSR/Hydration
    }
  });

export default i18n;
