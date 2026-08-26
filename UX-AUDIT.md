# UX Sprint · Auditoría de experiencia (etapa 1)

Fecha: 2026-08-26 · Método: revisión heurística con capturas reales (mobile 390px + desktop 1440px)
Páginas auditadas: home, /promociones, ficha de negocio, /oferta/[id], /para-vos, /mapa, /planes, /buscar?q=
Capturas: `/tmp/opencode/screens/` (regenerables con el script del sprint)

Hallazgos ordenados por severidad. "Crítico" = interfiere con la tarea principal del usuario.

---

## CRÍTICOS

### C1 · El banner de cookies tapa la acción principal en toda la app
**Evidencia:** oferta-m, negocio-m, buscar-m, mapa-m.
En mobile el dialog flota sobre el contenido (`bottom-20`) y en primera visita cubre:
- el botón **Consultar por WhatsApp** en la ficha (la acción que genera negocio)
- los **resultados** en /buscar
- el **mapa** en /mapa

El consentimiento es necesario, pero no puede ganarle a la tarea. Además se muestra
en cada captura porque recién desaparece tras elegir — el usuario nuevo ve SIEMPRE
el contenido tapado.

**Dirección:** en mobile, banner compacto abajo (no dialog centrado sobre contenido),
o sheet con altura mínima que no tape el CTA; en la ficha, que no pise nunca la fila
de WhatsApp. Alternativa: diferir el banner hasta el 2do page-view.

### C2 · /buscar con resultados existentes no los muestra arriba
**Evidencia:** buscar-m con `?q=cafe`: hay un negocio "Cafe la esquina" con oferta
activa, y la pantalla muestra hero de marketing + tarjetas informativas ("OFERTAS
REALES", "FILTROS AVANZADOS") antes que cualquier resultado; el área de resultados
queda bajo el fold y parcialmente tapada por el consent.

**Dirección:** en una búsqueda con query, resultados primero (sin hero, o hero de
1 línea). Las tarjetas educativas van solo en el estado vacío (sin query).

### C3 · Ficha de negocio: el CTA real (WhatsApp) queda debajo de bloques que no convierten
**Evidencia:** negocio-m. Orden actual: hero → card rosa "No te pierdas nada" +
"Avisame si vuelve" → WhatsApp → Mapa/Compartir/Modo TV → ofertas → tabs.
Problemas combinados:
- **"Avisame si vuelve" para un negocio ACTIVO con oferta vigente** — contradicción
  semántica (¿volver de dónde?). El notify-me debería aparecer solo cuando cierra.
- La card de notificación empuja el WhatsApp debajo del fold en 390px.
- Mapa/Compartir/Modo TV tienen el mismo peso visual que las acciones de compra.

**Dirección:** jerarquía: WhatsApp primero y visible sin scroll; notificación solo
en contexto correcto (cerrado / sin ofertas activas); mapa/compartir como acciones
secundarias; Modo TV a un menú.

### C4 · Panel "Subir de nivel" del comerciante visible para visitantes anónimos
**Evidencia:** negocio-m, al final de la ficha pública: "Te faltan 43 pts para llegar
a Activo · Publicar una oferta activa +20...".
Es instrucción interna del dueño del negocio mostrada a cualquier vecino. El visitante
no entiende qué es, y devalúa la ficha (se ve "en construcción").

**Dirección:** ese panel pertenece al dashboard. En la ficha pública, si se quiere
mostrar nivel, es solo el badge (ya existe "NV 1 · NUEVO II").

---

## ALTOS

### A1 · Bottom-nav con 7 items
**Evidencia:** todas las capturas mobile: Inicio, Buscar, Ofertas, Muro, Ranking,
Mapa, Perfil.
Recomendación estándar: ≤5. Con 7, los targets se achican y "Muro"/"Ranking" (comunidad
avanzada) compiten con las acciones nucleares (buscar ofertas, mapa).

**Dirección:** 5 items: Inicio, Buscar, Ofertas, Mapa, Perfil. Muro/Ranking/Reels
viven en Inicio y en el header. A validar en testing (quizás la comunidad pesa más
de lo que asumimos — para eso está el test).

### A2 · CTA de WhatsApp duplicado en /oferta
**Evidencia:** oferta-m: "Consultar por WhatsApp" aparece dos veces (bloque inline +
barra fija) en la misma pantalla.

**Dirección:** uno solo. La barra fija es la candidata correcta (siempre visible);
el inline se reemplaza por la info del negocio.

### A3 · /mapa: el mapa es secundario en la página del mapa
**Evidencia:** mapa-m: chips de radio bien, pero el mapa queda bajo el fold con altura
corta, y encima tres contadores en 0 ("NEGOCIOS 0 / ABIERTOS 0 / CON OFERTAS 0") que
hacen sentir la plaza muerta.

**Dirección:** mapa alto (60-70vh) arriba; contadores como línea compacta sobre el
mapa, no como tarjetas; empty state con CTA ("Cargá tu negocio" / "Probá otro radio").

### A4 · Gamificación sin contexto en cards públicas
**Evidencia:** promociones-m, para-vos-m: "NV 1 · NUEVO II" en la card de oferta.
Para un vecino nuevo es ruido sin significado.

**Dirección:** mostrar nivel solo cuando aporta señal (NV 3+) o reemplazar por
"Verificado" que sí se entiende.

---

## MEDIOS

### M1 · Heroes de marketing en páginas funcionales
/promociones y /buscar gastan 35-45% del primer viewport en branding. El usuario que
llega ya está convencido; quiere contenido.

### M2 · "Reportar negocio" con peso visual alto en la ficha
Acción negativa/nicho con botón destacado en el flujo de información. Va a menú
("⋯") o al footer de la ficha.

### M3 · "Modo TV" como botón grande en ficha pública
Feature excelente pero de nicho (comercio con local + pantalla). Hoy compite con
Mapa/Compartir. Va a menú de acciones secundarias.

### M4 · Home: densidad alta sin respirar
La home acumula 10+ secciones (hero, categorías, colecciones, ofertas bomba,
destacados, muro de fama, planes, ranking...). Sin testing previo, la hipótesis es
que el vecino nuevo se pierde; se valida en las sesiones.

---

## Hallazgo técnico del sprint (resuelto)

**Next 16 + `allowedDevOrigins`:** entrar por `127.0.0.1` (o IP de LAN, p.ej. probando
desde el celular) dejaba toda la app en spinner eterno: el dev server bloquea con 403
los chunks `/_next/static` cuando el `Origin` no está en la allowlist (`localhost` por
defecto). Fix en `next.config.ts` (`allowedDevOrigins: ["127.0.0.1", "localhost", "*.local"]`).
Sin este fix, el testing con usuarios reales desde sus celulares habría fallado.

---

## Qué NO se toca (fortalezas a preservar)

- Lenguaje visual V3 (neobrutalismo magenta): identidad fuerte y diferenciada.
- Copy en argentino ("Buscá", "Sumá al changuito", "Corré que se termina"): cercano,
  es parte del carácter del producto.
- Ficha: badges VERIFICADO / ABIERTO AHORA claros; precio con ahorro destacado.
- Ofertas bomba con countdown; colecciones con honestidad (solo con negocios reales).
- Modo TV: concepto diferenciador real para comercios con local.
