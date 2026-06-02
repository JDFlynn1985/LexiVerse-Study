# LexiVerse Explorer: Developer SDK & Architecture Manual

Welcome to the LexiVerse Explorer SDK documentation. This guide provides the technical foundation for expanding the platform's scholarly capabilities.

---

## 📂 Project Orchestration
LexiVerse follows a **Unified Native Architecture**. Modules are not isolated "sub-apps" but integrated components of the core engine.

### Core Directories
- **`src/ai/flows/`**: The intelligence layer. All LLM reasoning is encapsulated here.
- **`src/components/views/`**: The UI layer. Each research tool is a memoized React component.
- **`src/firebase/`**: The data layer. Orchestrates real-time syncing and RBAC permissions.
- **`src/lib/`**: The utility layer. Contains the RAG engine, exporters, and sanitization logic.

---

## 🤖 Developing AI Flows (Genkit 1.x)
All AI logic MUST use the global `ai` instance from `@/ai/genkit`.
- **Pattern**: Define a `Prompt`, wrap it in a `Flow`, and export a `use server` wrapper function.
- **Grounding**: Always prefer the `searchBibleVerse` tool for scripture analysis instead of relying on the model's training data.

---

## 🔥 Firestore & Real-time Hooks
LexiVerse provides stabilized hooks to prevent infinite re-render loops.
- **`useMemoFirebase`**: Always use this to stabilize your `query()` or `doc()` references.
- **`useCollection` / `useDoc`**: These hooks handle real-time subscriptions and permission error surfacing automatically.

---

## 🛡️ Input Security & Sanitization
Every user-controllable text field MUST be sanitized before processing.
- **Utility**: `src/lib/sanitization.ts`
- **Policy**: Use `sanitizeHtml` for general text and `sanitizeRichText` for Wiki/Notes content.

---

## 🌍 Internationalization (i18n)
UI strings are managed centrally in `src/lib/locales/`. 
- Always use the `useLanguage` hook. 
- Never hardcode strings directly in components.

---

## 📊 Governance & Auditing
All system exceptions and permission denials are logged to `error_logs` in Firestore for administrative review.
- **Service**: `logErrorToFirestore(db, error, context)`