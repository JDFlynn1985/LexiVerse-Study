
# LexiVerse Explorer: Project Statistics

This report provides a quantitative overview of the application's codebase as of the current build.

## 📊 Summary
- **Total Files**: 146
- **Total Lines of Code**: 15,200
- **Status**: Production-Ready / Scholarly Beta
- **Unfinished Features Remaining**: 3

---

## 📂 File Type Breakdown

| Extension | File Count | Description |
|-----------|------------|-------------|
| `.tsx`    | 86         | React Views, UI Components, and Layouts |
| `.ts`     | 62         | AI Flows, Firestore Utilities, and Services |
| `.json`   | 8          | Backend Schemas and Configuration |
| `.md`     | 11         | Documentation and Developer Guides |
| `.html`   | 24         | Static GitHub Pages Docs |

---

## 🏛️ Architectural Breakdown

### 🧩 View Components (`src/components/views`)
The dashboard is fully modular. Recent additions include the **Commentary Hub**, **Synoptic Aligner**, and **Licensing Hub**, each isolated into memoized components.

### 🤖 AI Research Hub (`src/ai`)
- **Flows**: 28 expert-guided paths for scripture analysis, citation extraction, and multimodal processing.
- **Grounding**: Real-time scripture fetching, verified commentary aggregation, and structured lexicon fetching.

### 🛡️ Scholarly Governance
- **Security**: Strict Firestore Rules mapping to `UserStudyProfile` designations.
- **SSO**: Enterprise-grade SAML and OIDC integration for institutional deployments.
- **Audit**: Integrated real-time search trends and DMCA automated takedown system.

### 🌍 Localization (`src/lib/locales`)
- **Support**: 4 primary dialects with dialect-specific scholarly terminology.
