
# LexiVerse Explorer: Developer SDK & Architecture Manual

Welcome to the LexiVerse Explorer SDK documentation. This guide provides the technical foundation for expanding the platform's scholarly capabilities and details the organizational structure of the codebase.

---

## 📂 File & Folder Structure

LexiVerse follows a strictly organized "Unified Native Architecture" to ensure scalability and performance across all research tools.

### Root Directory
- `docs/`: Technical manuals, security protocols, and scholarly standards.
- `src/`: The primary source code for the application.
- `public/`: Static assets and PWA manifests.
- `backend.json`: The blueprint for Firestore entities and authentication providers.

### The `src/` Directory Breakdown
- **`ai/`**: The AI research brain.
  - `flows/`: Individual Genkit flows for linguistic analysis, synthesis, and transcription.
  - `genkit.ts`: Central configuration for Gemini and Ollama plugins.
- **`app/`**: Next.js App Router core.
  - `admin/`: Restricted governance portals (Audit, Settings, API Keys).
  - `api/`: RESTful API endpoints and Swagger documentation.
  - `layout.tsx`: Root layout handling global providers (Theme, Language, Firebase).
  - `page.tsx`: The primary Research Dashboard orchestrator.
- **`components/`**: Reusable UI logic.
  - `ui/`: Accessible ShadCN primitives (Radix-based).
  - `views/`: The "Heart" of the app. Every research tool (Lexicon, Library, Theology) is a standalone, memoized view.
- **`firebase/`**: Firestore and Authentication orchestration.
  - `firestore/`: Stabilized real-time hooks (`useCollection`, `useDoc`).
  - `errors.ts`: Contextual security rule error handling logic.
- **`lib/`**: Domain-specific scholarly utilities.
  - `locales/`: Internationalization dictionaries for all supported dialects.
  - `rag-engine.ts`: Browser-native semantic chunking and ranking logic.
  - `bible-api.ts`: Connector for the Free Use Bible API.
- **`types/`**: Global TypeScript interfaces for scholarly entities.

---

## 🏛️ Core Architecture: The Native Integration Pattern

LexiVerse uses a **Unified Native Architecture**. Unlike traditional modular systems that isolate features into "sub-apps," LexiVerse treats every tool as a first-class citizen of the core codebase.

### Key Benefits:
- **Shared Context**: Every module automatically inherits global `Language`, `Theme`, and `Auth` contexts.
- **Zero-Bloat**: Modules use the pre-installed library stack (ShadCN, Genkit, Firebase, Recharts).
- **Performance**: Memoized views (`React.memo`) ensure that complex research tools do not trigger unnecessary global re-renders.

---

## 🤖 AI Engine (Genkit 1.x)

The platform is powered by **Firebase Genkit**. All AI logic resides in `src/ai/flows/`.

### Model Routing
The app supports **Dynamic Routing**. Users can switch between Google Gemini (Cloud) and Ollama (Local) in their profile. The engine handles this via the `model` parameter in `ai.generate`.

---

## 🔥 Database & Data Hooks (Firestore)

LexiVerse provides stabilized hooks to prevent infinite loops during real-time data fetching.

### 1. useMemoFirebase
Always stabilize your collection queries to ensure the hook doesn't re-subscribe on every render.
```tsx
const q = useMemoFirebase(() => {
  return query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
}, [db]);
const { data: messages } = useCollection(q);
```

### 2. Mutation Pattern
Do **NOT** await Firestore writes in the UI thread. Use optimistic updates and catch errors via the error emitter.
```typescript
addDoc(collection(db, 'logs'), data).catch(async (err) => {
  errorEmitter.emit('permission-error', new FirestorePermissionError({
    path: 'logs',
    operation: 'create'
  }));
});
```

---

## 🌍 Localization (i18n)

UI strings are managed in `src/lib/locales/`. 
- **Pattern**: Use the `useLanguage` hook.
- **Boilerplate**: Use `src/lib/locales/template.ts` when adding new language support.

---

## 🛡️ Governance & Auditing

All runtime and permission errors are logged to the `error_logs` collection. 
- **Utility**: `logErrorToFirestore(db, error, context)`
- **Auditing**: Administrators review these logs in the Governance Portal to maintain platform integrity.
