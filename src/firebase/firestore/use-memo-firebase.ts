
'use client';
import { useMemo, DependencyList } from 'react';

/**
 * Hook to stabilize Firebase references and queries between renders.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
