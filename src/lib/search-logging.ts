import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Logs a research search term to Firestore for administrative analysis.
 * This helps inform administrators of what terms are being searched so they can populate the wiki.
 */
export function logSearch(db: Firestore, term: string, type: string, uid?: string) {
  if (!db || !term.trim()) return;

  const logsRef = collection(db, 'search_logs');
  
  // No await here - optimistic background logging
  addDoc(logsRef, {
    term: term.trim(),
    type,
    uid: uid || 'anonymous',
    timestamp: serverTimestamp(),
  }).catch(async (err) => {
    // Fail silently in UI but emit for debugging
    const permissionError = new FirestorePermissionError({
      path: 'search_logs',
      operation: 'create',
      requestResourceData: { term, type, uid },
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
