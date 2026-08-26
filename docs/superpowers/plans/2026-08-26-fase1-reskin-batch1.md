# Fase 1 — Reskin Batch 1 (tema claro/oscuro + densidad) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arreglar los contrastes rotos en tema claro y bajar la escala/densidad tipográfica del home y el header a un nivel "Amazon" (información densa, nada gigante), como primer lote visible del reskin de Fase 1.

**Architecture:** Cambios acotados a `app/globals.css` (tokens de tamaño), `components/home/hero.tsx`, `components/home-client.tsx` y los archivos que la auditoría de tema confirme rotos. No se toca lógica de datos ni rutas. Verificación visual real en el dev server (`localhost:3000`, ya corriendo) además del ritual de HANDOFF.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 (tokens CSS en `:root` / `:root[data-theme="light"]`), Playwright para capturas.

**Spec:** `docs/superpowers/specs/2026-08-26-sld-rediseno-elite-design.md` (§4 Fase 1)

## Global Constraints

- Cero datos inventados; no tocar lógica de negocio ni queries a Supabase.
- No usar `sed` para editar JSX/TSX — usar herramientas de edición reales.
- No correr `npm run build` mientras el dev server esté arriba (ya está corriendo en :3000 desde antes de este plan — no reiniciarlo salvo que se rompa).
- Paleta y tokens ya definidos en `app/globals.css:15-139` (`--bg`, `--text`, `--muted`, `--muted2`, `--accent`, `--ov-*`) son la única fuente de verdad de color — nada de hex sueltos nuevos.
- Mantener magenta `#d12f68` / `var(--accent)`, Big Shoulders (`font-display`), Space Grotesk (`font-tech`) — este batch ajusta *tamaño y contraste*, no cambia la identidad visual.
- Cada texto en una sección cuyo fondo usa un token de tema (`var(--bg)`, `var(--surface)`, sin bg o con bg heredado) debe usar `var(--text)`/`var(--muted)`/`var(--muted2)` en vez de `text-white`/`text-white/NN` hardcodeado. Texto sobre superficies con color fijo (botones `bg-[var(--accent)]`, bandas con hex hardcodeado tipo `bg-[#121011]` o `#0c0a0b`) puede seguir en blanco — ahí sí es válido porque el fondo no cambia con el tema.
- Verificación por task: `npx tsc --noEmit` limpio + `npx eslint <archivos tocados>` 0 errores. Al final del batch: build completo con el dev server apagado.

---

### Task 1: Script de auditoría visual claro/oscuro

**Files:**
- Create: `scripts/theme-audit.mjs`
- Create dir (output): `test-results/theme-audit/` (ya existe `test-results/`, gitignored)

**Interfaces:**
- Produces: capturas PNG por ruta y tema en `test-results/theme-audit/<ruta-sanitizada>--dark.png` y `--light.png`, para revisión manual en la Task 2 y como evidencia para las tasks de fix.

- [ ] **Step 1: Escribir el script**

```js
// scripts/theme-audit.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:3000';
const OUT = 'test-results/theme-audit';
mkdirSync(OUT, { recursive: true });

// Home + páginas marcadas como sospechosas de romper en tema claro
// (HANDOFF.md §7: feed, reels, ranking; más las que confirmamos rotas
// en este batch: home, radar, promociones, vecinos).
const ROUTES = [
  '/', '/feed', '/reels', '/ranking', '/radar', '/promociones', '/vecinos',
  '/buscar', '/negocios',
];

const b = await chromium.launch();
for (const route of ROUTES) {
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  const slug = route === '/' ? 'home' : route.replaceAll('/', '_');

  // Dark (default del sitio)
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${slug}--dark.png`, fullPage: true });

  // Light
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${slug}--light.png`, fullPage: true });

  await page.close();
  console.log(`✓ ${route}`);
}
await b.close();
console.log(`\nCapturas en ${OUT}/`);
```

- [ ] **Step 2: Correrlo contra el dev server ya activo**

Run: `node scripts/theme-audit.mjs`
Expected: imprime `✓ <ruta>` por cada una de las 9 rutas y termina con "Capturas en test-results/theme-audit/" — 18 PNGs generados (9 rutas × 2 temas).

- [ ] **Step 3: Revisar las capturas**

Abrir cada par `--dark.png` / `--light.png` (usar el visor de imágenes / Read tool) y anotar en el propio plan (comentario, no hace falta commitear la nota) qué bloques de texto quedan ilegibles o de bajísimo contraste en `--light.png` comparado con `--dark.png`. Esta lista concreta alimenta las Tasks 4-5.

- [ ] **Step 4: Commit**

```bash
git add scripts/theme-audit.mjs
git commit -m "chore: script de auditoría visual de tema claro/oscuro"
```

---

### Task 2: Escala tipográfica del Hero — bajar tamaño máximo

**Files:**
- Modify: `components/home/hero.tsx:70,110`

**Interfaces:**
- No cambia props ni consumidores de `Hero` — solo clases Tailwind.

**Contexto:** El título usa `text-[clamp(4rem,11vw,9.5rem)]` (hasta 152px) y los números de stats `text-6xl md:text-7xl` (hasta 72px) — en desktop grande domina toda la pantalla ("todo tan grande" que reportó el dueño). Se baja el techo del clamp y el tamaño de stats sin perder el golpe visual del hero.

- [ ] **Step 1: Ajustar el título**

En `components/home/hero.tsx:70`, cambiar:

```tsx
<h1 className="font-display text-[clamp(4rem,11vw,9.5rem)] leading-[0.85] tracking-tight">
```

por:

```tsx
<h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.85] tracking-tight">
```

- [ ] **Step 2: Ajustar los números de stats**

En `components/home/hero.tsx:110`, cambiar:

```tsx
<span className="magenta-glow block font-display text-6xl leading-none tabular-nums text-white md:text-7xl">{s.value}</span>
```

por (también corrige el bug de tema claro, ver Task 3):

```tsx
<span className="magenta-glow block font-display text-4xl leading-none tabular-nums text-[var(--text)] md:text-5xl">{s.value}</span>
```

- [ ] **Step 3: Verificar visualmente**

Con el dev server activo, abrir `http://localhost:3000/` en el navegador (o Playwright) a 1440px y a 390px. El título debe verse prominente pero sin salirse de proporción ni forzar scroll horizontal.

- [ ] **Step 4: Typecheck y lint**

Run: `npx tsc --noEmit && npx eslint components/home/hero.tsx`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add components/home/hero.tsx
git commit -m "style: bajar escala tipográfica del hero (menos gigante en desktop)"
```

---

### Task 3: Fix contraste en tema claro — Hero

**Files:**
- Modify: `components/home/hero.tsx:110,118,130`

**Interfaces:** ninguna (solo clases).

**Contexto:** La sección usa `bg-[var(--bg)]` (cambia con el tema) pero varios textos están hardcodeados en blanco — en tema claro `--bg` pasa a `#faf7f2` (crema) y ese texto blanco pierde casi todo el contraste.

- [ ] **Step 1: Stats (ya tocado en Task 2 step 2 — confirmar que quedó `text-[var(--text)]`, no `text-white`)**

- [ ] **Step 2: Caja "Sin vueltas, sin intermediarios"**

En `components/home/hero.tsx:118`, cambiar:

```tsx
<span className="font-black text-white">Sin vueltas, sin intermediarios.</span><br />
```

por:

```tsx
<span className="font-black text-[var(--text)]">Sin vueltas, sin intermediarios.</span><br />
```

- [ ] **Step 3: Barra de confianza (trust bar)**

En `components/home/hero.tsx:130`, cambiar:

```tsx
<div key={label} className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: "var(--font-display)" }}>
```

por:

```tsx
<div key={label} className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
```

- [ ] **Step 4: Verificar en el navegador**

Abrir `http://localhost:3000/`, togglear el botón de tema (ícono en el header) y confirmar que "Sin vueltas...", los números de stats y la barra de confianza se leen bien en tema claro. Comparar contra `test-results/theme-audit/home--light.png` de la Task 1 si hace falta.

- [ ] **Step 5: Typecheck y lint**

Run: `npx tsc --noEmit && npx eslint components/home/hero.tsx`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add components/home/hero.tsx
git commit -m "fix: contraste de texto del hero roto en tema claro"
```

---

### Task 4: Fix contraste en tema claro — Home (sección "Sumate")

**Files:**
- Modify: `components/home-client.tsx:145,289,300`

**Interfaces:** ninguna (solo clases).

**Contexto:** mismo patrón que el Hero — la sección "Rubros" (línea ~139) y la sección "Sumate" (línea ~278) no fijan un fondo hardcodeado (heredan `var(--bg)` del body), pero tienen `text-white`/`text-white/60` hardcodeado.

- [ ] **Step 1: Link "Ver directorio" (sección Rubros)**

En `components/home-client.tsx:145`, cambiar:

```tsx
<Link href="/negocios" className="hidden items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 transition hover:text-[var(--accent)] sm:inline-flex" style={{ fontFamily: "var(--font-display)" }}>
```

por:

```tsx
<Link href="/negocios" className="hidden items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)] sm:inline-flex" style={{ fontFamily: "var(--font-display)" }}>
```

- [ ] **Step 2: Botón "Publicar negocio" (sección Sumate)**

En `components/home-client.tsx:289`, cambiar:

```tsx
<Link href="/para-negocios" className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}><Store className="h-4 w-4" /> Publicar negocio</Link>
```

por:

```tsx
<Link href="/para-negocios" className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}><Store className="h-4 w-4" /> Publicar negocio</Link>
```

- [ ] **Step 3: Números "Datos de esta página"**

En `components/home-client.tsx:300`, cambiar:

```tsx
<strong className="magenta-glow block font-display text-6xl leading-none tabular-nums text-white md:text-7xl">{s.v}</strong>
```

por (también aplica la reducción de escala del batch, consistente con Task 2):

```tsx
<strong className="magenta-glow block font-display text-4xl leading-none tabular-nums text-[var(--text)] md:text-5xl">{s.v}</strong>
```

- [ ] **Step 4: Verificar en el navegador**

`http://localhost:3000/`, togglear a tema claro, revisar las secciones "Explorá por rubro" y "La guía local se construye entre todos". Confirmar que el botón "Publicar negocio" y el link "Ver directorio" tienen buen contraste sobre fondo crema.

- [ ] **Step 5: Typecheck y lint**

Run: `npx tsc --noEmit && npx eslint components/home-client.tsx`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add components/home-client.tsx
git commit -m "fix: contraste roto en tema claro + densidad de stats en home"
```

---

### Task 5: Fixes de tema claro en el resto de las páginas auditadas

**Files:** los que la Task 1 haya señalado como rotos entre `/feed`, `/reels`, `/ranking`, `/radar`, `/promociones`, `/vecinos`, `/buscar`, `/negocios` (sus archivos fuente están en `app/<ruta>/page.tsx` o `app/<ruta>/client.tsx`).

**Interfaces:** ninguna (solo clases).

**Método** (mismo patrón que Tasks 3-4, aplicado caso por caso — NO reemplazo masivo):

1. Para cada texto marcado como ilegible en la revisión de la Task 1 (`--light.png` vs `--dark.png`), abrir el archivo fuente y ubicar la clase.
2. Antes de tocarlo, confirmar que el contenedor padre **no** tiene un fondo con hex/rgba hardcodeado fijo (ej. `bg-[#0c0a0b]`, `bg-black/60`, `bg-gradient-to-br from-red-900/30 via-[#0c0a0b] ...`) — si lo tiene, el texto blanco es intencional y NO se toca (ejemplo real ya verificado: el hero de `/radar`, `app/radar/client.tsx:33-105`, tiene fondo hardcodeado siempre oscuro — dejar como está).
3. Si el fondo sí es un token de tema (`var(--bg)`, `var(--surface)`, o sin bg propio — hereda del body), reemplazar `text-white` → `text-[var(--text)]`, `text-white/60` → `text-[var(--muted)]`, `text-white/40` → `text-[var(--muted2)]` (elegir el token más cercano a la opacidad original).
4. No tocar texto blanco que esté sobre `bg-[var(--accent)]` u otro botón de color de marca fijo — ahí es correcto en ambos temas.

- [ ] **Step 1: Aplicar el método a cada archivo señalado por la auditoría** (lista concreta sale de la Task 1 — típicamente candidatos en `app/feed/page.tsx`, `app/ranking/client.tsx`, `app/vecinos/client.tsx`, `app/promociones/page.tsx` según patrones ya vistos en el grep de este plan).

- [ ] **Step 2: Re-correr el audit y confirmar**

Run: `node scripts/theme-audit.mjs`
Expected: nuevas capturas `--light.png` muestran el texto corregido con buen contraste.

- [ ] **Step 3: Typecheck y lint sobre los archivos tocados**

Run: `npx tsc --noEmit && npx eslint <archivos tocados>`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add <archivos tocados>
git commit -m "fix: contraste de tema claro en páginas secundarias (feed/ranking/vecinos/promociones)"
```

---

### Task 6: Verificación final del batch

**Files:** ninguno nuevo — solo comandos.

- [ ] **Step 1: Apagar el dev server temporalmente para buildear limpio**

Run: `fuser -k 3000/tcp` (o identificar el PID con `lsof -i:3000` y matarlo)

- [ ] **Step 2: Build completo**

Run: `npm run build`
Expected: build OK, sin errores.

- [ ] **Step 3: Typecheck y lint globales**

Run: `npx tsc --noEmit && npx eslint .`
Expected: `tsc` limpio, `eslint` 0 errores (warnings preexistentes OK, no sumar nuevos).

- [ ] **Step 4: Levantar el dev server de nuevo para que el dueño siga viendo en vivo**

Run: `npm run dev &` (o el comando que use el proyecto — confirmar puerto 3000)
Expected: `http://localhost:3000` responde 200 de nuevo.

- [ ] **Step 5: Playwright de flujos core**

Run: `npx playwright test`
Expected: 8 pasan / 1 salteado (igual que la línea base de HANDOFF.md).

- [ ] **Step 6: Commit final si quedó algo suelto**

```bash
git status
# si hay cambios sin commitear (poco probable a esta altura), commitearlos
```

---

## Backlog — Batch 2 (no en este plan, se planifica después)

Quedan pendientes del reskin de Fase 1 (spec §4, tabla de páginas): `negocio/[slug]`, `oferta/[id]`, `buscar`, `perfil`, `dashboard` (home + nav), `onboarding`/creación de oferta, panel de notificaciones, `ranking` (contenido más allá del contraste). Se arma un plan nuevo cuando este batch esté mergeado y verificado, para no perder el hilo de review entre tandas grandes.
