
# LexiVerse Module Development Guide

This guide explains how to extend LexiVerse Explorer by creating new scholarly modules or research views while maintaining architectural integrity.

## 🏛️ Architectural Overview

The application follows a **Declarative Modular Pattern**. Instead of hardcoding navigation and orchestration, modules are registered in a central registry.

### Directory Structure
- `src/components/views/`: Logic and UI for specific modules (e.g., `lexicon-view.tsx`).
- `src/config/modules.ts`: The **Central Registry** for all system tools.
- `src/types/scholarly.ts`: Shared types, including the `ViewMode` enum.
- `src/app/page.tsx`: The orchestrator that dynamically renders views based on the registry.

---

## 🛠️ Building a New Module

### 1. Register the View Type
Add your module's unique ID to the `ViewMode` type in `src/types/scholarly.ts`:
```typescript
export type ViewMode = 'dashboard' | 'lexicon' | 'my-new-module' | ...;
```

### 2. Add to the Central Registry
Open `src/config/modules.ts` and add your module metadata to `SCHOLARLY_MODULES`. This automatically handles sidebar registration.
```typescript
{ id: 'my-new-module', labelKey: 'nav.my_tool', icon: Sparkles, group: 'ai_hub' }
```

### 3. Create the View Component
Create `src/components/views/[module-id]-view.tsx`. Use standard components to ensure zero-bloat.

### 4. Zero-Bloat Policy 🚫
**DO NOT add new node packages.** LexiVerse already includes:
- **UI**: ShadCN (Radix UI), Tailwind CSS, Lucide Icons.
- **AI**: Genkit 1.x, Google Generative AI, Ollama.
- **Data**: Firebase (Firestore, Auth), IndexedDB.
- **Charts**: Recharts.
- **Export**: jsPDF, Docx, Mammoth.

If you need a feature, check if it can be built with existing libraries first.

---

## 🤖 Integrating AI Flows

1.  Define a new flow in `src/ai/flows/[name].ts` using Genkit 1.x.
2.  Register the flow in `src/ai/dev.ts`.
3.  Call the flow wrapper from `src/app/page.tsx` within the global `handleSearch` or a local handler.

---

## 📏 Best Practices

1.  **Memoization**: Wrap view components in `React.memo` to prevent re-renders when other tools update.
2.  **Localization**: All UI text MUST be added to `src/lib/locales/en-US.ts` (and other dialects).
3.  **Governance**: If the tool is for admins, set `adminOnly: true` in the module registry.
4.  **Stability**: Use `useMemoFirebase` for any custom Firestore queries inside your view.
