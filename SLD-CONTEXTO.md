# SAN LORENZO DIGITAL — CONTEXTO DEL PROYECTO (leer al iniciar cualquier chat)
Actualizado: 2026-08-15

## Perfil del usuario
- No técnico. Trabajar SOLO con bloques únicos de terminal para copiar y pegar.
- NUNCA usar sed para editar JSX (ya rompió el build una vez). Archivos completos con cat > archivo << 'EOF'.
- Linux Mint. Proyecto en ~/Escritorio/sanlorenzo_digital. Deploy con `vercel --prod`.
- NO tocar otros proyectos (Almendra POS, almendra_flagship).
- PENDIENTE SEGURIDAD: rotar token GitHub ghp_iOwU... antes del lanzamiento.

## Decisiones de diseño (NO negociar)
- Estética que el usuario ama: naranja/rosa, tarjetas sld-card, la que está en Vercel.
- NO banner con foto (MasterHome descartado como home).
- Home = máquina de ofertas: hero compacto + barra sticky de rubros/filtros + Gran Barata primero + negocios. "Apretás y lo tenés ahí" (scroll suave a resultados).
- Premium = restricción y orden. Descartado: partículas, cursor custom, aurora (pack GUUAUU).
- No inventar negocios/ofertas/stats. Estados vacíos honestos.

## Stack
Next 16 App Router + React 19 + Tailwind 4 + TS + Supabase SSR + Leaflet.
Supabase: brsjvecvlsemkeooqppg. Tablas: businesses, offers, reviews, coupons, notifications, followers, favorites, user_profiles, reports, reservations, tracked_links, user_alerts, user_lists, list_items, business_claims. Vista: offers_with_business.

## Ya aplicado
- Home centrada en ofertas con barra sticky (resultados instantáneos).
- Header premium altura fija (logo badge, punto activo, hairline).
- Hero compacto (count-up, plurales, atajo "/", trust bar).
- Ticker conectado a offers_with_business, 60s.
- lib/use-businesses.ts: producción SIN negocios falsos.
- Limpieza de archivos basura y backups.

## Pendiente
- FASE 2 SEO: generateMetadata + JSON-LD en negocio/oferta/buscar; sitemap completo.
- FASE 3 PERFORMANCE: extirpar CSS muerto de globals.css (sld2/v10/v11/paywall/dashboards si grep confirma).
- FASE 4 QA: build + lint; mobile 320px; ocultar negocios de prueba de la DB (MATIAS PRUEBA etc.); revisar RLS; rotar token.
- Futuro: categorías en DB; tablas país→provincia→ciudad; /buscar con filtros completos.

## Archivos clave
app/page.tsx → HomeClient. components/home-client.tsx (núcleo). components/home/hero.tsx. components/layout/header.tsx. components/home/offers-ticker.tsx. lib/data.ts (CATEGORIES + mocks dev). lib/use-businesses.ts. app/globals.css (Frankenstein de capas, cirugía pendiente).
