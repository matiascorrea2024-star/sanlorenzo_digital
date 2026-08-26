// Sinónimos y modismos argentos para la búsqueda local: la gente busca
// como habla ("choper", "fiambre", "gummi") y el LIKE literal no encuentra
// nada. Cada término canónico expande a sus variantes de búsqueda.
// Curado a mano -- no usar IA para esto, es un diccionario de barrio.
export const SINONIMOS: Record<string, string[]> = {
  // Bebidas
  cerveza: ["choper", "birra", "cerveza artesanal", "pinta"],
  choper: ["cerveza", "birra"],
  birra: ["cerveza", "choper"],
  vino: ["malbec", "torrontes", "torrontés", "cabernet", "espumante", "champagne"],
  gaseosa: ["coca", "pepsi", "soda", "refresco"],
  coca: ["gaseosa", "cola"],
  fernet: ["branca", "fernet con coca"],
  // Almacén / fiambres
  fiambre: ["jamón", "jamón crudo", "queso", "salame", "mortadela"],
  jamon: ["fiambre", "jamón cocido", "jamón crudo"],
  queso: ["fiambre", "queso cremoso", "muzzarella", "sardo"],
  salame: ["fiambre", "salchichón"],
  yerba: ["mate", "yerba mate", "bombilla"],
  mate: ["yerba", "yerba mate", "bombilla", "termo"],
  azucar: ["azúcar", "edulcorante"],
  harina: ["leche", "almacén"],
  aceite: ["girasol", "oliva", "almacén"],
  arroz: ["fideos", "polenta", "almacén"],
  fideos: ["pasta", "arroz", "salsa"],
  // Panadería
  pan: ["pan francés", "panadería", "migas", "pan rallado"],
  facturas: ["medialunas", "panadería", "vigilantes", "bolas de fraile"],
  medialunas: ["facturas", "panadería", "croissant"],
  torta: ["pastel", "tartas", "panadería", "cumpleaños"],
  cumpleanos: ["cumpleaños", "torta", "candy bar", "eventos"],
  // Comida rápida / gastronomía
  panchos: ["hot dog", "panchos", "salchichas"],
  "hot dog": ["panchos"],
  hamburguesa: ["hamburgesa", "burguer", "burger", "sandwich"],
  hamburgesa: ["hamburguesa", "burger"],
  pizza: ["pizzería", "muzzarella", "napolitana", "empanadas"],
  empanadas: ["tartas", "pizza", "minutas"],
  milanesas: ["milanesa", "suprema", "minutas", "napolitana"],
  milanesa: ["milanesas", "suprema"],
  papas: ["papas fritas", "noisette", "minutas"],
  asado: ["carne", "carnicería", "parrilla", "vacío", "costillar"],
  carne: ["asado", "carnicería", "milanesas", "picada"],
  pollo: ["pollería", "pata muslo", "suprema de pollo"],
  helado: ["heladería", "docena de gustos", "cucurucho"],
  sandwich: ["sánguche", "sanguchito", "lomito", "hamburguesa"],
  sanguche: ["sandwich", "miga", "lomito"],
  miga: ["sandwich de miga", "sanguche"],
  lomito: ["lomitos", "sandwich", "hamburguesa"],
  // Ropa / calzado
  zapatillas: ["calzado", "running", "deportivo", "botitas"],
  botitas: ["zapatillas", "botas", "calzado"],
  zapatos: ["calzado", "sandalia", "ojotas"],
  camiseta: ["remera", "fútbol", "deportes"],
  remera: ["camiseta", "shirt", "indumentaria"],
  jean: ["jeans", "pantalón", "ropa"],
  buzo: ["hoodie", "campera", "abrigo"],
  campera: ["buzo", "abrigo", "rompeviento"],
  traje: ["smoking", "esmoquin", "sastrería"],
  // Hogar / ferretería
  ferreteria: ["ferretería", "herramientas", "tornillos", "pintura"],
  herramientas: ["ferretería", "destornillador", "taladro", "amoladora"],
  pintura: ["látex", "esmalte", "rodillo", "pincel", "ferretería"],
  latex: ["pintura", "interior", "exterior"],
  lampara: ["lámpara", "luces", "led", "iluminación"],
  led: ["lampara", "lámpara", "iluminación"],
  colchon: ["sommier", "almohada", "sabanas", "colchonería"],
  sabanas: ["sábanas", "colchón", "acolchado", "blanco"],
  cortina: ["cortinas", "persiana", "decó"],
  // Tecnología
  celular: ["teléfono", "móvil", "smartphone", "fundas", "vidrio templado"],
  funda: ["fundas", "celular", "case"],
  cargador: ["cable", "celular", "enchufe usb"],
  notebook: ["laptop", "computadora", "pc", "netbook"],
  computadora: ["pc", "notebook", "service"],
  service: ["reparación", "arreglo", "tecnofix"],
  auriculares: ["headphones", "bluetooth", "parlante"],
  parlante: ["auriculares", "bluetooth", "audio"],
  // Belleza / salud
  peluqueria: ["peluquería", "corte", "tinte", "barbería"],
  barberia: ["barbería", "corte", "barba", "peluquería"],
  uñas: ["uñas", "nail", "esculpidas", "kapping"],
  manicura: ["uñas", "nail", "kapping"],
  tattoo: ["tatuaje", "tattoo", "piercing"],
  tatuaje: ["tattoo", "estudio"],
  gimnasio: ["gym", "musculación", "fitness", "funcional"],
  gym: ["gimnasio", "fitness"],
  farmacia: ["medicamentos", "perfumería", "sunscreen", "protector solar"],
  protector: ["protector solar", "sunscreen", "bloqueador"],
  // Mascotas
  veterinaria: ["veterinario", "mascotas", "vacuna", "perro", "gato"],
  perro: ["mascotas", "alimento balanceado", "veterinaria", "correa"],
  gato: ["mascotas", "arena", "balanceado", "veterinaria"],
  balanceado: ["alimento", "mascotas", "perro", "gato"],
  // Deportes / otros
  futbol: ["fútbol", "pelota", "camiseta", "botines"],
  botines: ["fútbol", "zapatillas", "calzado"],
  bicicleta: ["bici", "ciclismo", "rodado"],
  bici: ["bicicleta", "ciclismo"],
  escuela: ["uniforme", "guardapolvo", "mochila", "útiles", "librería"],
  utiles: ["útiles escolares", "mochila", "librería"],
  mochila: ["morral", "librería", "útiles"],
  libreria: ["librería", "útiles", "regalos", "juguetes"],
  regalos: ["regalo", "cumpleaños", "librería", "juguetes"],
  juguetes: ["juguete", "regalos", "niños"],
  flores: ["florería", "ramo", "rosas", "eventos"],
  fiestas: ["eventos", "cumpleaños", "cotillón", "decoración"],
  cotillon: ["cotillón", "fiestas", "globos", "cumpleaños"],
  auto: ["automotor", "lubricentro", "neumáticos", "lavado"],
  neumaticos: ["neumáticos", "cubiertas", "llantas", "automotor"],
  cubiertas: ["neumáticos", "automotor"],
  alquiler: ["alquilar", "inmobiliaria", "depto", "casa"],
  fletes: ["flete", "transporte", "logística", "mudanza"],
  mudanza: ["fletes", "transporte"],
};

// Normaliza quitando acentos y pasando a minúsculas para comparar.
export function normalizarBusqueda(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Expande una query con sus sinónimos: "choper" → ["choper", "cerveza", "birra"].
 * Devuelve la query original primero (matcheo exacto gana), luego variantes.
 * Máximo 5 términos para no romper el query builder.
 */
export function expandirBusqueda(q: string): string[] {
  const normalizada = normalizarBusqueda(q);
  if (!normalizada) return [];
  const terminos = [q.trim()];
  for (const extra of SINONIMOS[normalizada] || []) {
    if (!terminos.some((t) => normalizarBusqueda(t) === normalizarBusqueda(extra))) {
      terminos.push(extra);
    }
    if (terminos.length >= 5) break;
  }
  return terminos;
}
