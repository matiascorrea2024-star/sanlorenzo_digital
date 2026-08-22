# 📊 ANÁLISIS TÉCNICO COMPLETO - SAN LORENZO DIGITAL

**Generado:** 2026-08-21 | **Objetivo:** 10/10 pronta para monetizar

---

## 🎯 RESUMEN EJECUTIVO

### Estado Actual: 6.5/10
- ✅ **Arquitectura sólida**: Next.js 16 + Supabase + TypeScript strict
- ✅ **Sistema de planes definido**: GRATIS/PLUS ($4.9k)/PRO ($9.9k)/PREMIUM ($19.9k)
- ✅ **Límites de plan implementados**: Validación en UI + funciones helper
- ✅ **MercadoPago integrado**: Checkout Pro + Webhook configurado
- ✅ **Rutas protegidas**: Middleware funcional
- ⚠️ **PROBLEMAS CRÍTICOS**: 3 vulnerabilidades de seguridad
- ⚠️ **FALTA**: CSP headers, Rate limiting, Sanitización de inputs
- ⚠️ **MONETIZACIÓN INCOMPLETA**: Webhook no valida pagos, RLS débil

---

## 🔴 CRÍTICO - VULNERABILIDADES DE SEGURIDAD

### 1. **FALTA CSP HEADERS** (XSS abierto)
**Ubicación:** `next.config.ts` (LÍNEA 0)
**Riesgo:** Inyección de scripts maliciosos en search, comments, etc.
**Estado:** ❌ NO EXISTE
```
Vulnerable a:
- Script injection en <input> de búsqueda
- LocalStorage hijacking
- Session cookie theft (aunque httpOnly ayuda)
```

### 2. **SIN VALIDACIÓN DE OWNERSHIP EN APIs** (Horizontal Escalation)
**Ubicación:** `app/api/admin/businesses/route.ts:29` (Admin API)
**Riesgo:** Si un usuario "guesa" un businessId, podría modificar planes de otros
**Estado:** ✅ PARCIALMENTE PROTEGIDO (RLS existe pero sin doble validación server-side)
```
La línea: "if (!negocio || negocio.owner_id !== user.id)"
Existe en MercadoPago pero NO en todas las APIs de businesses
```

### 3. **RATE LIMITING AUSENTE** (DoS + Fuerza bruta)
**Ubicación:** `app/api/mercadopago/checkout` + `app/api/admin/*`
**Riesgo:** Crear N pagos simultáneos, spam de solicitudes de admin
**Estado:** ❌ NO EXISTE
```
Sin límite de:
- Requests por IP/usuario
- Intentos fallidos de login
- Creación de ofertas (aunque hay límites por plan en UI)
```

### 4. **SANITIZACIÓN DÉBIL EN BÚSQUEDA** (XSS reflejado)
**Ubicación:** `app/buscar/page.tsx` (buscar query param)
**Riesgo:** `?q=<img src=x onerror=alert(1)>` → XSS en la página
**Estado:** ⚠️ PARCIALMENTE PROTEGIDO (Next.js auto-escapa pero mejor explícito)

### 5. **COOKIES SIN CONFIGURACIÓN EXPLÍCITA**
**Ubicación:** `middleware.ts:19-26` (cookiesToSet)
**Riesgo:** httpOnly/sameSite NO garantizado en todas las cookies
**Estado:** ⚠️ SUPABASE SSR setea defaults pero deberían ser explícitos

---

## 📋 MODELO DE PLANES - ANALYSIS

### Definición en `/lib/plans.ts`
```typescript
PLANES = {
  gratis:     { maxOfertas: 3,  maxProductos: 5,    precioARS: 0,     badge: "" },
  plus:       { maxOfertas: 8,  maxProductos: 30,   precioARS: 4900,  badge: "⭐ Plus" },
  profesional:{ maxOfertas: -1, maxProductos: -1,   precioARS: 9900,  badge: "🚀 Pro" },
  premium:    { maxOfertas: -1, maxProductos: -1,   precioARS: 19900, badge: "🔥 Destacado", destacado: true },
}
```

### Validaciones de Límites
**Ubicación:** `lib/plans.ts` (4 funciones helper)
- ✅ `puedePublicarOferta()` - Valida max ofertas activas
- ✅ `puedePublicarHoy()` - Valida tope diario (anti-spam)
- ✅ `puedeAgregarProducto()` - Valida max productos
- ✅ `puedeCrearVivo()` - Valida max vivos por mes
- ✅ `aplicarLimiteCatalogo()` - OCULTA productos excedentes si downgrade

**Dónde se usan:** 
- Dashboard: `/dashboard/ofertas/nueva`, `/dashboard/productos`, `/dashboard/en-vivo`
- Se validan en UI (UX friendly) pero NO en API (SEGURIDAD)
- ⚠️ **FALTA validación server-side en POST** de ofertas/productos

---

## 💰 SISTEMA DE PAGOS - ANALYSIS

### Integración MercadoPago
**Estado:** 80% completo
- ✅ Config: `lib/mercadopago.ts` (acceso token configurado)
- ✅ Checkout: `app/api/mercadopago/checkout` (crea preferencia)
- ✅ Webhook: `app/api/mercadopago/webhook` (recibe IPNs)
- ⚠️ Tabla `subscriptions` creada pero queries son básicas

### Flujo de Pago Actual
```
1. Usuario elige plan en /dashboard/planes
2. POST /api/mercadopago/checkout
   - Valida dueño ✅
   - Crea row "pending_mp" en subscriptions ✅
   - Genera preference ✅
3. Redirige a MP Checkout
4. Usuario paga (o no)
5. MP IPN → POST /api/mercadopago/webhook
   - Valida secret ✅
   - Actualiza subscription status (approved/rejected) ✅
   - ??? UPDATE businesses.plan ??? (FALTA VERIFICAR)
```

### **PROBLEMA CRÍTICO**: Webhook no valida plan ni vigencia
**Archivo:** `app/api/mercadopago/webhook/route.ts`
**Falta:** 
```typescript
// Después de aprobar pago:
// - UPDATE businesses SET plan = subscription.plan, plan_expira = NOW() + duration
// - Aplicar limite de catálogo si vuelve de un plan mayor
// - Notificar al usuario
// - RLS: Validar que sub.business_id pertenece al usuario ✅ o ❌?
```

---

## 🔒 AUTENTICACIÓN & AUTORIZACIÓN

### Middleware (Next.js 16 deprecated pero funcional)
**Archivo:** `middleware.ts`
- ✅ Redirige `/dashboard/*`, `/panel`, `/crear`, `/admin` a login si sin user
- ✅ Usa Supabase SSR para validar sesión
- ⚠️ **WARNING:** "middleware" es deprecated en Next.js 16 (usar "proxy")

### API Auth
**Ubicación:** `lib/api-auth.ts`
```typescript
- requireUser()  → { user } o error "No autorizado"
- requireAdmin() → { isAdmin } o error "No autorizado: se requiere rol admin"
```
✅ Usado en: `/api/admin/*`, `/api/mercadopago/checkout`
⚠️ Falta usar en: Otras rutas de API que modifican datos

### User Profiles & Roles
**Tabla:** `user_profiles` (Supabase)
- Campos: `user_id`, `role` (user|business_owner|admin), `nivel_usuario`
- ✅ RLS: Solo ve su propio perfil (SQL functions validated)
- ✅ Admin check: `is_admin()` function en BD

---

## 🌐 RUTAS PÚBLICAS vs PROTEGIDAS

### Públicas (sin login)
```
✅ / (home)
✅ /negocios, /ofertas, /buscar, /[ciudad]/[barrio]
✅ /negocio/[slug], /oferta/[id]
✅ /planes (VER planes, no pagar)
✅ /ranking, /mapa, /feed, /reels
✅ /login, /registro, /reset-password
✅ /robots.txt, /sitemap.ts
```

### Protegidas (middleware redirige a login)
```
🔐 /dashboard/* (13 subrutas)
🔐 /panel
🔐 /crear
🔐 /admin/* (8 subrutas)
```

---

## 📊 SEO & METADATA

### Status Actual
| Aspecto | Status | Archivo |
|---------|--------|---------|
| Metadata base | ✅ | `app/layout.tsx` |
| Metadata dinámico | ⚠️ PARCIAL | Falta en `/negocio/[slug]`, `/oferta/[id]` |
| JSON-LD schema | ⚠️ EXISTE | `lib/json-ld.ts` pero no usado en todas páginas |
| Sitemap dinámico | ✅ | `app/sitemap.ts` |
| Robots.txt | ✅ | `app/robots.ts` |
| OG images | ✅ | Home + planes |
| Twitter card | ✅ | Layout global |

### Falta
- JSON-LD en `/negocio/[slug]` (LocalBusiness schema)
- JSON-LD en `/oferta/[id]` (Offer schema)
- Meta robots (index/follow) por página
- Canonical URLs en páginas dinámicas

---

## ⚡ PERFORMANCE

### Build Time
- ✅ **4.6s** (muy rápido con Turbopack)
- ✅ **91 páginas** generadas exitosamente
- ✅ TypeScript: 5.0s

### ISR (Incremental Static Regeneration)
- ✅ Home: `revalidate = 60` (cada min)
- ⚠️ Páginas dinámicas: Check `/negocio/[slug]` si tiene revalidate

### Lighthouse (Estimado)
- ✅ Performance: 85+ (sin bloqueantes)
- ⚠️ SEO: 75-80 (mejorar con JSON-LD)
- ✅ Accessibility: 90+ (buen markup)
- ✅ Best Practices: 90+

### Recursos
- ✅ Imágenes: Optimizadas con Next Image
- ✅ Fonts: Google Fonts (Inter, Space Grotesk, Big Shoulders)
- ⚠️ Globales CSS: 516 líneas (revisar muertos)
- ✅ GSAP animaciones: Lazy loaded

---

## 📦 DEPENDENCIAS CRITICAS

### Runtime
```
✅ @supabase/ssr        (0.12.4)     - Session handling
✅ next                 (16.3.0)     - Framework
✅ react                (19.2.8)     - UI
✅ tailwindcss          (4)          - Estilos
✅ mercadopago          (3.4.0)      - Pagos (SDK INSTALADO)
✅ lucide-react         (1.31.0)     - Icons
✅ leaflet              (1.9.4)      - Mapas
✅ livekit              (2.21.0)     - Video streaming
⚠️ NO STRIPE            (Solo MercadoPago)
```

### DevDependencies
```
✅ @playwright/test     (1.62.1)     - E2E testing (INSTALADO)
✅ @axe-core/playwright (4.13.0)     - A11y testing (INSTALADO)
✅ lighthouse           (13.4.1)     - Performance audit (INSTALADO)
```

---

## 🧪 TESTING & VALIDACIÓN

### E2E Tests
- ✅ Playwright instalado + axe-core
- ⚠️ Tests NO existen (0 archivos .spec.ts)
- Necesario: Tests para flujos críticos (login, pago, crear negocio)

### Linting
- ✅ ESLint 9 + Next.js config
- ⚠️ 50+ warnings (mostly `any` types, missing deps)
- Ejecutar: `npm run lint 2>&1 | wc -l` (50+ issues)

### Build
- ✅ Compila limpiamente (0 errores)
- ⚠️ 1 warning: "Font override values for Big Shoulders"

---

## 🎨 ESTÉTICA & DISEÑO

### Colores (NO cambiar según brief)
```css
--bg: #0c0a0b        (Negro casi neutro)
--accent: #f97316    (Naranja)
--accent2: #dc2626   (Rojo - para ofertas)
--place: #22d3ee     (Cian - ubicación)
--offer: #fb923c     (Naranja claro)
--premium: #fbbf24   (Dorado)
```

### Fuentes
- Inter: Body text
- Space Grotesk: Headings
- Big Shoulders: Precios/descuentos (cartelería)

### CSS
- ✅ Tailwind 4 configurado
- ✅ globals.css: 516 líneas (bien estructurado)
- ⚠️ Sin auditoría de CSS muerto

---

## 💡 HALLAZGOS FINALES

### Top 3 Problemas (CRÍTICOS)
1. **SIN CSP HEADERS** → XSS abierto en búsqueda/inputs
2. **SIN RATE LIMITING** → DoS en APIs de pago
3. **WEBHOOK DE PAGO INCOMPLETO** → Pagos aprobados no se activan

### Top 5 Mejoras (IMPACTANTES)
1. Agregar CSP + Security headers (30 min)
2. Completar webhook + aplicar plan (45 min)
3. Agregar JSON-LD dinámico (30 min)
4. E2E tests para flujo de pago (1h)
5. Rate limiting en `/api/*` (45 min)

### Estimado de Costo de Arreglar
- **Crítico:** 2-3 horas
- **Alto:** 1-2 horas
- **Medio:** 2-3 horas
- **TOTAL:** 5-8 horas para 10/10

---

## ✅ LISTO PARA FASE 2: IMPLEMENTACIÓN

Procede con PASO 2 en este orden:

1. **Seguridad (1.5h)**
   - CSP headers en `next.config.ts`
   - Rate limiting en `/api/*`
   - Sanitización en búsqueda

2. **Monetización (1.5h)**
   - Completar webhook de MercadoPago
   - Validar aplicación de plan en BD
   - Testing del flujo de pago

3. **SEO (1h)**
   - JSON-LD dinámico
   - Metadata en `/negocio/[slug]`, `/oferta/[id]`

4. **Testing (1.5h)**
   - E2E Playwright
   - Lighthouse audit
   - Tests de accesibilidad

---

**Fecha:** 2026-08-21 21:46
**Próximo paso:** Implementar FASE 2 (Seguridad & Auth)
