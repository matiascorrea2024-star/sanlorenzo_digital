
// Fechas dinámicas para ofertas demo: siempre relativas a HOY (nunca expiran)
const en = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: string;
  description: string;
  address: string;
  rating: number;
  reviews: number;
  status: "verificado" | "reclamado" | "no_reclamado";
  demo: boolean;
  open: boolean;
  whatsapp?: string;
  instagram?: string;
  tags: string[];
  accent: string;
  schedule: string;
  updatedAt: string;
  items: { name: string; price?: string; note?: string }[];
  professionals?: string[];
  city?: string;
  province?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_source?: "auto" | "manual" | "error";
  location_verified?: boolean;
  location_updated_at?: string;
};

export const CATEGORIES = [
  { id: "calzado", name: "Calzado", icon: "👟" },
  { id: "gastronomia", name: "Gastronomía", icon: "🍽️" },
  { id: "ferreteria", name: "Ferreterías", icon: "🔧" },
  { id: "belleza", name: "Belleza", icon: "💈" },
  { id: "ropa", name: "Ropa", icon: "👕" },
  { id: "automotor", name: "Automotor", icon: "🚗" },
  { id: "profesionales", name: "Profesionales", icon: "💼" },
  { id: "tecnologia", name: "Tecnología", icon: "💻" },
  { id: "salud", name: "Salud", icon: "🏥" },
  { id: "hogar", name: "Hogar", icon: "🏠" },
  { id: "construccion", name: "Construcción", icon: "🏗️" },
  { id: "educacion", name: "Educación", icon: "🎓" },
  { id: "deportes", name: "Deportes", icon: "🏋️" },
  { id: "mascotas", name: "Mascotas", icon: "🐾" },
  { id: "eventos", name: "Eventos", icon: "🎉" },
  { id: "inmobiliarias", name: "Inmobiliarias", icon: "🏢" },
  { id: "transporte", name: "Transporte", icon: "🚚" },
  { id: "logistica", name: "Logística", icon: "📦" },
  { id: "agro", name: "Agro", icon: "🌱" },
  { id: "industria", name: "Industria", icon: "🏭" },
  { id: "servicios-industriales", name: "Servicios Industriales", icon: "⚙️" },
  { id: "portuario", name: "Portuario", icon: "⚓" },
  { id: "comercio-exterior", name: "Comercio Exterior", icon: "🚢" },
  { id: "b2b", name: "B2B / Empresas", icon: "💼" },
];

export const BUSINESSES: Business[] = [
  {
    id: "1",
    slug: "almendra-calzados",
    name: "Almendra Calzados",
    category: "calzado",
    type: "comercio",
    description: "Calzado femenino premium. Diseñados para acompañar tu esencia. Tacos, sandalias, botas y texanas con atención personalizada.",
    address: "Belgrano 626, San Lorenzo, Santa Fe",
    rating: 4.8,
    reviews: 124,
    status: "verificado",
    demo: false,
    open: true,
    whatsapp: "5493476341344",
    instagram: "calzadosalmendra",
    tags: ["zapatillas", "sandalias", "botas", "texanas", "zapatos", "tacos"],
    accent: "#C8A15A",
    schedule: "Lun a Vie 9–12:30 y 16–20:30 · Sáb 9–13",
    updatedAt: "hoy",
    items: [
      { name: "Zapatillas botitas ART 119" },
      { name: "Sandalias ART 06 Plata" },
      { name: "Texanas ART 9009 Negras" },
      { name: "ART 1832 Ch/Blanco" }
    ],
    latitude: -32.746690,
    longitude: -60.734513,
    location_source: "manual",
    location_verified: true
  },
  {
    id: "2",
    slug: "ferreteria-san-lorenzo",
    name: "Ferretería San Martín",
    category: "ferreteria",
    type: "ferreteria",
    description: "Herramientas, materiales y asesoramiento para tu hogar y obra.",
    address: "Av. San Martín 1200, San Lorenzo",
    rating: 4.6,
    reviews: 58,
    status: "reclamado",
    demo: true,
    open: true,
    tags: ["herramientas", "pinturería", "electricidad"],
    accent: "#F59E0B",
    schedule: "Lun a Vie 8–12 y 15–19 · Sáb 8–12",
    updatedAt: "hace 2 días",
    items: [
      { name: "Taladro percutor 650W", price: "$58.000" },
      { name: "Látex interior 10L", price: "$42.500" },
      { name: "Set destornilladores x8" }
    ],
    latitude: -32.7479,
    longitude: -60.7309
  },
  {
    id: "3",
    slug: "cafe-central",
    name: "Café La Esquina",
    category: "gastronomia",
    type: "restaurante",
    description: "Café de especialidad, brunch y pastelería artesanal en el centro.",
    address: "Belgrano 850, San Lorenzo",
    rating: 4.7,
    reviews: 96,
    status: "reclamado",
    demo: true,
    open: true,
    tags: ["café", "brunch", "pastelería", "restaurante", "merienda"],
    accent: "#22D3EE",
    schedule: "Mar a Dom 8–20",
    updatedAt: "hoy",
    items: [
      { name: "Brunch completo", price: "$12.500", note: "sáb y dom" },
      { name: "Latte de especialidad", price: "$3.800" },
      { name: "Torta del día", price: "$4.200" }
    ],
    latitude: -32.7503,
    longitude: -60.7289
  },
  {
    id: "4",
    slug: "barberia-estilo",
    name: "Barbería Centro",
    category: "belleza",
    type: "peluqueria",
    description: "Cortes, barba y tratamientos. Turnos por WhatsApp.",
    address: "Córdoba 450, San Lorenzo",
    rating: 4.9,
    reviews: 210,
    status: "reclamado",
    demo: true,
    open: false,
    tags: ["barbería", "corte", "barba", "peluquería"],
    accent: "#8B5CF6",
    schedule: "Mar a Sáb 10–20",
    updatedAt: "hace 5 días",
    professionals: ["Nacho · Barbero senior", "Luca · Fade specialist"],
    items: [
      { name: "Corte clásico", price: "$7.000" },
      { name: "Fade + barba", price: "$11.000" },
      { name: "Tratamiento capilar", price: "$9.500" }
    ],
    latitude: -32.7518,
    longitude: -60.7339
  },
  {
    id: "5",
    slug: "tienda-urbana",
    name: "Tienda Urbana SL",
    category: "ropa",
    type: "comercio",
    description: "Moda urbana y accesorios para todos los días.",
    address: "Pte. Roca 320, San Lorenzo",
    rating: 4.5,
    reviews: 41,
    status: "no_reclamado",
    demo: true,
    open: true,
    tags: ["ropa", "remeras", "buzos", "accesorios"],
    accent: "#34D399",
    schedule: "Lun a Sáb 9–20",
    updatedAt: "hace 12 días",
    items: [
      { name: "Remera oversize", price: "$18.000" },
      { name: "Buzo canguru", price: "$35.000" }
    ],
    latitude: -32.7529,
    longitude: -60.7356
  },
  {
    id: "6",
    slug: "taller-motor",
    name: "Taller Ruta 11",
    category: "automotor",
    type: "automotor",
    description: "Servicio integral, repuestos y alineación para tu vehículo.",
    address: "Ruta 11 km 3, San Lorenzo",
    rating: 4.4,
    reviews: 33,
    status: "no_reclamado",
    demo: true,
    open: true,
    tags: ["mecánica", "repuestos", "service"],
    accent: "#F87171",
    schedule: "Lun a Vie 8–17",
    updatedAt: "hace 20 días",
    items: [
      { name: "Service completo" },
      { name: "Cambio de aceite y filtros", price: "$45.000" },
      { name: "Alineación y balanceo" }
    ],
    latitude: -32.7605,
    longitude: -60.7225
  },
  {
    id: "7",
    slug: "estudio-contable",
    name: "Estudio López",
    category: "profesionales",
    type: "profesional",
    description: "Contadora pública. Monotributo, pymes y asesoramiento impositivo.",
    address: "Mitre 780, 2° piso, San Lorenzo",
    rating: 5,
    reviews: 12,
    status: "reclamado",
    demo: true,
    open: false,
    tags: ["contadora", "monotributo", "pymes", "impuestos"],
    accent: "#60A5FA",
    schedule: "Lun a Vie 9–17 (con turno)",
    updatedAt: "hace 3 días",
    items: [
      { name: "Alta de monotributo" },
      { name: "Liquidación mensual pyme" },
      { name: "Consulta impositiva", price: "$25.000" }
    ],
    latitude: -32.7491,
    longitude: -60.7346
  },
  {
    id: "8",
    slug: "tecno-point",
    name: "Tecno Point SL",
    category: "tecnologia",
    type: "comercio",
    description: "Celulares, computación, reparación y accesorios.",
    address: "Av. Libertad 990, San Lorenzo",
    rating: 4.3,
    reviews: 27,
    status: "no_reclamado",
    demo: true,
    open: true,
    tags: ["celulares", "computadoras", "reparación"],
    accent: "#A78BFA",
    schedule: "Lun a Sáb 9–12:30 y 16–20",
    updatedAt: "hace 7 días",
    items: [
      { name: "Service de celulares" },
      { name: "Vidrio templado + colocación", price: "$8.000" },
      { name: "Fundas", price: "desde $6.500" }
    ],
    latitude: -32.7462,
    longitude: -60.7283
  }
];
