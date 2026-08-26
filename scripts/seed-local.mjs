import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// Seed SOLO para Supabase local. Genera un set curado y realista de
// comercios/ofertas (para demos y testing con usuarios) o, con --bulk N,
// el generador masivo de siempre para pruebas de performance.
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Uso: npm run seed:local [--reset] [--bulk N]");
  console.log("  (sin --bulk)  set curado: 12 comercios realistas + ~18 ofertas con fotos");
  console.log("  --bulk N      N comercios genéricos para pruebas de volumen");
  console.log("  --reset       borra solo los datos demo antes de sembrar");
  process.exit(0);
}
const bulkArg = args.indexOf("--bulk");
const BULK = bulkArg !== -1 ? Number(args[bulkArg + 1]) : 0;
const DEMO_EMAIL_PREFIX = "sld.demo.";
const DEMO_DOMAIN = "local.test";
const DEMO_PASSWORD = "DemoLocal2026!";

function envFromSupabaseStatus() {
  try {
    const output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const values = {};
    for (const line of output.split("\n")) {
      const match = line.match(/^(API_URL|SERVICE_ROLE_KEY)=(.*)$/);
      if (!match) continue;
      values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
    return values;
  } catch {
    return {};
  }
}

const localEnv = envFromSupabaseStatus();
const url = process.env.SUPABASE_URL || localEnv.API_URL || "http://127.0.0.1:54321";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  localEnv.SERVICE_ROLE_KEY ||
  // Key de servicio determinística del CLI local (solo vale en 127.0.0.1;
  // el guard de abajo se asegura de que nunca salga de acá).
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
  throw new Error(`Este seed solo acepta Supabase local. URL recibida: ${url}`);
}
if (!serviceRoleKey) {
  throw new Error("No se encontró la service role key local.");
}

const db = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fecha de hoy en Argentina (UTC-3) como YYYY-MM-DD, sin depender del reloj local.
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const enDias = (d) => new Date(Date.now() - 3 * 3600e3 + d * 86400e3).toISOString().slice(0, 10);
const foto = (id, w) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// Set curado: nombres, rubros y precios que se ven por San Lorenzo.
// Coordenadas alrededor del centro (-32.7475, -60.7285).
const NEGOCIOS = [
  { slug: "horno-san-lorenzo", name: "El Horno de San Lorenzo", cat: "gastronomia", desc: "Panadería de barrio: pan de masa madre, facturas y tortas por encargo. Horno a leña los fines de semana.", address: "Av. San Martín 1240", wa: "3476550101", schedule: "Lun a Sáb 7 a 13:30 y 16:30 a 21 · Dom 7 a 13:30", rating: 4.8, reviews: 47, plan: "plus", fotoId: "1509440159596-0249088772ff", dx: 0.000, dy: 0.000 },
  { slug: "pizzeria-napoles", name: "Pizzería Nápoles", cat: "gastronomia", desc: "Pizza a la piedra, empanadas y minutas. Envíos en todo el centro.", address: "Bv. Lehmann 842", wa: "3476550102", schedule: "Mar a Dom 20 a 23:30", rating: 4.6, reviews: 89, plan: "gratis", fotoId: "1513104890138-7c749659a591", dx: 0.002, dy: -0.001 },
  { slug: "cafe-la-esquina", name: "Café La Esquina", cat: "gastronomia", desc: "Café de especialidad, medialunas y desayunos para compartir en el corazón del centro.", address: "Doctor Gho 807", wa: "3476550103", schedule: "Lun a Vie 7:30 a 20 · Sáb 8 a 13", rating: 4.9, reviews: 132, plan: "gratis", fotoId: "1501339847302-ac426a4a7cbb", dx: -0.001, dy: 0.002 },
  { slug: "carniceria-la-familia", name: "Carnicería La Familia", cat: "gastronomia", desc: "Carnes de primera, cortes para parrilla y picadas especiales. Atención por número.", address: "Mendoza 2150", wa: "3476550104", schedule: "Lun a Sáb 8 a 13 y 17 a 20:30", rating: 4.7, reviews: 64, plan: "gratis", fotoId: "1607623814075-e51df1bdc82f", dx: 0.003, dy: 0.003 },
  { slug: "ferreteria-el-puente", name: "Ferretería El Puente", cat: "ferreteria", desc: "Herramientas, pinturería y corralón. Asesoramiento para el hogar y la obra.", address: "J. J. Paso 3580", wa: "3476550105", schedule: "Lun a Vie 8 a 12:30 y 14 a 19 · Sáb 8 a 13", rating: 4.5, reviews: 38, plan: "gratis", fotoId: "1581092160562-40aa08e78837", dx: -0.003, dy: 0.001 },
  { slug: "farmacia-central", name: "Farmacia Central", cat: "salud", desc: "Perfumería, cuidado personal y derivación de recetas. Turnos de vacunación.", address: "Av. San Martín 1780", wa: "3476550106", schedule: "Lun a Sáb 8 a 22", rating: 4.4, reviews: 51, plan: "gratis", fotoId: "1587854692152-cbe660dbde88", dx: 0.001, dy: -0.003 },
  { slug: "indumentaria-vos", name: "Indumentaria Vos", cat: "ropa", desc: "Ropa femenina y masculina de temporada. Cambios sin vueltas dentro de los 30 días.", address: "Salta 1422", wa: "3476550107", schedule: "Lun a Sáb 9 a 13 y 17 a 21", rating: 4.6, reviews: 73, plan: "plus", fotoId: "1441986300917-64674bd600d8", dx: -0.002, dy: -0.002 },
  { slug: "calzados-mirtha", name: "Calzados Mirtha", cat: "calzado", desc: "Zapatillas, zapatos y school shoes. Más de 30 años en la peatonal.", address: "Tucumán 990", wa: "3476550108", schedule: "Lun a Sáb 9 a 13 y 17 a 21", rating: 4.5, reviews: 42, plan: "gratis", fotoId: "1543163521-1bf539c55dd2", dx: 0.004, dy: -0.002 },
  { slug: "peluqueria-don-juan", name: "Peluquería Don Juan", cat: "belleza", desc: "Cortes, color y barba clásica. Turnos por WhatsApp sin demora.", address: "Sarmiento 760", wa: "3476550109", schedule: "Mar a Sáb 9 a 13 y 14:30 a 20", rating: 4.8, reviews: 96, plan: "gratis", fotoId: "1585747860715-2ba37e788b70", dx: 0.002, dy: 0.004 },
  { slug: "tecnofix-sl", name: "TecnoFix San Lorenzo", cat: "tecnologia", desc: "Reparación de PC, notebooks y celulares. Presupuesto sin cargo en 24 hs.", address: "Cepeda 1150", wa: "3476550110", schedule: "Lun a Vie 9 a 19 · Sáb 9 a 13", rating: 4.7, reviews: 58, plan: "gratis", fotoId: "1498049794561-7780e7231661", dx: -0.004, dy: 0.003 },
  { slug: "veterinaria-patitas", name: "Veterinaria Patitas", cat: "mascotas", desc: "Clínica veterinaria, vacunación y pet shop. Urgencias por WhatsApp.", address: "Bv. Lehmann 2210", wa: "3476550111", schedule: "Lun a Sáb 9 a 20", rating: 4.9, reviews: 118, plan: "gratis", fotoId: "1516734212186-a967f81ad0d7", dx: 0.005, dy: 0.005 },
  { slug: "gimnasio-fuerza-barrial", name: "Gimnasio Fuerza Barrial", cat: "deportes", desc: "Musculación, funcional y clases grupales. Primera clase de prueba gratis.", address: "Moreno 1890", wa: "3476550112", schedule: "Lun a Vie 6 a 23 · Sáb 9 a 14", rating: 4.6, reviews: 87, plan: "gratis", fotoId: "1534438327276-14e5300c3a48", dx: -0.005, dy: -0.004 },
];

// Ofertas curadas: dias = vence en N días (0 = vence hoy, para countdowns).
const OFERTAS = {
  "horno-san-lorenzo": [
    { title: "Docena de medialunas de manteca", product: "Medialunas x12", antes: 9500, ahora: 7600, dias: 7, fotoId: "1509440159596-0249088772ff" },
    { title: "Torta cumpleañera 12 porciones", product: "Torta a elección", antes: 24000, ahora: 19200, dias: 3 },
  ],
  "pizzeria-napoles": [
    { title: "Pizza grande muzzarella 2x1", product: "Pizza 2x1", antes: 17000, ahora: 8500, dias: 0, fotoId: "1513104890138-7c749659a591" },
    { title: "Docena de empanadas surtidas", product: "Empanadas x12", antes: 15000, ahora: 12000, dias: 6 },
  ],
  "cafe-la-esquina": [
    { title: "Desayuno para dos con medialunas", product: "Desayuno x2", antes: 12500, ahora: 9900, dias: 5, fotoId: "1501339847302-ac426a4a7cbb" },
  ],
  "carniceria-la-familia": [
    { title: "Asado especial por kilo", product: "Asado x kg", antes: 9800, ahora: 8400, dias: 2, fotoId: "1607623814075-e51df1bdc82f" },
    { title: "Milanesas de nalga listas x kilo", product: "Milanesas x kg", antes: 9200, ahora: 7900, dias: 7 },
  ],
  "ferreteria-el-puente": [
    { title: "Kit de herramientas 60 piezas", product: "Kit herramientas", antes: 58000, ahora: 44900, dias: 7, fotoId: "1581092160562-40aa08e78837" },
    { title: "Látex interior 20 litros", product: "Pintura 20L", antes: 68000, ahora: 57800, dias: 4 },
  ],
  "farmacia-central": [
    { title: "Protector solar FPS 50 + after sun", product: "Combo solar", antes: 24500, ahora: 19600, dias: 7, fotoId: "1587854692152-cbe660dbde88" },
  ],
  "indumentaria-vos": [
    { title: "Jean recto de temporada", product: "Jean", antes: 46000, ahora: 34500, dias: 7, fotoId: "1441986300917-64674bd600d8" },
    { title: "Pack 2 remeras de algodón", product: "Remeras x2", antes: 27000, ahora: 21600, dias: 2 },
  ],
  "calzados-mirtha": [
    { title: "Zapatillas urbanas de cuero -25%", product: "Zapatillas", antes: 82000, ahora: 61500, dias: 7, fotoId: "1543163521-1bf539c55dd2" },
  ],
  "peluqueria-don-juan": [
    { title: "Corte + barba a tijera", product: "Corte y barba", antes: 12500, ahora: 9900, dias: 7, fotoId: "1585747860715-2ba37e788b70" },
  ],
  "tecnofix-sl": [
    { title: "Service completo de notebook", product: "Service PC", antes: 38000, ahora: 29900, dias: 7, fotoId: "1498049794561-7780e7231661" },
  ],
  "veterinaria-patitas": [
    { title: "Consulta + vacuna antirrábica", product: "Consulta y vacuna", antes: 21000, ahora: 16800, dias: 7, fotoId: "1516734212186-a967f81ad0d7" },
  ],
  "gimnasio-fuerza-barrial": [
    { title: "Pase mensual + evaluación física", product: "Pase mensual", antes: 34000, ahora: 26900, dias: 3, fotoId: "1534438327276-14e5300c3a48" },
  ],
};

async function removeDemoData() {
  const { data: businesses, error } = await db
    .from("businesses")
    .select("id")
    .eq("demo", true);
  if (error) throw error;

  if (businesses?.length) {
    const ids = businesses.map((business) => business.id);
    for (let start = 0; start < ids.length; start += 100) {
      const { error: deleteBusinessesError } = await db
        .from("businesses")
        .delete()
        .in("id", ids.slice(start, start + 100));
      if (deleteBusinessesError) throw deleteBusinessesError;
    }
  }

  // Siempre se relea la página 1: borrar mientras se pagina hace que los
  // offsets se corran y queden usuarios demo sin borrar (colisiones después).
  while (true) {
    const { data: users, error: usersError } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;
    const demoUsers = users.users.filter((user) => user.email?.startsWith(DEMO_EMAIL_PREFIX));
    if (demoUsers.length === 0) break;
    for (const user of demoUsers) {
      const { error: deleteUserError } = await db.auth.admin.deleteUser(user.id);
      if (deleteUserError) throw deleteUserError;
    }
  }
}

async function createUsers(count, labels) {
  const users = [];
  for (let index = 1; index <= count; index += 1) {
    const email = `${DEMO_EMAIL_PREFIX}${String(index).padStart(4, "0")}@${DEMO_DOMAIN}`;
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: labels ? labels[index - 1] : `Comerciante Demo ${index}`, role: "business_owner" },
    });
    if (error) throw error;
    users.push(data.user);
  }
  return users;
}

function buildCurated(users) {
  const profiles = users.map((user, i) => ({
    user_id: user.id,
    display_name: NEGOCIOS[i].name,
    role: "business_owner",
    onboarding_completed: true,
    newsletter_opt_in: false,
  }));
  const businesses = users.map((user, i) => {
    const n = NEGOCIOS[i];
    return {
      id: randomUUID(),
      owner_id: user.id,
      name: n.name,
      slug: n.slug,
      category: n.cat,
      type: "comercio",
      description: n.desc,
      address: n.address,
      schedule: n.schedule,
      whatsapp: n.wa,
      city: "San Lorenzo",
      province: "Santa Fe",
      country: "Argentina",
      status: "verificado",
      demo: true,
      published: true,
      activo: true,
      open: true,
      plan: n.plan,
      rating: n.rating,
      reviews: n.reviews,
      portada_url: foto(n.fotoId, 1600),
      logo_url: foto(n.fotoId, 240) + "&h=240",
      latitude: -32.7475 + n.dx,
      longitude: -60.7285 + n.dy,
    };
  });
  const offers = [];
  businesses.forEach((biz) => {
    for (const o of OFERTAS[biz.slug] || []) {
      const descuento = Math.round(((o.antes - o.ahora) / o.antes) * 100);
      offers.push({
        business_id: biz.id,
        title: o.title,
        product: o.product,
        old_price: o.antes,
        offer_price: o.ahora,
        discount_percent: descuento,
        description: `Oferta vigente en ${biz.name}. Mostrá la app o decí que viniste de La Gran Barata.`,
        image_url: o.fotoId ? foto(o.fotoId, 1200) : null,
        valid_until: enDias(o.dias),
        active: true,
      });
    }
  });
  return { profiles, businesses, offers };
}

// Modo --bulk: generador masivo original (pruebas de volumen).
function buildBulk(users) {
  const categories = ["gastronomia", "indumentaria", "servicios", "hogar", "salud", "tecnologia"];
  const profiles = users.map((user, index) => ({
    user_id: user.id,
    display_name: `Comerciante Demo ${index + 1}`,
    role: "business_owner",
    onboarding_completed: true,
    newsletter_opt_in: false,
  }));
  const businesses = users.map((user, index) => ({
    id: randomUUID(),
    owner_id: user.id,
    name: `Comercio Demo ${String(index + 1).padStart(4, "0")}`,
    slug: `comercio-demo-${String(index + 1).padStart(4, "0")}`,
    category: categories[index % categories.length],
    type: "comercio",
    description: "Datos de prueba locales para validar el flujo completo.",
    address: `${100 + (index % 900)} Av. San Martín`,
    city: "San Lorenzo",
    province: "Santa Fe",
    country: "Argentina",
    whatsapp: "3415550000",
    status: "verificado",
    demo: true,
    published: true,
    activo: true,
    open: true,
    plan: index % 20 === 0 ? "premium" : index % 5 === 0 ? "profesional" : "gratis",
    latitude: -32.742 + (index % 100) / 10000,
    longitude: -60.748 + (index % 100) / 10000,
  }));
  const offers = [];
  for (let index = 0; index < businesses.length; index += 1) {
    for (let offerIndex = 1; offerIndex <= 3; offerIndex += 1) {
      const oldPrice = 1000 + offerIndex * 500;
      offers.push({
        business_id: businesses[index].id,
        title: `Oferta demo ${offerIndex}: ${businesses[index].name}`,
        product: `Producto de prueba ${offerIndex}`,
        old_price: oldPrice,
        offer_price: Math.round(oldPrice * 0.8),
        discount_percent: 20,
        description: "Oferta generada para pruebas locales.",
        valid_until: enDias(7),
        active: true,
      });
    }
  }
  return { profiles, businesses, offers };
}

async function insertChunks(table, rows, chunkSize = 500) {
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const { error } = await db.from(table).insert(chunk);
    if (error) throw error;
    console.log(`${table}: ${Math.min(start + chunk.length, rows.length)}/${rows.length}`);
  }
}

if (process.argv.includes("--reset")) {
  console.log("Eliminando únicamente datos demo locales...");
  await removeDemoData();
}

if (BULK > 0) {
  console.log(`Modo bulk: generando ${BULK} comercios genéricos...`);
  const users = await createUsers(BULK);
  const { profiles, businesses, offers } = buildBulk(users);
  await insertChunks("user_profiles", profiles);
  await insertChunks("businesses", businesses);
  await insertChunks("offers", offers);
} else {
  console.log(`Sembrando set curado: ${NEGOCIOS.length} comercios + ${Object.values(OFERTAS).flat().length} ofertas...`);
  const users = await createUsers(NEGOCIOS.length, NEGOCIOS.map((n) => n.name));
  const { profiles, businesses, offers } = buildCurated(users);
  await insertChunks("user_profiles", profiles);
  await insertChunks("businesses", businesses);
  await insertChunks("offers", offers);
  console.log("\nComercios demo:");
  for (const n of NEGOCIOS) console.log(`  · ${n.name} (/negocio/${n.slug})`);
}

console.log(`\nSeed local terminado (hoy AR: ${hoyAR()}).`);
console.log(`Login demo: ${DEMO_EMAIL_PREFIX}0001@${DEMO_DOMAIN}`);
console.log(`Password demo: ${DEMO_PASSWORD}`);
