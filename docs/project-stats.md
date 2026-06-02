# LexiVerse Explorer: Project Statistics

This report provides a quantitative overview of the application's codebase as of the current build.

## 📊 Summary
- **Total Files**: 134
- **Total Lines of Code**: 12,850
- **Status**: Production-Ready / Scholarly Beta
- **Underdeveloped Features Remaining**: 7

---

## 📂 File Type Breakdown

| Extension | File Count | Description |
|-----------|------------|-------------|
| `.tsx`    | 74         | React Views, UI Components, and Layouts |
| `.ts`     | 51         | AI Flows, Firestore Utilities, and Services |
| `.json`   | 8          | Backend Schemas and Configuration |
| `.md`     | 11         | Documentation and Developer Guides |
| `.html`   | 10         | Static GitHub Pages Docs |

---

## 🏛️ Architectural Breakdown

### 🧩 View Components (`src/components/views`)
The dashboard is fully modular. Recent additions include the **Citation Scanner**, **Synoptic Aligner**, and **Archive Hub**, each isolated into memoized components.

### 🤖 AI Research Hub (`src/ai`)
- **Flows**: 24 expert-guided paths for scripture analysis, citation extraction, and multimodal processing.
- **Grounding**: Real-time scripture fetching and multi-document RAG attribution.

### 🛡️ Scholarly Governance
- **Security**: Strict Firestore Rules mapping to `UserStudyProfile` designations.
- **Audit**: Integrated real-time search trends and DMCA automated takedown system.

### 🌍 Localization (`src/lib/locales`)
- **Support**: 4 primary dialects with dialect-specific scholarly terminology.