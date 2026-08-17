// Arquitectura de monetización: límites y beneficios por plan.
// Los valores de "plan" en la base siguen siendo gratis/profesional/premium
// (no se renombran para no tocar RLS/lógica ya construida); lo que cambia
// acá son los límites y el nombre visible: profesional = "PRO Comerciante",
// premium = "Destacado Semanal" (posición fija, 7 días, máximo 5 negocios).
export const PLANES: Record<string, {
  name: string;
  maxOfertas: number; // -1 = ilimitadas
  ofertasNuevasPorDia: number;
  maxProductos: number; // -1 = ilimitados
  destacado: boolean;
  stats: boolean; // estadísticas básicas (solo visitas totales)
  statsAvanzadas: boolean; // detalle día a día + comparación con la categoría
  historias: boolean;
  cupones: boolean; // crear cupones exclusivos con código
  responderResenas: boolean;
  destacarCatalogo: boolean; // marcar productos/ofertas propias como destacados
  campanas: boolean; // campañas segmentadas por barrio con estimación de alcance
  whatsappDestacado: boolean; // botón de WhatsApp más grande/prioritario en la ficha
  maxVivosPorMes: number; // -1 = ilimitados
  vivoProductos: boolean; // asociar productos/ofertas a la transmisión
  vivoDestacado: boolean; // aparece primero en /en-vivo + notifica seguidores al arrancar
  badge: string;
  precioARS: number; // 0 = sin costo. Mismos montos que muestra app/dashboard/planes/page.tsx.
  duracionDias: number; // vigencia que otorga un pago aprobado de este plan
}> = {
  gratis: {
    name: "Gratis",
    maxOfertas: 3,
    ofertasNuevasPorDia: 1,
    maxProductos: 5,
    destacado: false,
    stats: false,
    statsAvanzadas: false,
    historias: false,
    cupones: false,
    responderResenas: false,
    destacarCatalogo: false,
    campanas: false,
    whatsappDestacado: false,
    maxVivosPorMes: 2,
    vivoProductos: false,
    vivoDestacado: false,
    badge: "",
    precioARS: 0,
    duracionDias: 0,
  },
  // Escalón intermedio: más barato que PRO, para el que todavía no se
  // anima a $9.900 pero ya quiere más de lo que da Gratis.
  plus: {
    name: "Comerciante Plus",
    maxOfertas: 8,
    ofertasNuevasPorDia: 2,
    maxProductos: 30,
    destacado: false,
    stats: true,
    statsAvanzadas: false,
    historias: false,
    cupones: false,
    responderResenas: true,
    destacarCatalogo: false,
    campanas: false,
    whatsappDestacado: true,
    maxVivosPorMes: 8,
    vivoProductos: false,
    vivoDestacado: false,
    badge: "⭐ Plus",
    precioARS: 4900,
    duracionDias: 30,
  },
  profesional: {
    name: "PRO Comerciante",
    maxOfertas: -1,
    ofertasNuevasPorDia: 2,
    maxProductos: -1,
    destacado: false,
    stats: true,
    statsAvanzadas: true,
    historias: true,
    cupones: true,
    responderResenas: true,
    destacarCatalogo: true,
    campanas: true,
    whatsappDestacado: true,
    maxVivosPorMes: -1,
    vivoProductos: true,
    vivoDestacado: false,
    badge: "🚀 Pro",
    precioARS: 9900,
    duracionDias: 30,
  },
  premium: {
    name: "Destacado Semanal",
    maxOfertas: -1,
    ofertasNuevasPorDia: 2,
    maxProductos: -1,
    destacado: true,
    stats: true,
    statsAvanzadas: true,
    historias: true,
    cupones: true,
    responderResenas: true,
    destacarCatalogo: true,
    campanas: true,
    whatsappDestacado: true,
    maxVivosPorMes: -1,
    vivoProductos: true,
    vivoDestacado: true,
    badge: "🔥 Destacado",
    precioARS: 19900,
    duracionDias: 7,
  },
};

// Duración de las ofertas: mínimo el mismo día (para que "vence hoy" del
// Radar siga siendo válido), máximo 30 días -- fuerza a renovar en vez de
// dejar una oferta vieja publicada para siempre.
export const OFERTA_DURACION_MAX_DIAS = 30;
export const MAX_DESTACADOS_SEMANALES = 5;

export function planDe(business: any) {
  return PLANES[business?.plan] || PLANES.gratis;
}

// ¿Puede este negocio publicar una oferta más? (tope de activas simultáneas)
export function puedePublicarOferta(plan: string, ofertasActivas: number): boolean {
  const p = PLANES[plan] || PLANES.gratis;
  if (p.maxOfertas === -1) return true;
  return ofertasActivas < p.maxOfertas;
}

// ¿Puede publicar OTRA oferta hoy? (tope diario, anti-spam)
export function puedePublicarHoy(plan: string, ofertasCreadasHoy: number): boolean {
  const p = PLANES[plan] || PLANES.gratis;
  return ofertasCreadasHoy < p.ofertasNuevasPorDia;
}

// ¿Puede este negocio cargar un producto más al catálogo?
export function puedeAgregarProducto(plan: string, productosActivos: number): boolean {
  const p = PLANES[plan] || PLANES.gratis;
  if (p.maxProductos === -1) return true;
  return productosActivos < p.maxProductos;
}

// ¿Puede crear otro En Vivo este mes?
export function puedeCrearVivo(plan: string, vivosEsteMes: number): boolean {
  const p = PLANES[plan] || PLANES.gratis;
  if (p.maxVivosPorMes === -1) return true;
  return vivosEsteMes < p.maxVivosPorMes;
}
