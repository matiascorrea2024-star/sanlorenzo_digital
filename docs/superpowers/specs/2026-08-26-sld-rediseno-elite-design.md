# San Lorenzo Digital — Rediseño "Nivel Élite" + Estrategia FOMO

> Spec de diseño. Última actualización: 2026-08-26.
> Complementa a `HANDOFF.md` (estado técnico y convenciones) — no lo reemplaza.

> **Amendment 2026-08-26 (post Batch 1):** el dueño pidió explícitamente que la Fase 1 no sea un ajuste de tokens sobre el markup actual, sino un **transplante literal, página por página, del markup/layout de los 22 mockups de superdesign** ("no quiero ver el diseño que hay actual, tiene que cambiar totalmente") — estructura de tarjetas, header, hero, espaciados, jerarquía visual tal cual están en los mockups. Además dio licencia creativa explícita para sumar mejoras propias más allá de los mockups donde el criterio propio lo justifique ("si ves que le podes agregar más cosas... para que quede buenísimo, hacelo"). Esto NO relaja §2: sigue sin inventarse dato, contador o feature que no exista de verdad — el transplante es de layout/visual, los `<span>{{likesCount}}</span>` y similares del mockup se reemplazan por bindings reales o se omiten si no hay dato. Se prioriza fidelidad al mockup + mejoras propias justificadas por sobre "reusar lo que ya hay" cuando entran en conflicto.

## 1. Visión y objetivo de negocio

El dueño quiere que San Lorenzo Digital sea la razón por la que un vecino de San Lorenzo abre el celular antes que Instagram, Facebook o MercadoLibre para ver qué está pasando en su ciudad. Es un proyecto comercial: el dueño necesita generar ingresos reales a través de los planes pagos de comercios (`lib/plans.ts`) y, a futuro, replicar el modelo en otras ciudades. El criterio de éxito no es "que se vea lindo" sino que:

1. Los vecinos vuelvan todos los días porque temen perderse una oferta (FOMO real, no artificial).
2. Los comercios vean valor tangible y mensurable en pagar un plan superior.
3. El sitio entero se sienta como un producto de estudio digital top (referencia explícita del dueño: nivel Amazon), no una plantilla.
4. La arquitectura no ate el producto a "San Lorenzo" — debe poder clonarse a otra ciudad sin reescribir.

## 2. Principios no negociables (heredados de HANDOFF.md, se mantienen)

- **Cero datos inventados.** Contadores, likes, stock, cuotas, votos: solo si hay una columna real detrás. Los mockups de superdesign traen números de ejemplo (`likesCount: 342`, `yesVotes/noVotes`, "3 Cuotas s/Int") que se descartan o se reemplazan por el dato real (o el componente no se muestra si no hay dato).
- **Estados vacíos honestos** siempre que no haya datos suficientes.
- **La conversión sigue siendo WhatsApp** (`wa.me`), no un checkout de e-commerce. Ver §5 (fuera de alcance).
- **No tocar** el copy argentino de barrio ni el lenguaje visual base V3 (magenta `#d12f68`, Big Shoulders, Space Grotesk) — se profundiza, no se reemplaza.
- Ritual de verificación de HANDOFF §10 aplica a cada fase (`tsc`, `eslint`, `build`, Playwright en flujos core).

## 3. Qué encontramos ya construido (no reinventar)

Antes de proponer features nuevas, relevamiento de lo que YA existe y solo necesita potenciarse:

- **Descubrimiento/contenido**: `components/home/stories.tsx`, `reels-strip.tsx` + `components/reels/*`, `live-now.tsx` + `components/live/*` (broadcaster-room, viewer-stage, live-chat), `offers-ticker.tsx`, `colecciones.tsx`, `wall-of-fame.tsx`, `voto-del-dia.tsx`, `oferta-bomba.tsx`.
- **IA/asistente**: `components/ui/floating-assistant.tsx`.
- **Mapa**: `app/mapa/`.
- **Gamificación de comercios**: `lib/ranks.ts` (sistema de rangos real, 8 niveles, estética "metal/gema"), `app/ranking/`.
- **Herramientas de marketing para comerciantes**: `components/dashboard/growth-center.tsx`, `business-pulse.tsx`, `commercial-calendar.tsx`, `qr-vidriera.tsx`.
- **Carrito ("Mi Barata")**: NO es checkout — es lista de compras multi-negocio con recordatorio de abandono (`components/cart/abandoned-reminder.tsx`, `cart-fab.tsx`) que resuelve en WhatsApp agrupado. Ya cubre el espíritu de "Carrito Premium" del mockup sin inventar pagos.
- **Comunidad**: `components/community/pedidos-board.tsx`.

Conclusión: el sitio ya tiene casi todos los "ingredientes" que pide el dueño. El trabajo es (a) subir el nivel visual de todo esto al lenguaje del mockup nuevo, y (b) conectar mejor estas piezas entre sí para que se sientan como un ecosistema vivo, no módulos sueltos.

## 4. Fases

### Fase 1 — Sistema visual unificado + reskin (arranca ahora)

Objetivo: que cualquier página del sitio se sienta al nivel de los 21 mockups, sin cambiar datos ni lógica.

**Sistema de diseño compartido** (nuevo, en `app/globals.css` + posible `components/ui/offer-card.tsx` reescrito):
- Tarjetas con profundidad real: bordes sutiles, `hover:-translate-y-2`, sombra + glow magenta al hover (`card-depth` del mockup vs `card-lift` actual — fusionar en una sola clase superior).
- Blobs de luz ambiental magenta en fondos oscuros (`.fixed ... blur-[180px]`) para el home y páginas hero.
- Header "glass" consistente (`glass-dark` ya existe — auditar que se use en todos lados).
- Radios más generosos en tarjetas grandes (`rounded-[2rem]`/`[3rem]` donde el mockup lo usa) sin romper densidad mobile.
- Un `OfferCard` único y reusable (hoy hay lógica repetida entre `components/ui/offer-card.tsx` y varias vistas custom) que reemplaza duplicaciones, alimentado 100% con props reales — el JSON de superdesign sirve de referencia de markup/interacciones, no de datos.

**Páginas a re-piel (con sus componentes reales, sin features nuevas):**
| Mockup | Página real | Nota |
|---|---|---|
| Offer Details | `app/oferta/[id]/` | |
| Shop Profile Premium | `app/negocio/[slug]/` | |
| Resultados de Búsqueda | `app/buscar/` | |
| Community Reviews | reviews existentes en ficha de negocio | ya completo funcionalmente, solo estilo |
| User Profile & Dashboard | `app/perfil/` | |
| Merchant Onboarding | `app/onboarding/` (o `crear` si aplica) | |
| Merchant Offer Creation | `app/dashboard/nuevo/`, `app/dashboard/ofertas/` | |
| Merchant Admin Dashboard | `app/dashboard/` (home + nav) | |
| Radar en Vivo & Discovery | `app/radar/` | |
| Challenges & Leaderboards | `app/ranking/` | es de comercios, no de vecinos — ver §4.2 |
| Notifications Center | panel de campana existente | |

No incluidas en fase 1 (ver §4.2 y §5): Seller Q&A, Marketing Hub, Shoppable Social Feed, Viral Referral Engine, Wishlist separada, Carrito/Order Tracking/Variantes.

### Fase 2 — Motor de FOMO (con datos reales)

Mecánicas de "no me quiero perder nada", todas atadas a datos reales existentes o fáciles de agregar sin inventar:

- **Urgencia real**: countdown ya existe (`countdown-timer.tsx`) — asegurar que esté en toda oferta con `valid_until`, no solo algunas.
- **Actividad social en vivo**: `live-visitors.tsx` y `online-badge.tsx` ya existen a nivel comercio — extender a "X personas viendo esta oferta ahora" si hay tracking de sesión real (`analytics_events`), si no, no mostrarlo.
- **"Se está por terminar"**: ofertas con `valid_until` en <24hs destacadas con tratamiento visual distinto (ya hay `oferta-bomba.tsx` — evaluar si cubre esto o hace falta variante).
- **Notificaciones push dirigidas**: el caño ya existe (`trg_notify_offer` → push). Fase 2 es UX: opt-in más agresivo pero honesto ("no te pierdas las ofertas de tus favoritos"), no spam.
- **Rachas/hábito**: evaluar si tiene sentido un indicador simple de "volviste 3 días seguidos" — solo si hay tabla que lo soporte sin inventar.

Este ítem entero se decide en detalle recién cuando arranque (es su propio sub-proyecto, no se sobre-especifica acá).

### Fase 3 — Herramientas de venta para comerciantes

Subir de nivel lo que ya existe en vez de crear de cero:
- `growth-center.tsx` + `business-pulse.tsx` + `commercial-calendar.tsx`: hacerlos más accionables (sugerencias concretas: "publicá una oferta, hace 5 días que no subís nada").
- Idea #1 del backlog HANDOFF ("Lo que busca la gente" — demanda insatisfecha desde `analytics_events` de búsquedas sin resultado): la joya que nadie más le puede dar al comercio, alta prioridad.
- Onboarding de carga de oferta más simple (menos pasos, defaults inteligentes) para bajar la fricción de "cargar es difícil".

### Fase 4 — Navegación sin fricción

El pedido explícito de "que apenas apretás algo te lleve directo ahí, no que tengas que bajar toda la web": revisar la IA de información completa — mega-menú o command palette (`/` ya es shortcut de búsqueda según SLD-CONTEXTO), accesos directos desde el header a Radar/Hot/Comunidad/Mi Barata, reducir profundidad de clics a las acciones más usadas. Se define junto con la fase 1 de reskin del header/nav porque son la misma superficie.

### Fase 5 — Preparado multi-ciudad (no implementar aún, solo no bloquear)

Ya existe `app/[ciudad]/` y un `city-switcher` mencionado en HANDOFF. Regla para todas las fases anteriores: **no hardcodear "San Lorenzo"** en componentes nuevos si ya hay un patrón de ciudad dinámica — usar el mismo mecanismo existente. No se diseña la expansión multi-ciudad en este spec; solo se evita crear deuda que la bloquee.

## 5. Fuera de alcance (decisión explícita, no un olvido)

**Carrito de compras real / checkout / pagos de producto / tracking de pedidos / variantes de producto** (mockups #6, #7, #8): el modelo de negocio actual convierte por WhatsApp. Construir un carrito que simula compra pero no cobra ni gestiona stock real sería la primera "mentira visual" del sitio — rompe el principio fundacional documentado en HANDOFF ("no inventar funcionalidades falsas"). Si el dueño quiere ir hacia e-commerce transaccional real (pagos, inventario, logística), es una decisión de producto mayor que merece su propio spec — no se cuela como sub-tarea de un reskin.

**Marketing Hub / Shoppable Social Feed / Viral Referral Engine / Seller Q&A / Wishlist separada**: quedan en el backlog de Fase 2+, se especifican una por una cuando les toque el turno (evita sobre-diseñar hoy algo que puede cambiar).

## 6. Testing y verificación

Cada fase sigue el ritual de HANDOFF §10 antes de commitear: `tsc --noEmit` limpio, `eslint` 0 errores, `next build` OK, Playwright en flujos tocados, capturas mobile 390px + desktop 1440px de páginas modificadas. La Fase 1 al ser visual pura se verifica además navegando cada página re-diseñada en el navegador (dev server) antes de dar por terminada.

## 7. Próximo paso

Este spec cubre la visión completa; el plan de implementación detallado (archivos exactos, orden de commits) se arma para **Fase 1 únicamente** vía `writing-plans`, porque es la que arranca ahora. Fases 2-5 vuelven a este documento como backlog priorizado y se planifican una por una cuando terminemos la anterior.
