/**
 * LexiVerse Explorer
 * Copyright (c) 2026 Joshua Flynn (joshuaflynn040@gmail.com).
 * Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Centralized scholarly error logging service.
 * 
 * Provides a standardized way to persist application and permission errors 
 * to Firestore for administrative audit and debugging.
 */

'use client';

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';

/**
 * Contextual metadata for an error log.
 */
export type ErrorLogContext = {
  /** The origin or category of the error. */
  type: 'runtime' | 'firebase-permission' | 'api' | 'auth';
  /** Optional UID of the researcher who encountered the error. */
  userId?: string;
  /** Arbitrary metadata associated with the event (e.g. Firestore path). */
  metadata?: any;
};

/**
 * Persists an error to the /error_logs collection in Firestore.
 * This is used for background auditing and developer diagnostics.
 * 
 * @param db The Firestore instance.
 * @param error The error object or message to log.
 * @param context Metadata about the error environment.
 */
export function logErrorToFirestore(db: Firestore, error: any, context: ErrorLogContext) {
  if (!db) return;

  const logsRef = collection(db, 'error_logs');
  
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
