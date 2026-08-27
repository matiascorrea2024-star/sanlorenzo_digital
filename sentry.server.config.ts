// Monitoreo de errores en el servidor (rutas de API, server components).
// No-op si SENTRY_DSN no está seteado -- mismo patrón que ya usa gaEvent
// para Google Analytics: el proyecto funciona igual sin la variable,
// nada se rompe, solo no hay reporte de errores hasta que se configure.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
});
