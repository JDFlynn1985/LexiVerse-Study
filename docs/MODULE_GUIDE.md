
# LexiVerse Module Development Guide

This guide explains how to extend LexiVerse Explorer by creating new scholarly modules or research views.

## 🏛️ Architectural Overview

The application follows a **Modular View Pattern**. Instead of a single monolithic page, each research tool is isolated in a "View Component."

### Directory Structure
- `src/components/views/`: Contains the logic and UI for specific modules (e.g., `lexicon-view.tsx`).
- `src/types/scholarly.ts`: Shared types, including the `ViewMode` enum.
- `src/app/page.tsx`: The central orchestrator that manages high-level state and routing.

---

## 🛠️ Building a New Module

### 1. Register the View Type
Add your new module's unique ID to the `ViewMode` type in `src/types/scholarly.ts`:

```typescript
export type ViewMode = 'dashboard' | 'lexicon' | 'my-new-module' | ...;
```

### 2. Create the View Component
Create a new file in `src/components/views/[module-id]-view.tsx`. 

**Requirements:**
- Use the `'use client'` directive.
- Use `React.memo` to prevent unnecessary re-renders when other modules update.
- Accept necessary props (loading states, results, search handlers).

```tsx
'use client';
import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

interface MyModuleProps {
  isLoading: boolean;
  onAction: (data: string) => void;
}

export const MyModuleView = memo(({ isLoading, onAction }: MyModuleProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header>
      <h1 className="text-3xl font-bold font-headline">My Research Tool</h1>
    </header>
    {/* Your logic here */}
  </div>
));
```

### 3. Integrate with the Dashboard
Update `src/app/page.tsx`:
1.  Import your new view.
2.  Add its corresponding state and handlers in the `Home` component.
3.  Add a case to the main switch/conditional rendering block in the JSX.
4.  (Optional) Add a `QuickToolCard` to the `DashboardView` for easy access.

---

## 🤖 Integrating AI Flows

If your module requires GenAI analysis:
1.  Define a new flow in `src/ai/flows/[name].ts`.
2.  Follow the **Genkit 1.x API** standards.
3.  Export an async wrapper function.
4.  Call this function from `src/app/page.tsx` within a search handler.

---

## 📏 Best Practices

1.  **Component Isolation**: Keep your module's internal state local. Only lift state to `page.tsx` if it needs to be shared with other tools.
2.  **Accessibility**: Always include icons (from `lucide-react`) and descriptive text for screen readers.
3.  **Error Handling**: Use the `logErrorToFirestore` utility in `src/lib/error-logging.ts` for any background processes that might fail.
4.  **Performance**: Use the `useMemoFirebase` hook to stabilize any Firestore queries your module uses.
