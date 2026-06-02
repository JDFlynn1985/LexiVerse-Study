# LexiVerse Localization Guide: Adding New Dialects

LexiVerse Explorer uses a structured i18n system to ensure theological and academic terminology is accurate across different regional dialects.

## 📂 File Structure
Localization dictionaries are stored in `src/lib/locales/`.
- `template.ts`: The baseline master dictionary.
- `en-US.ts`, `es-MX.ts`, etc.: Regional implementations.
- `src/lib/locales.ts`: The registry file.

## 🛠️ Step-by-Step implementation
To add support for a new language (e.g., German - `de-DE`):

1.  **Create implementation**: Copy `src/lib/locales/template.ts` to `src/lib/locales/de-DE.ts`.
2.  **Translate Values**: Replace the bracketed placeholders with the target language.
    - *Note*: Ensure theological terms (e.g., "Justification", "Exegesis") match local scholarly standards.
3.  **Register Locale**: Add the new file to the `locales` object in `src/lib/locales.ts`:
    ```typescript
    import { deDE } from './locales/de-DE';
    export const locales = {
      // ...
      'de-DE': deDE,
    };
    ```
4.  **Add to Selector**: Add the language to the `availableLanguages` array in the same file to enable it in the Profile settings.

## 🏗️ Use in Components
Use the `useLanguage` hook to access strings:
```tsx
const { t } = useLanguage();
return <h1>{t.nav.dashboard}</h1>;
```

## 🌍 Automatic Detection
The `LanguageProvider` automatically detects the user's browser locale. If a regional match (e.g., `en-GB`) is not found, it falls back to the primary language code (`en`) before defaulting to `en-US`.