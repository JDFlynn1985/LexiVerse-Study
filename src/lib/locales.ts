/**
 * @fileOverview Centralized dictionary for application localization.
 * Exports all language sets from individual files.
 */

import { en } from './locales/en';
import { es } from './locales/es';

export const locales = {
  en,
  es
};

export type LocaleType = keyof typeof locales;
