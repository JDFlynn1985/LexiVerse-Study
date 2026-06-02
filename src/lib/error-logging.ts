
'use client';

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';

export type ErrorLogContext = {
  type: 'runtime' | 'firebase-permission' | 'api' | 'auth';
  userId?: string;
  metadata?: any;
};

/**
 * Persists an error to the /system/error_logs collection in Firestore.
 * This is used for background auditing and developer diagnostics.
 */
export function logErrorToFirestore(db: Firestore, error: any, context: ErrorLogContext) {
  if (!db) return;

  const logsRef = collection(db, 'system', 'error_logs');
  
  // Construct the log payload
  const logData = {
    message: error.message || String(error),
    stack: error.stack || 'No stack trace available',
    type: context.type,
    userId: context.userId || 'anonymous',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    context: context.metadata || {},
    timestamp: serverTimestamp(),
  };

  // Log to Firestore without awaiting to avoid blocking UI execution
  addDoc(logsRef, logData).catch((firestoreError) => {
    // If Firestore logging itself fails (e.g., offline or rules), fall back to console
    console.warn('Failed to log error to Firestore:', firestoreError);
  });
}
