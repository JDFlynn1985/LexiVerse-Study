# LexiVerse Explorer: Project Statistics

This report provides a quantitative overview of the application's codebase as of the current build.

## 📊 Summary
- **Total Files**: 115
- **Total Lines of Code**: 10,750

---

## 📂 File Type Breakdown

| Extension | File Count | Lines of Code (LOC) | Description |
|-----------|------------|---------------------|-------------|
| `.tsx`    | 55         | 6,182               | React Components (Next.js Pages, UI, Providers) |
| `.ts`     | 49         | 3,881               | TypeScript Logic (AI Flows, API Routes, Utils, Hooks) |
| `.json`   | 6          | 310                 | Configuration & Metadata (Backend Schema, package.json) |
| `.md`     | 2          | 76                  | Documentation (README, CONTRIBUTING) |
| `.css`    | 1          | 143                 | Global Styling (Tailwind Base & Theme) |
| `.yml`    | 1          | 29                  | CI/CD Workflows |
| `.yaml`   | 1          | 7                   | App Hosting Configuration |
| `.env`    | 1          | 1                   | Local Environment Variables |

---

## 🏛️ Architectural Breakdown

### 🤖 AI Hub (`src/ai`)
- **Flows**: 19 files containing expert reasoning paths for scripture analysis, OCR, and synthesis.
- **Engine**: Genkit-powered orchestration with multi-model support.

### 🧩 UI Component Library (`src/components/ui`)
- **Total Components**: 35 professional ShadCN-based components.
- **Styling**: Fully themed using Tailwind CSS variables.

### 🌍 Globalisation (`src/lib/locales`)
- **Dialects**: 4 primary locales (en-US, en-GB, es-ES, es-MX) with dialect-specific scholarly terminology.

### 🛡️ Governance & API (`src/app/api`)
- **Research API**: RESTful endpoints with tiered rate-limiting.
- **Documentation**: Automated OpenAPI 3.0.0 specification and Swagger UI integration.
