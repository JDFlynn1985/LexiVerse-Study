/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Central entry point for Firebase initialization and services.
 * 
 * Exports standard hooks and initialization functions used throughout the 
 * LexiVerse research environment.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
export * from './errors';
export * from './error-emitter';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes the Firebase Client SDK.
 * @returns {object} { app, auth, firestore }
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);
  firestore = getFirestore(app);
  return { app, auth, firestore };
}

export const getFirebaseApp = () => {
  const { app } = initializeFirebase();
  return app;
};

export const getAuthInstance = () => {
  const { auth } = initializeFirebase();
  return auth;
};

export const getFirestoreInstance = () => {
  const { firestore } = initializeFirebase();
  return firestore;
};
