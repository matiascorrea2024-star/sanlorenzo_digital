# HANDOFF — San Lorenzo Digital / "La Gran Barata"

> Documento de continuidad para cualquier agente/dev que retome el proyecto.
> Última actualización: 2026-08-26. Leelo entero antes de tocar código.
> Complementa a: `UX-AUDIT.md` (auditoría UX), `UX-TESTING-PROTOCOL.md` (testing con usuarios), `SLD-CONTEXTO.md` (contexto histórico, parcialmente desactualizado).

---

## 1. Qué es el proyecto

**Marketplace local de ofertas para San Lorenzo, Santa Fe, Argentina** ("La Gran Barata").
Conecta comercios de barrio con vecinos a través de ofertas y promociones vigentes.

- **Vecinos**: descubren ofertas cerca, contactan al comercio por WhatsApp (la conversión principal es un click a `wa.me`), arman recorridos de compras, guardan favoritos.
- **Comercios**: crean su miniweb/ficha, publican ofertas y catálogo, ven estadísticas. Freemium con 4 planes (`lib/plans.ts`): **Gratis**, **Comerciante Plus**, **PRO Comerciante**, **Destacado Semanal** (posición fija en home, máx 5 negocios). Cobro por MercadoPago (`app/api/mercadopago`, tabla `subscriptions`).
- **Principio fundacional (NO negociable)**: no inventar negocios/ofertas/stats. Estados vacíos honestos siempre. La confianza local es el producto.

## 2. Estado del repo (al 2026-08-26)

- Rama `main`, árbol limpio, sincronizado conceptualmente con Vercel (deploy manual del dueño con `vercel --prod`).
- Últimos commits:
  - `cdd5b86` ux: quick wins de la auditoría (CTA/contexto primero)
  - `9cd97a9` feat: V3 visual + módulos nuevos (Para Vos, Recorrido, Modo TV, 2FA) + fixes
- **Verificado en el último commit**: `tsc --noEmit` limpio · `eslint` 0 errores · `next build` OK · Playwright 8 pasan / 1 salteado (pagos, requiere credenciales reales).

## 3. Stack y comandos

Next.js **16** (App Router, Turbopack) + React 19 + Tailwind **v4** + TypeScript + Supabase (SSR + client) + Leaflet + LiveKit (en-vivo) + GSAP + web-push + MercadoPago + Resend.

```bash
npm run dev            # dev server (puerto 3000)
npm run build          # build producción
npm run lint           # eslint (debe dar 0 errores)
npx tsc --noEmit       # typecheck (debe dar limpio)
npx playwright test    # e2e (levanta su propio dev server en 127.0.0.1:3000)
npm run seed:local     # seed de datos de prueba (scripts/seed-local.mjs)
```

### Gotchas críticos (mordieron ya, no repetir)

1. **NO correr `npm run build` con el dev server andando**: pisan el mismo `.next` y el dev queda sirviendo chunks rotos (páginas en spinner eterno). Matar antes: `fuser -k 3000/tcp`. Ante dudas: `rm -rf .next` y reiniciar dev.
2. **Next 16 NO es el Next que conocés**: leer `node_modules/next/dist/docs/` antes de asumir APIs. `middleware.ts` aparece como "Proxy" en los logs. `allowedDevOrigins` en `next.config.ts` es OBLIGATORIO: sin él, entrar por `127.0.0.1` o IP de LAN (celulares en testing) recibe 403 en `/_next/static` y la app queda en spinner. No sacar.
3. **CSP** en `next.config.ts`: `script-src` necesita `'unsafe-inline'` (App Router hidrata con scripts inline). `img-src https:` (permite QR externo del modo TV, que tiene fallback).
4. **Nunca usar `sed` para editar JSX** (rompió el build históricamente). Usar herramientas de edición proper.
5. Fechas: **siempre** contra `hoyArgentina()` (`lib/fecha-ar.ts`), nunca contra el reloj del dispositivo. `valid_until` es un string `YYYY-MM-DD`.
6. Playwright usa `reuseExistingServer: true`: si hay un dev server viejo/roto en el 3000, los tests van a fallar de forma engañosa. Verificar que el 3000 esté sano antes de culpar al código.

## 4. Mapa de arquitectura

```
app/
  page.tsx → home (HomeClient)          oferta/[id]/          dashboard/  (panel comerciante, ~20 rutas)
  negocio/[slug]/   ficha pública       para-vos/  feed inteligente    admin/  (panel admin, gate 2FA)
  negocio/[slug]/tv/ modo TV escaparate recorrido/  optimizador favoritos    api/ (track, push, mercadopago, alerts, coupons, campaigns, cron, ...)
  promociones/ buscar/ mapa/ ranking/ reels/ en-vivo/ comunidad|feed|pulso|vecinos/  planes/ perfil/ login|registro/
  r/[code]/  → tracked links (QR/campañas) con atribución
components/
  home/  hero, ofertas-bomba, colecciones, stories, featured, social-proof...
  layout/ header, footer, bottom-nav (7 items hoy), city-switcher
  ui/     offer-card, smart-search, cookie-consent, countdown-timer, level-up-card, division-frame (gamificación)...
  business/ card, reviews-section, chat, follow-button, level-badge
  dashboard/ growth-center, commercial-calendar, business-pulse...
lib/
  supabase.ts (client) / supabase-server.ts (server)   fecha-ar.ts  geo.ts (calcDistanceKm, fmtDistance)
  plans.ts (PLANES)  ranks.ts (gamificación)  track.ts (gaEvent + /api/track)  data.ts (CATEGORIES)
  cart-context.tsx  hooks/use-analytics.ts (callbacks estables)  use-businesses.ts
supabase/  schema.sql + migrations/ (RLS vive acá; migrations > schema.sql en autoridad)
middleware.ts  → gate de auth para /dashboard /panel /crear /admin (redirect a /login)
```

**Datos clave:**
- Vista `offers_with_business` = fuente de ofertas en TODO el sitio (home, promociones, para-vos, favoritos). No leer `offers` crudo para listados.
- Tablas núcleo: `businesses`, `offers`, `products`, `business_reviews`, `coupons`, `followers`, `favorites`, `user_profiles`, `analytics_events`, `page_views`, `tracked_links`, `user_alerts`, `push_subscriptions`, `subscriptions`, `locations` (ciudad→barrio).
- **Tablas huérfanas listas para usar**: `user_lists` + `list_items` (existen, cero referencias en el código → base de "Mi barata", idea #3 del backlog).
- `analytics_events` es **append-only** (no hay "un-interest"); el contador de "Me interesa" se lee con GET `/api/track?offer_id=`.
- RLS: `favorites` solo expone filas propias (policy `fav_write`). **Toda** query de favoritos lleva `.eq("user_id", ...)` explícito.

## 5. Convenciones

- **Copy**: español argentino de barrio ("Buscá", "Sumá al changuito", "Corré que se termina", "sin vueltas"). Es identidad, no descuido.
- **Visual V3 (neobrutalista magenta)**: clases utilitarias en `app/globals.css` — `.btn-hard` (sombra dura que se hunde), `.btn-hard-green`, `.font-display` (Big Shoulders, cartel de feria), `.font-tech` (microcopy uppercase), `.knockout-text`, `.magenta-glow`, `.card-lift`, `.custom-scrollbar`. Tokens CSS `--accent`, `--ok`, `--bad`, `--warn`, etc. No recolorear selectores globales: las clases son opt-in por componente.
- **Temas**: dark por defecto + light (`lib/theme-context.tsx`, `data-theme` en `<html>`). Cualquier UI nueva debe verse bien en ambos (hay antecedentes de light roto en Reels).
- **Tracking**: eventos vía `useAnalytics()` (callbacks estables, seguros para deps) o `lib/track.ts`. `event_type` validado por whitelist en `/api/track`.
- **Permisos/planes**: gatear features con `planDe(negocio)` (`lib/plans.ts`), no con hardcoded. Ej: cupones solo Plan PRO.
- **Accesibilidad**: aria-labels en botones icon-only, `prefers-reduced-motion` respetado en carruseles, targets táctiles ≥44px.

## 6. Sprint UX en curso (etapa actual del proyecto)

Flujo acordado con el dueño: **auditar → quick wins → testing con usuarios reales → iterar prototipos**.

- ✅ Etapa 1: auditoría con capturas → `UX-AUDIT.md` (4 críticos, 4 altos, 4 medios + fortalezas a preservar).
- ✅ Quick wins objetivos commiteados (`cdd5b86`): notify-me contextual, panel de nivel solo-duelo, CTA WhatsApp sin duplicar, cookie banner compacto, /buscar?q= redirige a resultados.
- ⏳ **Siguiente paso (el dueño ejecuta)**: 4 sesiones de testing (2 vecinos + 2 comercios) siguiendo `UX-TESTING-PROTOCOL.md`. Cuando traiga las notas: agrupar fricciones por frecuencia×severidad, contrastar contra el audit, recién ahí prototipar.
- ⏸️ **Decisiones diferidas a post-testing** (no tomarlas por tu cuenta): bottom-nav 7→5 items, jerarquía del mapa (mapa alto arriba), densidad/orden de secciones de la home, "Reportar negocio" a menú secundario.

## 7. Deuda técnica conocida (no "arreglar" sin necesidad)

- **~400 warnings `any`** en eslint: deuda de tipado gradual. Empezar por `lib/types.ts` y las props de clientes grandes si se ataca. NO limpiar en masa de un saque.
- **55 `set-state-in-effect`**: mayoría son patrones legítimos de init (localStorage/DOM en useEffect). Revisar caso por caso, no masivamente.
- **11 `exhaustive-deps` restantes**: intencionales (efectos run-once, refs de última valor). "Arreglarlos" a ciegas duplica fetches y contadores de analytics.
- **9 `window.location.href = "/login"`**: gates de auth con recarga completa intencional (resetea estado cliente). Patrón consistente.
- `globals.css` es un "Frankenstein" de capas viejas (sld2/v10/v11): cirugía de CSS muerto pendiente (grep antes de borrar).
- Pre-lanzamiento (del dueño, no código): ocultar negocios de prueba de la DB ("MATIAS PRUEBA" etc.), rotar token GitHub viejo.
- QR del Modo TV depende de `api.qrserver.com` (tiene fallback graceful; idea #2 lo reemplaza).

## 8. Backlog de ideas (estado al 2026-08-26)

### ✅ Implementado (commit feat del 26/08)

- **#1 Duplicar ofertas**: botón "📋 Duplicar" en `⋯ Más` de cada oferta en `/dashboard/ofertas`. Copia inactiva con `valid_until` +7 días, avisa si al activarla se supera el límite del plan. Insert directo del cliente (mismo patrón RLS que "nueva").
- **#2 QR de vidriera**: componente `components/dashboard/qr-vidriera.tsx` dentro de la tarjeta de cada negocio del dashboard. QR generado LOCALMENTE (paquete `qrcode`) apuntando a `/r/[code]` con `source=qr` (el RPC `create_tracked_link` es idempotente: el QR impreso nunca cambia). Descarga PNG/SVG + contador de escaneos (columna `clicks` de `tracked_links`, legible por el dueño).
- **#3 Mi Barata** (`/mi-barata`): lista de compras persistente multi-negocio. `lib/mi-barata.ts` + `app/mi-barata/` (totales con ahorro, agrupado por negocio con WhatsApp agrupado, quitar ítems) + botón "Sumar a Mi Barata" en `/oferta/[id]` + `/recorrido?fuente=barata` reusa el optimizador de ruta con los negocios de la barata. **Requiere la migración `20260826120000_mi_barata.sql` aplicada en el Supabase REMOTO antes del deploy** (en local ya está aplicada; sin ella el botón falla con toast de error y la página muestra vacía, sin romper).
- **#5 Sinónimos argentos**: `lib/sinonimos.ts` (~120 términos curados) + expansión en `components/negocios-client.tsx` ("choper" encuentra "cerveza"). El término original tiene prioridad; máx 5 términos por query.
- **#9 Seed curado**: `scripts/seed-local.mjs` ahora siembra 12 comercios realistas de San Lorenzo con fotos (Unsplash verificadas), horarios, ratings y 17 ofertas con precios creíbles (una vence HOY para probar countdowns). `--reset` borra solo lo demo; `--bulk N` conserva el generador masivo. Login demo: `sld.demo.0001@local.test` / `DemoLocal2026!`.
- **#4 Push a seguidores: YA EXISTÍA** — no implementar de nuevo. Cadena completa en DB: `trg_notify_offer` (insert de oferta activa → notificación a seguidores) → `trg_notify_push_webhook` (insert de notification → `net.http_post` → `/api/push/send` → web-push). El anti-spam lo da el límite de ofertas/día del plan.

### Dev contra Supabase local (para probar features nuevas sin tocar producción)

```bash
fuser -k 3000/tcp
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CR7P_DMHUpj8QgX9C8n8d3EANcV9DceXK4c0Hd7Xcmw" \
npm run dev
```
La CSP permite `http://127.0.0.1:54321` en `connect-src` SOLO en desarrollo (ver `next.config.ts`). Sin esa excepción el login local falla con "No pudimos conectarnos".

### Pendientes del backlog (post-testing)

- **#6 Horarios estructurados** + "ABIERTO AHORA" calculado (media; migración + editor + badge).
- **#7 Reseñas con foto** (media; storage + moderación).
- **#8 Modo claro pulido** (media; barrido de contraste V3 en light).
- **#10 PWA offline** (baja-media; sw.js mínimo, NO cachear rutas auth).
- Post-testing: historial de precios en /comparar, referidos con UI, bottom-nav 7→5, jerarquía del mapa, densidad home.

### Detalle de las pendientes

#### #6 · Horarios estructurados + "ABIERTO AHORA" real — complejidad media
**Qué**: hoy `businesses.schedule` es texto libre y `open` un booleano manual. Modelar horarios (JSON por día o tabla) y calcular "abierto ahora" con `America/Argentina/Buenos_Aires`. El badge de la ficha y los filtros del mapa pasan a ser confiables.
**Dónde**: migración + `app/dashboard/editar/[slug]` (editor amigable de horarios) + helper en `lib/` + consumidores del badge (`negocio/[slug]/client.tsx`, mapa).

#### #7 · Reseñas con foto — complejidad media
**Qué**: extender `business_reviews` con 1-3 fotos (storage ya se usa para productos/ofertas). La foto de una factura/plato vale más que 10 estrellas para confianza local.
**Dónde**: `components/business/reviews-section.tsx` (form + grid), migración (`review_photos jsonb` o tabla), moderación existente en `review-moderation.tsx` debe mostrarlas.

#### #8 · Modo claro pulido — complejidad media
**Qué**: auditar TODA la app en light (el audit histórico ya encontró Reels ilegible). Contraste de V3 (magenta sobre blanco necesita ajustes), sombras `.btn-hard` hardcodeadas a `#861642` funcionan, pero revisar `bg-white/5` sobre claro.
**Dónde**: `app/globals.css` (tokens por tema) + barrido de capturas light (mismo script de screenshots con `colorScheme: 'light'`).

#### #10 · PWA offline básica — complejidad baja-media
**Qué**: service worker mínimo: cache de shell + última home/ofertas vistas para abrir offline (el colectivo/barrio con señal floja es contexto real). Manifest ya existe.
**Dónde**: `public/sw.js` + registro en `app/layout.tsx`. No cachear rutas autenticadas ni POSTs.

### Ideas post-testing (no prototipar antes)
- Historial de precios en `/comparar` (sparkline por producto).
- Programa de referidos vecino→vecino (`app/api/referrals` ya existe, falta UI con recompensa).
- Bottom-nav 7→5, jerarquía del mapa, densidad home (ver sección 6).
- Multi-sucursal; exportar seguidores (comerciante); campañas por barrio ya existen en API (`app/api/campaigns`).
- Plantillas de ofertas (v2 de #1): columna `es_plantilla` en `offers` o tabla nueva.

## 9. Qué NO hacer

- No inventar datos ni "negocios de ejemplo" en producción (solo en `seed:local`).
- No cambiar el lenguaje visual V3 ni el copy argentino: son decisiones del dueño.
- No meter IA/LLMs donde un diccionario o un ORDER BY resuelven (ver #5).
- No tocar otros proyectos del usuario (Almendra POS, almendra_flagship).
- No commitear sin: `tsc` limpio + `eslint` 0 errores + `build` OK (+ Playwright si tocaste flujos). Patrón de commit del repo: mensajes en español, cuerpo detallado, un commit temático.

## 10. Verificación de cualquier cambio (ritual)

1. `npx tsc --noEmit`
2. `npx eslint .` → 0 **errores** (los warnings existen; no sumar).
3. `npm run build` (con el dev server apagado).
4. Si tocaste flujos core: `npx playwright test` (8 pasan, 1 salteado).
5. Si es UI: capturas mobile 390px + desktop 1440px de las páginas tocadas (Playwright headless, patrón en `/tmp/opencode/shots.mjs` del sprint) y mirarlas.
6. Commit temático con cuerpo explicativo.
