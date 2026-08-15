// Arquitectura de monetización: límites y beneficios por plan.
// Los valores de "plan" en la base siguen siendo gratis/profesional/premium
// (no se renombran para no tocar RLS/lógica ya construida); lo que cambia
// acá son los límites y el nombre visible: profesional = "PRO Comerciante",
// premium = "Destacado Semanal" (posición fija, 7 días, máximo 5 negocios).
export const PLANES: Record<string, {
  name: string;
  maxOfertas: number; // -1 = ilimitadas
  ofertasNuevasPorDia: number;
  destacado: boolean;
  stats: boolean;
  historias: boolean;
  cuponesIlimitados: boolean;
  responderResenas: boolean;
  badge: string;
}> = {
  gratis: {
    name: "Gratis",
    maxOfertas: 3,
    ofertasNuevasPorDia: 1,
    destacado: false,
    stats: false,
    historias: false,
    cuponesIlimitados: false,
    responderResenas: false,
    badge: "",
  },
  profesional: {
    name: "PRO Comerciante",
    maxOfertas: -1,
    ofertasNuevasPorDia: 2,
    destacado: false,
    stats: true,
    historias: true,
    cuponesIlimitados: true,
    responderResenas: true,
    badge: "🚀 Pro",
  },
  premium: {
    name: "Destacado Semanal",
    maxOfertas: -1,
    ofertasNuevasPorDia: 2,
    destacado: true,
    stats: true,
    historias: true,
    cuponesIlimitados: true,
    responderResenas: true,
    badge: "🔥 Destacado",
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
