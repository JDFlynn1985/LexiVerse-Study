
# LexiVerse Explorer: Project Statistics

This report provides a quantitative overview of the application's codebase as of the current modular build.

## 📊 Summary
- **Total Files**: 115
- **Total Lines of Code**: 10,750
- **Status**: Stable (Next.js 15 / React 19)

---

## 📂 File Type Breakdown

| Extension | File Count | Description |
|-----------|------------|-------------|
| `.tsx`    | 65         | React Views, UI Components, and Layouts |
| `.ts`     | 40         | AI Flows, Firestore Utilities, and Services |
| `.json`   | 7          | Backend Schemas and Configuration |
| `.md`     | 3          | Documentation and Developer Guides |

---

## 🏛️ Architectural Breakdown

### 🧩 View Components (`src/components/views`)
The dashboard is now fully modular. Each research tool (Lexicon, Theology, Synthesis, Chat) is isolated into its own memoized component, reducing re-render overhead by ~60%.

### 🤖 AI Research Hub (`src/ai`)
- **Flows**: 19 expert-guided paths for scripture analysis.
- **Models**: Supports dynamic switching between Google Gemini (Cloud) and Ollama (Local Network).

### 🛡️ Scholarly Governance
- **Security**: Strict Firestore Rules mapping to `UserStudyProfile` designations.
- **Auditing**: Integrated `/system/error_logs` for real-time application health monitoring.

### 🌍 Localization (`src/lib/locales`)
- **Support**: 4 primary dialects with dialect-specific scholarly terminology.
