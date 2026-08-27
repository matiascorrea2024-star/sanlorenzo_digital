// La Gran Barata Ads: catálogo de placements y precio por día.
// Un solo placement real para el lanzamiento (Home Viva es la superficie
// de mayor tráfico del sitio -- ver app/page.tsx / mv-client.tsx). Agregar
// uno nuevo es sumar una entrada acá + un <AdSlot placement="..."/> en el
// lugar del sitio donde tiene que aparecer; el resto del motor (pago,
// moderación, ciclo de vida, analytics) ya sirve para cualquier placement.
export const AD_PLACEMENTS: Record<string, {
  label: string;
  description: string;
  dailyRateARS: number;
  minDias: number;
  maxDias: number;
}> = {
  home_feed: {
    label: "Feed de Mercado Vivo (Home)",
    description: "Tarjeta patrocinada dentro del feed principal de la home, la superficie de mayor tráfico del sitio.",
    dailyRateARS: 1500,
    minDias: 3,
    maxDias: 30,
  },
};

export function calcularPrecioCampana(placement: string, dias: number): number | null {
  const p = AD_PLACEMENTS[placement];
  if (!p) return null;
  if (dias < p.minDias || dias > p.maxDias) return null;
  return p.dailyRateARS * dias;
}
