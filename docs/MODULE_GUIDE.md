
# LexiVerse Native Module Development Guide

This guide details the **Unified Architecture** for LexiVerse Explorer. Unlike traditional modularity which isolates code into separate apps or heavy packages, LexiVerse uses a **Native Integration Pattern**. Modules are treated as first-class citizens of the core app.

## 🏛️ Native Integration Philosophy

1.  **Zero Isolation**: Modules live in `src/components/views/` and `src/ai/flows/`. They are part of the main bundle.
2.  **Shared Foundation**: Modules MUST use existing packages (`lucide-react`, `genkit`, `firebase`, `recharts`, `shadcn/ui`).
3.  **Inherited Context**: Every module automatically receives the global `language`, `theme`, `auth`, and `firestore` context via standard hooks.

---

## 🛠️ The 3-Step "Native Merge" Process

### 1. Define UI Component (`src/components/views/`)
Create a new file (e.g., `my-tool-view.tsx`). 
- **Requirement**: Wrap in `React.memo` to maintain LexiVerse performance standards.
- **Requirement**: Use `@/components/ui/` for all primitives.

```tsx
'use client';
import React, { memo } from 'react';
import { useLanguage } from '@/components/language-provider';
// ... UI imports
export const MyToolView = memo((props: any) => {
  const { t } = useLanguage();
  return (/* JSX */);
});
```

### 2. Register Metadata (`src/config/modules.ts`)
Add your tool to the `SCHOLARLY_MODULES` array. This handles sidebar icons, labels (via `src/lib/locales`), and grouping.

```typescript
{ id: 'my-tool', labelKey: 'nav.my_tool', icon: Sparkles, group: 'ai_hub' }
```

### 3. Connect to Orchestrator (`src/app/page.tsx`)
Import your component and add it to the `MODULAR_VIEWS` map. This is the only place where the UI meets the state.

---

## 🚫 The "Zero-Bloat" Checklist

Before adding a new feature, check if it can be built with:
- **Icons**: `lucide-react` (Already installed).
- **AI**: `genkit` + `google-genai` (Already installed).
- **Charts**: `recharts` (Already installed).
- **Export**: `jspdf` + `docx` (Already installed).
- **Tables**: `shadcn/ui/table` (Already installed).

**DO NOT** run `npm install` for alternative UI kits or icon sets. Use the Native Foundation.
