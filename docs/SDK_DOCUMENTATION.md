# LexiVerse Explorer: Developer SDK & Architecture Manual (v1.2)

Welcome to the LexiVerse Explorer SDK documentation. This guide provides the technical foundation for expanding the platform's scholarly capabilities, now updated for **Grounded Intelligence** and **Institutional SSO**.

---

## 📂 Project Orchestration
LexiVerse follows a **Unified Native Architecture**. Research modules are integrated components of the core engine, utilizing shared context for language, theme, and authentication.

### Core Directories
- **`src/ai/flows/`**: The intelligence layer. All LLM reasoning is encapsulated here.
- **`src/app/actions/`**: The infrastructure layer. Uses Server Actions for tasks like Ollama management and SSO verification.
- **`src/components/views/`**: The UI layer. Each research tool is a memoized React component.
- **`src/firebase/`**: The data layer. Orchestrates real-time syncing and RBAC permissions.
- **`src/lib/`**: The utility layer. Contains the RAG engine, exporters, and sanitization logic.

---

## 🤖 Developing Grounded AI Flows (Genkit 1.x)
All AI logic MUST use the global `ai` instance from `@/ai/genkit`. To maintain 100% academic precision, we use **Grounded Tool Calling**.

### The Grounding Pattern
When building linguistic or exegesis tools, never rely on LLM memory alone. Define a tool to fetch verified data:

```typescript
const fetchStrongsDataTool = ai.defineTool({
  name: 'fetchStrongsData',
  description: 'Fetches verified data from the LexiVerse registry.',
  inputSchema: z.object({ number: z.string() }),
  outputSchema: z.any(),
  fn: async (input) => await getStrongsData(input.number)
});

// Inside your prompt
const prompt = ai.definePrompt({
  tools: [fetchStrongsDataTool],
  prompt: "Use the fetchStrongsData tool first, then synthesize the result..."
});
```

---

## 🔐 Institutional SSO & RBAC
The platform identifies researchers via their `UserStudyProfile`. 
- **`institutionId`**: Use this to filter chat messages for "Institutional Seminar" mode.
- **`isAdmin`**: Protect administrative routes (`/admin/*`) and sensitive server actions.
- **`licensedVersions`**: Check this array before granting access to modern Bible versions.

---

## 🛡️ Input Security & Sanitization
Every user-controllable text field MUST be sanitized before processing.
- **Utility**: `src/lib/sanitization.ts`
- **Policy**: Use `sanitizeHtml` for general text and `sanitizeRichText` for Wiki/Notes content to preserve basic formatting while preventing XSS.

---

## 🌍 Internationalization (i18n)
UI strings are managed centrally in `src/lib/locales/`. 
- Always use the `useLanguage` hook. 
- Never hardcode strings directly in components to ensure the platform remains accessible across all supported dialects.

---

## 📊 Governance & Auditing
All system exceptions and search queries are logged to Firestore for administrative review.
- **Service**: `logErrorToFirestore(db, error, context)`
- **Service**: `logSearch(db, term, type, uid)`
