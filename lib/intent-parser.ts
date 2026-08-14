// Parser de búsqueda por intención (sin APIs externas)
// Entiende queries como:
//   "zapatillas menos de 50000 cerca mío"
//   "pizza barata abierta ahora"
//   "regalo para novia 30000"

export interface ParsedIntent {
  termino: string;
  precioMax?: number;
  precioMin?: number;
  cercaMio: boolean;
  abiertoAhora: boolean;
  barato: boolean;
  descuentoMin?: number;
  categoriaDetectada?: string;
}

const CATEGORIAS_SINONIMOS: Record<string, string[]> = {
  calzado: ["zapatillas", "zapatilla", "zapatos", "botas", "sandalias", "calzado"],
  gastronomia: ["pizza", "comida", "comer", "restaurante", "cafe", "café", "hamburguesa", "empanadas", "helado"],
  ferreteria: ["ferreteria", "ferretería", "taladro", "herramientas", "tornillos"],
  belleza: ["peluqueria", "peluquería", "corte", "barba", "manicura", "peinado", "belleza"],
  ropa: ["ropa", "campera", "jeans", "remera", "vestido"],
  automotor: ["mecanico", "mecánico", "auto", "service", "gomeria", "gomería"],
  tecnologia: ["celular", "celulares", "telefono", "teléfono", "notebook", "tecnologia", "tecnología"],
  profesionales: ["dentista", "abogado", "contador", "profesional"],
  salud: ["salud", "medico", "médico", "doctor", "dentista", "farmacia", "clinica", "clínica"],
  hogar: ["hogar", "muebles", "deco", "decoracion", "decoración", "electrodomesticos", "electrodomésticos"],
  construccion: ["construccion", "construcción", "materiales", "corralon", "corralón", "albañil", "plomero"],
  educacion: ["educacion", "educación", "instituto", "clases", "academia", "tutor"],
  deportes: ["deportes", "gym", "gimnasio", "cancha", "futbol", "fútbol", "paddle", "natacion", "natación"],
  mascotas: ["mascotas", "veterinaria", "veterinario", "petshop", "perro", "gato"],
  eventos: ["eventos", "salon", "salón", "fiesta", "catering", "fotografo", "fotógrafo"],
  inmobiliarias: ["inmobiliaria", "alquiler", "venta", "departamento", "casa"],
  transporte: ["transporte", "remis", "remís", "taxi", "colectivo", "bus"],
  logistica: ["logistica", "logística", "flete", "mudanza", "paqueteria", "paquetería"],
  agro: ["agro", "campo", "semillas", "fertilizante", "maquinaria", "tractores"],
  industria: ["industria", "fabrica", "fábrica", "manufactura", "produccion", "producción"],
  "servicios-industriales": ["servicios industriales", "mantenimiento industrial", "soldadura", "torneria", "tornería", "ingenieria", "ingeniería"],
  portuario: ["puerto", "portuario", "terminal", "aduana", "aduana", "maritimo", "marítimo", "barco"],
  "comercio-exterior": ["comercio exterior", "exportacion", "exportación", "importacion", "importación", "forwarding"],
  b2b: ["b2b", "empresas", "corporativo", "proveedor", "empresa"],

};

export function parseIntent(query: string): ParsedIntent {
  const q = query.toLowerCase();

  // Precio máximo: "menos de 50000", "hasta 30000", "por 20000", "$50000"
  let precioMax: number | undefined;
  const maxMatch = q.match(/(?:menos de|hasta|por|max\.?)\s*\$?\s*(\d[\d.]*)/);
  if (maxMatch) precioMax = Number(maxMatch[1].replace(/\./g, ""));

  // Precio mínimo: "desde 10000"
  let precioMin: number | undefined;
  const minMatch = q.match(/desde\s*\$?\s*(\d[\d.]*)/);
  if (minMatch) precioMin = Number(minMatch[1].replace(/\./g, ""));

  // Descuento: "30% off", "descuento 40"
  let descuentoMin: number | undefined;
  const descMatch = q.match(/(\d{1,2})\s*%\s*(?:off|descuento|dto)/);
  if (descMatch) descuentoMin = Number(descMatch[1]);

  const cercaMio = /cerca|cerquita|a\s*\d+\s*(?:km|cuadras|metros)|mi\s*zona|mi\s*barrio/.test(q);
  const abiertoAhora = /abierto|abierta|ahora|ya|abierto ahora/.test(q);
  const barato = /barato|barata|economico|económica|economico|económico|gangas?|oferta/.test(q);

  // Categoría detectada
  let categoriaDetectada: string | undefined;
  for (const [cat, sinonimos] of Object.entries(CATEGORIAS_SINONIMOS)) {
    if (sinonimos.some(s => q.includes(s))) {
      categoriaDetectada = cat;
      break;
    }
  }

  // Término limpio (sin las palabras de intención)
  const termino = q
    .replace(/menos de|hasta|desde|por|max\.?|cerca m[ií]o|cerca|abierto ahora|abierto|abierta|ahora|barato|barata|economico|económica|\d+%\s*(?:off|descuento|dto)|\$?\d[\d.]*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return { termino, precioMax, precioMin, cercaMio, abiertoAhora, barato, descuentoMin, categoriaDetectada };
}

// Descripción humana de lo que entendimos
export function intentSummary(intent: ParsedIntent): string[] {
  const chips: string[] = [];
  if (intent.termino) chips.push(`"${intent.termino}"`);
  if (intent.categoriaDetectada) chips.push(`categoría: ${intent.categoriaDetectada}`);
  if (intent.precioMax) chips.push(`hasta $${intent.precioMax.toLocaleString("es-AR")}`);
  if (intent.precioMin) chips.push(`desde $${intent.precioMin.toLocaleString("es-AR")}`);
  if (intent.descuentoMin) chips.push(`${intent.descuentoMin}%+ OFF`);
  if (intent.cercaMio) chips.push("cerca tuyo");
  if (intent.abiertoAhora) chips.push("abierto ahora");
  if (intent.barato && !intent.precioMax) chips.push("opciones económicas");
  return chips;
}
