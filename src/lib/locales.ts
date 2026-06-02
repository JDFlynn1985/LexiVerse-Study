/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Centralized dictionary for LexiVerse localization and internationalization.
 * 
 * This module aggregates all language files and provides a unified interface
 * for the LanguageProvider. It supports dialect-specific terminology
 * required for accurate theological research in various regions.
 */

import { enUS } from './locales/en-US';
import { enGB } from './locales/en-GB';
import { esES } from './locales/es-ES';
import { esMX } from './locales/es-MX';

/**
 * The consolidated locales object mapping language codes to their dictionaries.
 */
export const locales = {
  'en-US': enUS,
  'en-GB': enGB,
  'es-ES': esES,
  'es-MX': esMX,
};

/**
 * Derived type representing supported locale identifiers.
 */
export type LocaleType = keyof typeof locales;

/**
 * Metadata for available languages used in the UI (e.g., profile settings).
 */
export const availableLanguages = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'es-ES', name: 'Español (España)' },
  { id: 'es-MX', name: 'Español (México)' },
] as const;
