// ============================================
// SISTEMA DE LIGAS Y PUNTOS PARA NEGOCIOS
// Curva progresiva: subir de división cuesta cada vez más
// ============================================

export type Division = {
  nombre: string;
  icon: string;
  min: number;
};

// Divisiones con subdivisiones III → II → I
export const DIVISIONES: Division[] = [
  { nombre: "Bronce III",   icon: "🥉", min: 0 },
  { nombre: "Bronce II",    icon: "🥉", min: 100 },
  { nombre: "Bronce I",     icon: "🥉", min: 250 },
  { nombre: "Plata III",    icon: "🥈", min: 500 },
  { nombre: "Plata II",     icon: "🥈", min: 800 },
  { nombre: "Plata I",      icon: "🥈", min: 1200 },
  { nombre: "Oro III",      icon: "🥇", min: 1700 },
  { nombre: "Oro II",       icon: "🥇", min: 2300 },
  { nombre: "Oro I",        icon: "🥇", min: 3000 },
  { nombre: "Platino",      icon: "💎", min: 4000 },
  { nombre: "Diamante",     icon: "💠", min: 5500 },
  { nombre: "Leyenda",      icon: "👑", min: 8000 },
];

// Pesos balanceados: ninguna métrica domina sola
export function puntosDe(
  seguidores: number,
  resenas: number,
  verificado: boolean,
  ofertas: number = 0,
  canjes: number = 0
): number {
  return (
    seguidores * 5 +
    resenas * 3 +
    ofertas * 20 +
    canjes * 25 +
    (verificado ? 100 : 0)
  );
}

export function nivelDe(puntos: number): Division {
  let nivel = DIVISIONES[0];
  for (const d of DIVISIONES) {
    if (puntos >= d.min) nivel = d;
  }
  return nivel;
}

export function proximoNivel(puntos: number): Division | null {
  for (const d of DIVISIONES) {
    if (puntos < d.min) return d;
  }
  return null; // ya es Leyenda
}

// % de progreso hacia la siguiente división (0-100)
export function progresoDe(puntos: number): number {
  const actual = nivelDe(puntos);
  const prox = proximoNivel(puntos);
  if (!prox) return 100;
  const rango = prox.min - actual.min;
  const avance = puntos - actual.min;
  return Math.min(100, Math.round((avance / rango) * 100));
}


// ===== MARCOS DE DIVISIÓN (estilo League of Legends) =====
// Devuelve clases de borde + glow según los puntos del negocio
export function marcoDe(puntos: number): { ring: string; glow: string; texto: string } {
  const nivel = nivelDe(puntos).nombre.toLowerCase();
  if (nivel.includes("diamante")) return { ring: "ring-4 ring-blue-400",   glow: "shadow-[0_0_24px_rgba(59,130,246,0.6)]",  texto: "text-blue-300" };
  if (nivel.includes("platino"))   return { ring: "ring-4 ring-teal-300",   glow: "shadow-[0_0_24px_rgba(45,212,191,0.6)]",  texto: "text-teal-200" };
  if (nivel.includes("oro"))       return { ring: "ring-4 ring-yellow-400", glow: "shadow-[0_0_24px_rgba(250,204,21,0.55)]", texto: "text-yellow-300" };
  if (nivel.includes("plata"))     return { ring: "ring-4 ring-gray-300",   glow: "shadow-[0_0_20px_rgba(209,213,219,0.5)]", texto: "text-gray-200" };
  // Bronce (default)
  return { ring: "ring-4 ring-amber-700", glow: "shadow-[0_0_18px_rgba(180,83,9,0.5)]", texto: "text-amber-600" };
}
