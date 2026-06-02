'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

/**
 * @fileOverview i18next configuration for i18nexus integration.
 * Expanded to support top 5 global languages and all major European languages.
 */

const I18NEXUS_API_KEY = process.env.NEXT_PUBLIC_I18NEXUS_API_KEY || "YOUR_I18NEXUS_API_KEY";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: [
      // Global Top 5 (excluding defaults)
      'en-US', 'zh-CN', 'hi-IN', 'es-MX', 'ar-SA', 'bn-BD', 'pt-BR',
      // European Languages
      'en-GB', 'fr-FR', 'de-DE', 'it-IT', 'nl-NL', 'pt-PT', 'ru-RU', 
      'pl-PL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI', 'el-GR', 'tr-TR',
      'cs-CZ', 'hu-HU', 'ro-RO', 'bg-BG', 'hr-HR', 'sk-SK', 'sl-SI',
      'et-EE', 'lv-LV', 'lt-LT', 'mt-MT', 'ga-IE'
    ],
    ns: ['translation'],
    defaultNS: 'translation',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `https://api.i18nexus.com/project_resources/translations/{{lng}}/{{ns}}.json?api_key=${I18NEXUS_API_KEY}`,
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
