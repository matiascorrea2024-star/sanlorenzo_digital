# UX Sprint · Protocolo de testing con usuarios (etapa 2)

Objetivo: ver cómo navegan personas reales de San Lorenzo, qué los frustra y qué
rescatan, para iterar los prototipos con evidencia y no con gustos propios.

## Participantes (4 sesiones de ~30 min)

| # | Perfil | Dónde | Qué buscamos |
|---|--------|-------|--------------|
| V1 | Vecino 25-45, compra en el centro, poco técnico | su celular | descubrimiento de ofertas, confianza |
| V2 | Vecino 45+, usa WhatsApp todos los días, web poca | su celular | claridad del flujo hasta el WhatsApp |
| C1 | Comerciante con local físico (rubro comida) | su celular en el local | crear/editar oferta sin ayuda |
| C2 | Comerciante sin local web propio (rubro rubro libre) | nuestro celular prestado o el suyo | onboarding y valor percibido |

Regla: **el usuario usa SU celular** (el 90% será mobile). Nunca guiar con el dedo;
recién ayudar si pide o tras 60s de bloqueo real.

## Setup técnico

1. Deploy de preview (Vercel) o `next dev -H 0.0.0.0` + IP de LAN.
   - El fix de `allowedDevOrigins` ya cubre el acceso por IP (ver UX-AUDIT.md).
2. Datos de prueba decentes ANTES de la sesión: 8-10 negocios con foto real,
   10-12 ofertas vigentes con precios creíbles. Con la plaza vacía el test mide
   la plaza vacía, no el producto.
3. Grabar pantalla (con permiso) + tomar notas en la plantilla de abajo.
4. Consentimiento verbal: "es una prueba de la web, no tuya; todo lo que falles
   nos ayuda".

## Guion vecino (V1, V2) — think-aloud

Intro: "Queremos que busques una oferta como lo harías un sábado. Pensá en voz alta."

| # | Tarea | Qué observamos | Fracaso esperado (hipótesis del audit) |
|---|-------|----------------|----------------------------------------|
| 1 | "Buscá algo para comer cerca de acá" | ruta de navegación, uso de buscar vs mapa vs categorías | C2: buscar no muestra resultados; A3: mapa con stats 0 |
| 2 | "Entrá a la oferta y averiguá el precio por WhatsApp" | tiempo hasta el CTA, doble CTA, banner cookies | C1: cookie tapa WhatsApp; A2: CTA duplicado |
| 3 | "Guardá este negocio en favoritos" | descubrimiento del corazón, feedback de éxito | — |
| 4 | "Fijate qué más podés hacer acá" (exploración libre 2 min) | qué descubre solo (reels, ranking, recorrido) | M4: sobrecarga de home; A1: 7 tabs |
| 5 | "¿Qué te pareció? ¿Volverías? ¿Qué te faltó?" | verbatim, SUS de 5 preguntas | — |

Preguntas post (responder 1-5 + comentario):
- Encontrar ofertas me resultó fácil.
- Confío en que los precios son reales.
- Entiendo quién está detrás de la web (¿de San Lorenzo? ¿oficial?).
- La volvería a usar para comparar precios.
- Recomendaría la web a un conocido comercianta/vecino.

## Guion comerciante (C1, C2)

Intro: "Probemos tu negocio tal como lo manejarías una mañana cualquiera."

| # | Tarea | Qué observamos |
|---|-------|----------------|
| 1 | Crear cuenta + ficha (si C2) o entrar a su ficha (si C1) | onboarding, claridad del plan gratis |
| 2 | "Publicá una oferta: 2x1 en X, vence el viernes" | tiempo, errores de formulario, fotos desde el celular |
| 3 | "Mirá tus estadísticas y decime cómo te fue esta semana" | comprensión de métricas (¿entiende "vistas" vs "intereses"?) |
| 4 | "Un cliente te escribió por WhatsApp, respondé" (role-play) | integración WhatsApp |
| 5 | Mostrar panel "Centro de crecimiento" y "Calendario comercial" | valor percibido, ¿lo usaría? |

Preguntas post:
- Entendí qué me da la web sin que me lo expliquen.
- Publicar una oferta me resultó fácil.
- Pagaría el plan Plus ($X) por esto. ¿Qué tendría que tener para pagarlo?
- ¿Qué le cambiarías?

## Registro por sesión (plantilla)

```
Sesión: V1/V2/C1/C2 · Fecha: · Dispositivo: · Duración:
Tarea 1: OK / AYUDA / FRACASO · tiempo: · notas:
Tarea 2: ...
Momentos "wow": (frases textuales)
Momentos de fricción: (tarea, qué pasó, qué dijo)
Verbatim destacables (3 máx):
SUS: _/_/_/_/_
```

## Después de las 4 sesiones

1. Agrupar fricciones por frecuencia × severidad (afinidad, no votación).
2. Contrastar contra UX-AUDIT.md: confirmar / refutar / descubrir nuevos.
3. Recién ahí: prototipos de la iteración (etapa 3), priorizando lo que el test
   demostró, no lo que asumimos.
4. Criterio de éxito del sprint: las 4 personas completan las tareas nucleares
   (vecino: oferta→WhatsApp; comerciante: publicar oferta) sin ayuda.
