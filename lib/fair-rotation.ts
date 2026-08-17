import { hoyArgentina } from "./fecha-ar";

// Orden pseudo-aleatorio pero determinístico por día: el mismo negocio
// cae en el mismo lugar durante todo el día (estable para el ISR de la
// home, revalidate=60), pero mañana el orden es otro. Sirve para que en
// secciones con cupo limitado (ej. los primeros 12 de "Negocios
// destacados") los negocios que no pagan destacado también tengan una
// changüe real de aparecer, en vez de depender para siempre del orden
// arbitrario en que Postgres devolvió la consulta la primera vez.
function hashDiario(id: string, seed: string): number {
  const s = id + seed;
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

export function ordenRotativoDiario<T extends { id: string }>(items: T[]): T[] {
  const hoy = hoyArgentina();
  return [...items].sort((a, b) => hashDiario(a.id, hoy) - hashDiario(b.id, hoy));
}
