/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 */

/**
 * @fileOverview Registry for LexiVerse localization.
 * Updated to include the full global top 5 and European language set.
 */

import { enUS } from './locales/en-US';
import { enGB } from './locales/en-GB';
import { esES } from './locales/es-ES';
import { esMX } from './locales/es-MX';

export const locales = {
  'en-US': enUS,
  'en-GB': enGB,
  'es-ES': esES,
  'es-MX': esMX,
};

export type LocaleType = string;

export const availableLanguages = [
  // Core & Defaults
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'es-MX', name: 'Español (México)' },
  { id: 'es-ES', name: 'Español (España)' },
  
  // Global Top 5
  { id: 'zh-CN', name: '简体中文 (Mandarin)' },
  { id: 'hi-IN', name: 'हिन्दी (Hindi)' },
  { id: 'ar-SA', name: 'العربية (Arabic)' },
  { id: 'pt-BR', name: 'Português (Brasil)' },
  { id: 'bn-BD', name: 'বাংলা (Bengali)' },

  // European Set
  { id: 'fr-FR', name: 'Français (France)' },
  { id: 'de-DE', name: 'Deutsch (Deutschland)' },
  { id: 'it-IT', name: 'Italiano (Italia)' },
  { id: 'nl-NL', name: 'Nederlands (Nederland)' },
  { id: 'pt-PT', name: 'Português (Portugal)' },
  { id: 'ru-RU', name: 'Русский (Rossiya)' },
  { id: 'pl-PL', name: 'Polski (Polska)' },
  { id: 'sv-SE', name: 'Svenska (Sverige)' },
  { id: 'da-DK', name: 'Dansk (Danmark)' },
  { id: 'no-NO', name: 'Norsk (Norge)' },
  { id: 'fi-FI', name: 'Suomi (Suomi)' },
  { id: 'el-GR', name: 'Ελληνικά (Elláda)' },
  { id: 'tr-TR', name: 'Türkçe (Türkiye)' },
  { id: 'cs-CZ', name: 'Čeština (Česko)' },
  { id: 'hu-HU', name: 'Magyar (Magyarország)' },
  { id: 'ro-RO', name: 'Română (România)' },
  { id: 'bg-BG', name: 'Български (Bulgaria)' },
  { id: 'hr-HR', name: 'Hrvatski (Hrvatska)' },
  { id: 'ga-IE', name: 'Gaeilge (Éire)' }
] as const;
