/**
 * @fileOverview Real-time Firestore Collection Hook.
 * 
 * Provides a standardized way to subscribe to multiple documents in a collection.
 * Designed to prevent redundant re-subscriptions when stabilized references
 * are provided via `useMemoFirebase`.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Subscribes to a Firestore collection or query and returns an array of documents.
 * 
 * @template T - The type of the document data.
 * @param {Query<T> | null} query - The Firestore query to watch.
 * @returns {{ data: T[], loading: boolean, error: FirestorePermissionError | null }}
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const docs = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(docs);
        setLoading(false);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          // Use internal path identifier for debugging
          path: (query as any)._query?.path?.toString() || 'collection',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
