// SDL Score: Índice de Oportunidad (0-100)
// Calcula qué tan buena es una oferta basándose en:
// - Descuento (40% del peso)
// - Distancia al usuario (25% del peso)
// - Rating del negocio (20% del peso)
// - Urgencia / días restantes (15% del peso)

export function calcSDLScore(params: {
  descuento?: number;
  distanciaKm?: number | null;
  rating?: number;
  diasRestantes?: number | null;
}): number {
  const { descuento = 0, distanciaKm, rating = 0, diasRestantes } = params;

  // 1. Puntaje por descuento (0-100, peso 40%)
  // 0% = 0pts, 10% = 20pts, 25% = 50pts, 50% = 100pts, 70%+ = 100pts
  const scoreDescuento = Math.min(100, (descuento / 70) * 100);

  // 2. Puntaje por distancia (0-100, peso 25%)
  // 0km = 100pts, 1km = 90pts, 3km = 70pts, 5km = 50pts, 10km+ = 0pts
  let scoreDistancia = 100;
  if (distanciaKm !== null && distanciaKm !== undefined) {
    if (distanciaKm <= 0.5) scoreDistancia = 100;
    else if (distanciaKm <= 1) scoreDistancia = 90;
    else if (distanciaKm <= 2) scoreDistancia = 80;
    else if (distanciaKm <= 3) scoreDistancia = 70;
    else if (distanciaKm <= 5) scoreDistancia = 50;
    else if (distanciaKm <= 10) scoreDistancia = 30;
    else scoreDistancia = 0;
  } else {
    scoreDistancia = 50; // sin distancia, puntaje neutro
  }

  // 3. Puntaje por rating (0-100, peso 20%)
  // 0 = 0pts, 3 = 50pts, 4 = 75pts, 4.5 = 90pts, 5 = 100pts
  const scoreRating = Math.min(100, (rating / 5) * 100);

  // 4. Puntaje por urgencia (0-100, peso 15%)
  // Vence hoy = 100pts, mañana = 85pts, 2 días = 70pts, 3 días = 55pts, 7 días = 30pts, 14+ días = 10pts
  let scoreUrgencia = 10;
  if (diasRestantes !== null && diasRestantes !== undefined) {
    if (diasRestantes <= 0) scoreUrgencia = 100;
    else if (diasRestantes === 1) scoreUrgencia = 85;
    else if (diasRestantes === 2) scoreUrgencia = 70;
    else if (diasRestantes === 3) scoreUrgencia = 55;
    else if (diasRestantes <= 5) scoreUrgencia = 40;
    else if (diasRestantes <= 7) scoreUrgencia = 30;
    else scoreUrgencia = 10;
  } else {
    scoreUrgencia = 25; // sin fecha de vencimiento
  }

  // Calcular score ponderado
  const score = Math.round(
    scoreDescuento * 0.40 +
    scoreDistancia * 0.25 +
    scoreRating * 0.20 +
    scoreUrgencia * 0.15
  );

  return Math.max(0, Math.min(100, score));
}

// Etiquetar el score (Excelente / Muy buena / Buena / Regular)
export function sdlLabel(score: number): { text: string; color: string; variant: "success" | "warning" | "danger" | "info" | "default" } {
  if (score >= 85) return { text: "Excelente oportunidad", color: "text-green-400", variant: "success" };
  if (score >= 70) return { text: "Muy buena oportunidad", color: "text-sky-400", variant: "info" };
  if (score >= 55) return { text: "Buena oportunidad", color: "text-orange-400", variant: "warning" };
  if (score >= 40) return { text: "Oportunidad regular", color: "text-yellow-400", variant: "warning" };
  return { text: "Oportunidad baja", color: "text-white/50", variant: "default" };
}
