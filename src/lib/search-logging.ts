
import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Logs a research search term to Firestore for administrative analysis.
 */
export function logSearch(db: Firestore, term: string, type: string, uid?: string) {
  const logsRef = collection(db, 'search_logs');
  
  addDoc(logsRef, {
    term,
    type,
    uid: uid || 'anonymous',
    timestamp: serverTimestamp(),
  }).catch(async (err) => {
    const permissionError = new FirestorePermissionError({
      path: 'search_logs',
      operation: 'create',
      requestResourceData: { term, type, uid },
    });
    // Silently emit if allowed, otherwise logging is non-critical for the user
    errorEmitter.emit('permission-error', permissionError);
  });
}
