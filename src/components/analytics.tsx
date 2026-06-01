'use client';

/**
 * @fileOverview Analytics component for Google and Matomo tracking.
 * Respects user cookie consent preferences.
 */

import Script from 'next/script';
import { appConfig } from '@/app-config';
import { useEffect, useState } from 'react';

// Global declaration for TypeScript to recognize analytics objects
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    _paq?: any[];
    dataLayer?: any[];
  }
}

const CONSENT_KEY = 'lexiverse_cookie_consent';

/**
 * Helper to check if a specific cookie category is allowed.
 */
function isConsentGranted(category: 'analytics' | 'functional' | 'marketing'): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(CONSENT_KEY);
  if (!saved) return false;
  try {
    const prefs = JSON.parse(saved);
    return !!prefs[category];
  } catch {
    return false;
  }
}

/**
 * Tracks a click on a scholarly sponsorship or advertisement link.
 * @param adId Unique identifier for the advertisement or resource.
 * @param adPosition Where the ad is located (e.g., 'sidebar', 'footer', 'dashboard').
 */
export function trackAdClick(adId: string, adPosition: string) {
  if (typeof window === 'undefined') return;

  // Respect marketing consent for sponsorship tracking
  if (!isConsentGranted('marketing')) return;

  // Track in Google Analytics (GA4)
  if (window.gtag) {
    window.gtag('event', 'ad_click', {
      ad_id: adId,
      ad_position: adPosition,
      event_category: 'sponsorship',
    });
  }

  // Track in Matomo
  if (window._paq) {
    window._paq.push(['trackEvent', 'Sponsorship', 'Click', `${adId} - ${adPosition}`]);
  }
}

export function Analytics() {
  const { google, matomo } = appConfig.analytics;
  const [canLoadAnalytics, setCanLoadAnalytics] = useState(false);

  useEffect(() => {
    setCanLoadAnalytics(isConsentGranted('analytics'));
  }, []);

  if (!canLoadAnalytics) return null;

  return (
    <>
      {/* Google Analytics (GA4) */}
      {google.measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${google.measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${google.measurementId}', {
                'anonymize_ip': true,
                'cookie_flags': 'SameSite=None;Secure'
              });
            `}
          </Script>
        </>
      )}

      {/* Matomo Analytics */}
      {matomo.siteId && matomo.url && (
        <Script id="matomo-analytics" strategy="afterInteractive">
          {`
            var _paq = window._paq = window._paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="${matomo.url.endsWith('/') ? matomo.url : matomo.url + '/'}";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '${matomo.siteId}']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>
      )}
    </>
  );
}
