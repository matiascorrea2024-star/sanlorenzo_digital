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
  { nombre: "Activo",      min: 100,  nivel: 1, accent: "#f7a1bd",
    metal: "linear-gradient(135deg,#28131b 0%,#f7a1bd 30%,#6f243e 55%,#ffd3df 80%,#28131b 100%)",
    glow: "radial-gradient(circle,rgba(247,161,189,0.4) 0%,transparent 70%)" },
  { nombre: "Destacado",   min: 250,  nivel: 2, accent: "#ef6f9c",
    metal: "linear-gradient(135deg,#25121a 0%,#ef6f9c 30%,#8d284f 55%,#ffc0d3 80%,#25121a 100%)",
    glow: "radial-gradient(circle,rgba(239,111,156,0.45) 0%,transparent 70%)" },
  { nombre: "Oro",         min: 500,  nivel: 3, accent: "#e9487b",
    metal: "linear-gradient(135deg,#211017 0%,#e9487b 30%,#8d1f49 55%,#ffabc5 80%,#211017 100%)",
    glow: "radial-gradient(circle,rgba(233,72,123,0.5) 0%,transparent 70%)" },
  { nombre: "Élite",       min: 900,  nivel: 4, accent: "#d83b73",
    metal: "linear-gradient(135deg,#1d0d14 0%,#d83b73 30%,#74163d 55%,#f58bad 80%,#1d0d14 100%)",
    glow: "radial-gradient(circle,rgba(216,59,115,0.55) 0%,transparent 70%)" },
  { nombre: "Maestro",     min: 1400, nivel: 5, accent: "#bd245b",
    metal: "linear-gradient(135deg,#180a11 0%,#bd245b 30%,#641132 55%,#ed7199 80%,#180a11 100%)",
    glow: "radial-gradient(circle,rgba(189,36,91,0.6) 0%,transparent 70%)" },
  { nombre: "Leyenda",     min: 2000, nivel: 6, accent: "#ff8fb5",
    metal: "linear-gradient(135deg,#210b15 0%,#ff8fb5 30%,#9c1e50 55%,#ffd9e5 80%,#210b15 100%)",
    glow: "radial-gradient(circle,rgba(255,143,181,0.65) 0%,transparent 72%)" },
  { nombre: "Gran Barata", min: 3000, nivel: 7, accent: "#ffc4d8",
    metal: "conic-gradient(from 0deg,#35101f,#ffc4d8,#9f1e52,#ffe9f0,#681334,#f27aa2,#35101f)",
    glow: "radial-gradient(circle,rgba(255,196,216,0.7) 0%,rgba(209,47,104,0.3) 45%,transparent 75%)" },
];

// Gema central según la categoría del comercio
export const GEMAS: Record<string, string> = {
  calzado: "#f7a1bd", gastronomia: "#e9487b", belleza: "#d83b73",
  profesionales: "#c4a0ad", servicios: "#c4a0ad", hogar: "#ef6f9c",
  salud: "#ff8fb5", automotor: "#bd245b", ferreteria: "#e9487b",
  construccion: "#e9487b", ropa: "#d12f68", mascotas: "#ef6f9c",
  deportes: "#f7a1bd", tecnologia: "#d83b73", educacion: "#f7a1bd",
  eventos: "#ff8fb5", transporte: "#bd245b", industria: "#c4a0ad",
  portuario: "#ef6f9c",
};

export function gemaDe(categoria?: string): string {
  return (categoria && GEMAS[categoria]) || "#f7a1bd";
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
