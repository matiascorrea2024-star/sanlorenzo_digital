import Script from "next/script";

export default function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX";

  if (!process.env.NEXT_PUBLIC_GA_ID) {
    console.warn(
      "⚠️  Google Analytics ID not configured. Set NEXT_PUBLIC_GA_ID in .env.local"
    );
    return null;
  }

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
