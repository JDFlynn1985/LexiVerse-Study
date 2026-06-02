# LexiVerse Explorer: Developer SDK & Architecture Manual (v1.3)

Welcome to the LexiVerse Explorer SDK documentation. This guide provides the technical foundation for expanding the platform's scholarly capabilities, now updated for **Dual-Layer Security** and **Grounded Intelligence**.

---

## 📂 Project Orchestration
LexiVerse follows a **Unified Native Architecture**. Research modules are integrated components of the core engine, utilizing shared context for language, theme, and authentication.

### Core Directories
- **`src/ai/flows/`**: The intelligence layer. All Genkit 1.x reasoning is encapsulated here.
- **`src/app/actions/`**: The infrastructure layer. Uses Server Actions for tasks like Ollama management and **Identity Verification**.
- **`src/components/views/`**: The UI layer. Each research tool is a memoized React component.
- **`src/firebase/`**: The data layer. Orchestrates real-time syncing and RBAC permissions.
- **`src/lib/`**: The utility layer. Contains the RAG engine, exporters, and sanitization logic.

---

## 🛡️ Security & Identity (Dual-Layer)
The platform enforces a strict non-predictability policy for credentials. Developers must utilize the server-side validation flow for any identity management.

### Server-Side Validation
The `validateScholarPassword` server action (found in `src/app/actions/auth-actions.ts`) provides the authoritative check against:
1. **Clause 1.1 (Age)**: Rejection of any user under 15.
2. **Identity Collision**: Rejection of passwords containing components of the user's name, email, or birthday.

---

## 🤖 Developing Grounded AI Flows (Genkit 1.x)
All AI logic MUST use the global `ai` instance from `@/ai/genkit`. To maintain 100% academic precision, we use **Grounded Tool Calling**.

### The Grounding Pattern
When building linguistic or exegesis tools, never rely on LLM memory alone. Use tools to fetch verified registry data:

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

## 🌍 Internationalization (i18n)
UI strings are managed via **i18nexus**. Always use the `useLanguage` hook. Never hardcode strings directly in components to ensure the platform remains accessible across all 30+ supported dialects.

---

## 📊 Governance & Auditing
All system exceptions and search queries are logged to Firestore for administrative review.
- **Service**: `logErrorToFirestore(db, error, context)`
- **Service**: `logSearch(db, term, type, uid)`
