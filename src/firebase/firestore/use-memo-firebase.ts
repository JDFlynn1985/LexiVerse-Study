/**
 * @fileOverview Utility hook for stabilizing Firestore references.
 * 
 * In React, creating Firestore queries or references inline within a component
 * creates a new object on every render. This hook uses `useMemo` to ensure
 * references are stable, preventing infinite re-subscription loops in 
 * `useCollection` and `useDoc`.
 */

'use client';
import { useMemo, DependencyList } from 'react';

/**
 * Hook to stabilize Firebase references and queries between renders.
 * 
 * @template T - The type of the Firebase reference or query.
 * @param {() => T} factory - A function that returns the Firebase reference/query.
 * @param {DependencyList} deps - Standard React dependency array.
 * @returns {T} The memoized Firebase reference or query.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
