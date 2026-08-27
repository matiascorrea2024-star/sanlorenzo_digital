// Igual que sentry.server.config.ts pero para el runtime edge (middleware,
// rutas que corren en Edge). No-op si SENTRY_DSN no está seteado.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
});
