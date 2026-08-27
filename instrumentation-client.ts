// Monitoreo de errores en el browser. Next.js carga este archivo
// automáticamente (convención de la App Router, sin flag experimental
// necesario). No-op si NEXT_PUBLIC_SENTRY_DSN no está seteado.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
