/**
 * @fileOverview Real-time Firestore Document Hook.
 * 
 * Provides a standardized way to subscribe to a single document in Firestore.
 * Includes integrated error handling that surfaces permission violations
 * to the global LexiVerse error listener.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Subscribes to a Firestore document reference and returns its data and state.
 * 
 * @template T - The type of the document data.
 * @param {DocumentReference<T> | null} docRef - The reference to the document to watch.
 * @returns {{ data: T | null, loading: boolean, error: FirestorePermissionError | null }}
 */
export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...(snapshot.data() as T), id: snapshot.id } : null);
        setLoading(false);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        // Emit for administrative logging and UI feedback
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
