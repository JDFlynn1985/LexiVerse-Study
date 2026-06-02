
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/components/language-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@/components/analytics';
import { CookieConsent } from '@/components/cookie-consent';

export const viewport: Viewport = {
  themeColor: '#301934',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'LexiVerse Explorer',
  description: 'A comprehensive Bible study tool for in-depth word and verse analysis.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LexiVerse',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;0,7..72,700;0,7..72,800;1,7..72,400;1,7..72,500;1,7..72,600;1,7..72,700;1,7..72,800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap" rel="stylesheet" />
        <meta name="application-name" content="LexiVerse Explorer" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LexiVerse" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/lexiverse-icon/192/192" />
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
