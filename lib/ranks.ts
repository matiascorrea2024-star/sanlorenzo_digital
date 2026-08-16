// ===== SISTEMA DE RANGOS COMERCIALES — SAN LORENZO DIGITAL =====
// Estética Wild Rift: metal, gemas, energía, profundidad 3D

export type Rango = {
  nombre: string;
  min: number;
  metal: string;      // gradiente CSS del marco metálico
  accent: string;     // color de acento (texto, borde)
  glow: string;       // halo de energía
  nivel: number;      // 0-7 (controla partículas y tamaño de gema)
};

export const RANGOS: Rango[] = [
  { nombre: "Nuevo",       min: 0,    nivel: 0, accent: "#9ca3af",
    metal: "linear-gradient(135deg,#1f2937 0%,#4b5563 30%,#111827 55%,#374151 80%,#1f2937 100%)",
    glow: "radial-gradient(circle,rgba(107,114,128,0.35) 0%,transparent 70%)" },
  { nombre: "Activo",      min: 100,  nivel: 1, accent: "#d97706",
    metal: "linear-gradient(135deg,#451a03 0%,#b45309 30%,#78350f 55%,#d97706 80%,#451a03 100%)",
    glow: "radial-gradient(circle,rgba(180,83,9,0.45) 0%,transparent 70%)" },
  { nombre: "Destacado",   min: 250,  nivel: 2, accent: "#93c5fd",
    metal: "linear-gradient(135deg,#334155 0%,#e2e8f0 30%,#64748b 55%,#bfdbfe 80%,#334155 100%)",
    glow: "radial-gradient(circle,rgba(96,165,250,0.45) 0%,transparent 70%)" },
  { nombre: "Oro",         min: 500,  nivel: 3, accent: "#fbbf24",
    metal: "linear-gradient(135deg,#713f12 0%,#fde047 30%,#a16207 55%,#fef08a 80%,#713f12 100%)",
    glow: "radial-gradient(circle,rgba(250,204,21,0.55) 0%,transparent 70%)" },
  { nombre: "Élite",       min: 900,  nivel: 4, accent: "#7dd3fc",
    metal: "linear-gradient(135deg,#0c4a6e 0%,#e0f2fe 30%,#0369a1 55%,#bae6fd 80%,#0c4a6e 100%)",
    glow: "radial-gradient(circle,rgba(56,189,248,0.55) 0%,transparent 70%)" },
  { nombre: "Maestro",     min: 1400, nivel: 5, accent: "#c4b5fd",
    metal: "linear-gradient(135deg,#4c1d95 0%,#ddd6fe 30%,#6d28d9 55%,#ede9fe 80%,#4c1d95 100%)",
    glow: "radial-gradient(circle,rgba(167,139,250,0.6) 0%,transparent 70%)" },
  { nombre: "Leyenda",     min: 2000, nivel: 6, accent: "#fca5a5",
    metal: "linear-gradient(135deg,#7f1d1d 0%,#fbbf24 30%,#991b1b 55%,#fecaca 80%,#7f1d1d 100%)",
    glow: "radial-gradient(circle,rgba(239,68,68,0.6) 0%,transparent 72%)" },
  { nombre: "Gran Barata", min: 3000, nivel: 7, accent: "#67e8f9",
    metal: "conic-gradient(from 0deg,#164e63,#a5f3fc,#0e7490,#f0fdff,#155e75,#a5f3fc,#164e63)",
    glow: "radial-gradient(circle,rgba(34,211,238,0.7) 0%,rgba(236,72,153,0.25) 45%,transparent 75%)" },
];

// Gema central según la categoría del comercio
export const GEMAS: Record<string, string> = {
  calzado: "#3b82f6", gastronomia: "#f97316", belleza: "#a855f7",
  profesionales: "#94a3b8", servicios: "#94a3b8", hogar: "#2dd4bf",
  salud: "#22c55e", automotor: "#2563eb", ferreteria: "#f59e0b",
  construccion: "#f59e0b", ropa: "#ec4899", mascotas: "#fb923c",
  deportes: "#84cc16", tecnologia: "#06b6d4", educacion: "#60a5fa",
  eventos: "#f472b6", transporte: "#eab308", industria: "#64748b",
  portuario: "#0ea5e9",
};

export function gemaDe(categoria?: string): string {
  return (categoria && GEMAS[categoria]) || "#e2e8f0";
}

// Los puntos de usuario (seguir, reseñar, contactar, compartir) se
// acumulan en un rango mucho más chico que los de negocio (destacado,
// ofertas, reseñas). Reusar la MISMA escalera de rangos para toda la
// plataforma (un solo lenguaje visual, no dos sistemas separados) pide
// escalar los puntos de usuario antes de ubicarlos en ella -- si no,
// casi nadie pasaría de "Activo". Mismo factor que usa DivisionFrame
// vía su prop `escala` para el marco de usuarios.
export const ESCALA_PUNTOS_USUARIO = 5;

export function rangoDeUsuario(puntos: number) {
  return rangoDe(puntos * ESCALA_PUNTOS_USUARIO);
}

export function rangoDe(puntos: number) {
  let actual = RANGOS[0];
  let proximo: Rango | null = null;
  for (let i = 0; i < RANGOS.length; i++) {
    if (puntos >= RANGOS[i].min) actual = RANGOS[i];
    else { proximo = RANGOS[i]; break; }
  }
  // Tier dentro del rango: III → II → I (como LoL)
  const base = actual.min;
  const tope = proximo ? proximo.min : actual.min + 1000;
  const prog = (puntos - base) / (tope - base);
  const tier = !proximo ? "" : prog < 0.34 ? "III" : prog < 0.67 ? "II" : "I";
  return {
    rango: actual.nombre,
    tier,
    // Nivel de liga (1-8, uno por cada escalón de RANGOS) -- no confundir con "puntos".
    nivel: actual.nivel + 1,
    metal: actual.metal,
    accent: actual.accent,
    glow: actual.glow,
    particulas: actual.nivel,
    proximo: proximo?.nombre || null,
    faltan: proximo ? Math.max(0, proximo.min - puntos) : 0,
    // % de progreso (0-100) hacia el próximo rango, para barras de progreso.
    progreso: proximo ? Math.min(100, Math.max(0, Math.round(prog * 100))) : 100,
  };
}
