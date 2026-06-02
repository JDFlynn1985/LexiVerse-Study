
# LexiVerse Explorer: Developer SDK & Architecture Manual

Welcome to the LexiVerse Explorer SDK documentation. This guide provides the technical foundation for expanding the platform's scholarly capabilities.

---

## 🏛️ Core Architecture: The Native Integration Pattern

LexiVerse uses a **Unified Native Architecture**. Unlike traditional modular systems that isolate features into "sub-apps" or external packages, LexiVerse treats every tool as a first-class citizen of the core codebase.

### Key Benefits:
- **Shared Context**: Every module automatically inherits global `Language`, `Theme`, and `Auth` contexts.
- **Zero-Bloat**: Modules use the pre-installed library stack (ShadCN, Genkit, Firebase, Recharts).
- **Performance**: Memoized views (`React.memo`) ensure that complex research tools do not trigger unnecessary global re-renders.

---

## 🤖 AI Engine (Genkit 1.x)

The platform is powered by **Firebase Genkit**. All AI logic resides in `src/ai/flows/`.

### 1. Defining a Flow
Always use the `ai.defineFlow` and `ai.definePrompt` pattern. 
```typescript
// src/ai/flows/example-flow.ts
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InputSchema = z.object({ query: z.string() });
const OutputSchema = z.object({ result: z.string() });

export const exampleFlow = ai.defineFlow({
  name: 'exampleFlow',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
}, async (input) => {
  const { output } = await ai.generate({
    prompt: `Analyze: ${input.query}`,
    output: { schema: OutputSchema }
  });
  return output!;
});
```

### 2. Model Routing
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

## 🧩 Modular View System

Modules are registered in two places:
1.  **Code Registry (`src/config/modules.ts`)**: Defines metadata, icons, and groups.
2.  **Database Registry (`/modules` collection)**: Controls the `enabled` status and administrative access.

### Adding a New Module:
1.  Create your view in `src/components/views/my-tool-view.tsx`.
2.  Add a metadata entry to `DEFAULT_MODULES` in `src/config/modules.ts`.
3.  Register the component in the `renderModularContent` switch in `src/app/page.tsx`.

---

## 🌍 Localization (i18n)

UI strings are managed in `src/lib/locales/`. 
- **Pattern**: Use the `useLanguage` hook.
- **Support**: Standard English (US/UK) and Spanish (ES/MX) are provided.

```tsx
const { t } = useLanguage();
return <h1>{t.nav.dashboard}</h1>;
```

---

## 🛡️ Error Logging & Governance

All runtime and permission errors are logged to the `error_logs` collection. 
- **Utility**: `logErrorToFirestore(db, error, context)`
- **Auditing**: Administrators can view these logs to debug security rule violations or API failures.

---

## 🔌 External Research API

LexiVerse exposes a RESTful API for external scholarly tool integration.
- **Docs**: `/api/v1/api-docs` (Swagger UI)
- **Spec**: `/api/doc` (OpenAPI JSON)
- **Auth**: Bearer tokens provisioned in the **API Portal**.

---

## 🛠️ Tech Stack Reference

- **Framework**: Next.js 15 (App Router)
- **UI**: ShadCN UI + Tailwind CSS
- **AI**: Genkit 1.x + Google AI / Ollama
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Icons**: Lucide React (Dynamic Mapping via `src/lib/icons.ts`)
