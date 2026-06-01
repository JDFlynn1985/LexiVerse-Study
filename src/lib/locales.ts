/**
 * @fileOverview Centralized dictionary for application localization with dialect support.
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

export type LocaleType = keyof typeof locales;

export const availableLanguages = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'es-ES', name: 'Español (España)' },
  { id: 'es-MX', name: 'Español (México)' },
] as const;
