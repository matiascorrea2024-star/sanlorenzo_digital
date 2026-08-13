export const NIVELES = [
  { min: 0, nombre: "Bronce", icon: "🥉" },
  { min: 10, nombre: "Plata", icon: "🥈" },
  { min: 25, nombre: "Oro", icon: "🥇" },
  { min: 50, nombre: "Platino", icon: "💎" },
  { min: 100, nombre: "Diamante", icon: "💠" },
  { min: 200, nombre: "Leyenda", icon: "🏆" },
];

export function puntosDe(seguidores: number, resenas: number, verificado: boolean) {
  return seguidores * 5 + resenas * 3 + (verificado ? 10 : 0);
}

export function nivelDe(puntos: number) {
  let actual = NIVELES[0];
  for (const n of NIVELES) if (puntos >= n.min) actual = n;
  const siguiente = NIVELES[NIVELES.indexOf(actual) + 1];
  return {
    ...actual,
    siguiente,
    faltan: siguiente ? siguiente.min - puntos : 0,
  };
}
