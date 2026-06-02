
# LexiVerse Localization Guide: Automated i18nexus Workflow

LexiVerse Explorer utilizes **i18nexus** to automate internationalization. This allows scholarly and academic terminology to be managed in a central cloud console and synced directly to the application.

## 📂 Architecture
- **Source of Truth**: [i18nexus Console](https://i18nexus.com/)
- **Integration Layer**: `i18next` + `react-i18next`
- **Fallback**: Static dictionaries in `src/lib/locales/`

## 🛠️ How to Sync Translations

### 1. Update in i18nexus
1. Log in to your i18nexus project.
2. Add or modify strings (e.g., adding a new theological term like "Eschatology").
3. Publish your changes.

### 2. Configure API Key
Ensure your environment variable is set:
```bash
NEXT_PUBLIC_I18NEXUS_API_KEY=your_key_here
```

### 3. Local Development
During development, the app fetches the latest strings directly from the i18nexus API via `src/lib/i18n.ts`.

### 4. Adding New Dialects
To support a new regional dialect:
1. Enable the language in the i18nexus project settings.
2. Register the language code in `src/lib/locales.ts` and `src/lib/i18n.ts`.

## 🏗️ Use in Components
Accessing translations remains unchanged to ensure backward compatibility:
```tsx
const { t } = useLanguage();
return <h1>{t.nav.dashboard}</h1>;
```

## 🌍 Automatic Detection
The `LanguageDetector` plugin automatically identifies the researcher's browser locale and applies the most relevant supported dialect.
