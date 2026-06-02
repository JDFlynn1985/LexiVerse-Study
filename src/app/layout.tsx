/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com
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
 * @fileOverview Root Layout for the LexiVerse application.
 * Handles global theme, language context, and system-wide error listeners.
 */

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/components/language-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@/components/analytics';
import { CookieConsent } from '@/components/cookie-consent';
import { useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { logErrorToFirestore } from '@/lib/error-logging';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const { firestore } = initializeFirebase();
      logErrorToFirestore(firestore, event.error || event.message, {
        type: 'runtime'
      });
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const { firestore } = initializeFirebase();
      logErrorToFirestore(firestore, event.reason, {
        type: 'runtime',
        metadata: { isPromiseRejection: true }
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;0,7..72,700;0,7..72,800;1,7..72,400;1,7..72,500;1,7..72,600;1,7..72,700;1,7..72,800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Analytics />
        <FirebaseClientProvider>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <FirebaseErrorListener />
              <CookieConsent />
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <div id="main-content">
                {children}
              </div>
              <Toaster />
            </ThemeProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
