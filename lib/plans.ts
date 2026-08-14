// Arquitectura de monetización: límites y beneficios por plan
export const PLANES: Record<string, {
  name: string;
  maxOfertas: number; // -1 = ilimitadas
  destacado: boolean;
  stats: boolean;
  historias: boolean;
  badge: string;
}> = {
  gratis: {
    name: "Gratis",
    maxOfertas: 1,
    destacado: false,
    stats: false,
    historias: false,
    badge: "",
  },
  profesional: {
    name: "Profesional",
    maxOfertas: -1,
    destacado: false,
    stats: true,
    historias: true,
    badge: "🚀 Pro",
  },
  premium: {
    name: "Premium",
    maxOfertas: -1,
    destacado: true,
    stats: true,
    historias: true,
    badge: "⭐ Premium",
  },
};

export function planDe(business: any) {
  return PLANES[business?.plan] || PLANES.gratis;
}

// ¿Puede este negocio publicar una oferta más?
export function puedePublicarOferta(plan: string, ofertasActivas: number): boolean {
  const p = PLANES[plan] || PLANES.gratis;
  if (p.maxOfertas === -1) return true;
  return ofertasActivas < p.maxOfertas;
}
