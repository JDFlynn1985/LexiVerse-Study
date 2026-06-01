'use client';

/**
 * @fileOverview Analytics component for Google and Matomo tracking.
 */

import Script from 'next/script';
import { appConfig } from '@/app-config';

export function Analytics() {
  const { google, matomo } = appConfig.analytics;

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
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${google.measurementId}');
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
