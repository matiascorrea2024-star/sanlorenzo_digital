"use client";
// GA solo carga tras consentimiento explícito (banner de cookies).
// Sin "Aceptar todo" no hay gtag ni cookies de analítica.
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_KEY } from "@/components/ui/cookie-consent";

export default function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    try {
      setConsent(localStorage.getItem(CONSENT_KEY));
    } catch {
      setConsent(null);
    }
    const onChange = (e: Event) => setConsent((e as CustomEvent).detail as string);
    window.addEventListener("sld-consent", onChange);
    return () => window.removeEventListener("sld-consent", onChange);
  }, []);

  if (!GA_ID) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Google Analytics ID not configured. Set NEXT_PUBLIC_GA_ID in .env.local");
    }
    return null;
  }
  // undefined = todavía no sabemos (evita flash de carga antes del check)
  if (consent === undefined || consent !== "all") return null;

  return (
    <>
      {/* Google Analytics */}
      <Script
        id="google-analytics-init"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics-events"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
            });
          `,
        }}
      />

      {/* Event tracking utilities - para usar en componentes */}
      <Script
        id="google-analytics-utilities"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.trackEvent = function(eventName, eventParams) {
              if (typeof gtag !== 'undefined') {
                gtag('event', eventName, eventParams);
              }
            };

            window.trackPageView = function(path, title) {
              if (typeof gtag !== 'undefined') {
                gtag('config', '${GA_ID}', {
                  page_path: path,
                  page_title: title,
                });
              }
            };

            window.trackConversion = function(value, currency = 'ARS') {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'purchase', {
                  currency: currency,
                  value: value,
                });
              }
            };
          `,
        }}
      />
    </>
  );
}
