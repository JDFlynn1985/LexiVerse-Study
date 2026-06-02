/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * Under this license, you are free to copy, redistribute, and adapt this code,
 * provided you follow these conditions:
 *  - Attribution: You must give appropriate credit to Joshua Flynn.
 *  - NonCommercial: You may not use this material for commercial purposes.
 *  - ShareAlike: If you alter, transform, or build upon this code, you must 
 *    distribute your contributions under the same license as the original.
 */

'use client';

/**
 * @fileOverview Centralized scholarly error logging service.
 */

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';

export type ErrorLogContext = {
  type: 'runtime' | 'firebase-permission' | 'api' | 'auth';
  userId?: string;
  metadata?: any;
};

export function logErrorToFirestore(db: Firestore, error: any, context: ErrorLogContext) {
  if (!db) return;

  const logsRef = collection(db, 'error_logs');
  
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

  addDoc(logsRef, logData).catch((firestoreError) => {
    console.warn('Failed to log error to Firestore:', firestoreError);
  });
}
