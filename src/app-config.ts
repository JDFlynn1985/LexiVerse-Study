
/**
 * @fileOverview Central configuration for all API keys and database settings.
 * Designed to prioritize Firestore-based system settings over environment variables.
 */

export const appConfig = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  ai: {
    // Default from env, can be overridden by system settings in Firestore
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  google: {
    scopes: [
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  },
  analytics: {
    google: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
    },
    matomo: {
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID || '',
      url: process.env.NEXT_PUBLIC_MATOMO_URL || '',
    }
  }
};
