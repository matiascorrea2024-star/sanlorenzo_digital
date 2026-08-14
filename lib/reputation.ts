// SDL Reputación: score compuesto 0-100
// - Rating promedio (40%)
// - Actividad: ofertas + posts en muro + historias (30%)
// - Popularidad: visitas + guardados (20%)
// - Confianza: verificado (10%)

export function calcReputation(params: {
  rating?: number;        // 0-5
  ofertas?: number;
  posts?: number;
  historias?: number;
  visitas?: number;
  guardados?: number;
  verificado?: boolean;
}): number {
  const {
    rating = 0, ofertas = 0, posts = 0, historias = 0,
    visitas = 0, guardados = 0, verificado = false,
  } = params;

  // 1. Rating (0-100, peso 40%)
  const scoreRating = Math.min(100, (rating / 5) * 100);

  // 2. Actividad (0-100, peso 30%) — tope en 10 acciones
  const acciones = ofertas + posts + historias;
  const scoreActividad = Math.min(100, (acciones / 10) * 100);

  // 3. Popularidad (0-100, peso 20%) — tope en 200 interacciones
  const interacciones = visitas + guardados;
  const scorePopularidad = Math.min(100, (interacciones / 200) * 100);

  // 4. Confianza (peso 10%)
  const scoreConfianza = verificado ? 100 : 40;

  return Math.round(
    scoreRating * 0.40 +
    scoreActividad * 0.30 +
    scorePopularidad * 0.20 +
    scoreConfianza * 0.10
  );
}

export function reputationLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: "Excelente reputación", color: "text-green-400" };
  if (score >= 60) return { text: "Muy buena reputación", color: "text-sky-400" };
  if (score >= 40) return { text: "Buena reputación", color: "text-orange-400" };
  return { text: "Reputación en construcción", color: "text-white/50" };
}
