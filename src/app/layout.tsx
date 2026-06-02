
'use client';

import type { Metadata, Viewport } from 'next';
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

// Note: Metadata and Viewport are moved to a separate server component or handled differently in client layouts
// For this prototype, we'll focus on the client-side error capture logic.

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
