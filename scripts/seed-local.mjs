import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Uso: npm run seed:local -- [cantidad] [--reset]");
  console.log("Ejemplo: npm run seed:local -- 1000 --reset");
  process.exit(0);
}
const requestedCount = args.find((arg) => /^\d+$/.test(arg));
const COUNT = Number(process.env.SEED_COUNT || requestedCount || 1000);
const OFFERS_PER_BUSINESS = Number(process.env.SEED_OFFERS_PER_BUSINESS || 3);
const DEMO_EMAIL_PREFIX = "sld.demo.";
const DEMO_DOMAIN = "local.test";
const DEMO_PASSWORD = "DemoLocal2026!";

if (!Number.isInteger(COUNT) || COUNT < 1 || COUNT > 10000) {
  throw new Error("SEED_COUNT debe ser un entero entre 1 y 10000.");
}

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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SERVICE_ROLE_KEY;

if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
  throw new Error(`Este seed solo acepta Supabase local. URL recibida: ${url}`);
}
if (!serviceRoleKey) {
  throw new Error(
    "No se encontró la service role key local. Iniciá Supabase y ejecutá: eval \"$(supabase status -o env)\""
  );
}

const db = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function removeDemoData() {
  const { data: businesses, error } = await db
    .from("businesses")
    .select("id, owner_id")
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

  let page = 1;
  while (true) {
    const { data: users, error: usersError } = await db.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (usersError) throw usersError;
    const demoUsers = users.users.filter((user) => user.email?.startsWith(DEMO_EMAIL_PREFIX));
    for (const user of demoUsers) {
      const { error: deleteUserError } = await db.auth.admin.deleteUser(user.id);
      if (deleteUserError) throw deleteUserError;
    }
    if (users.users.length < 1000) break;
    page += 1;
  }
}

async function createUsers() {
  const users = [];
  for (let index = 1; index <= COUNT; index += 1) {
    const email = `${DEMO_EMAIL_PREFIX}${String(index).padStart(4, "0")}@${DEMO_DOMAIN}`;
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: `Comerciante Demo ${index}`, role: "business_owner" },
    });
    if (error) throw error;
    users.push(data.user);
    if (index % 100 === 0) console.log(`Usuarios creados: ${index}/${COUNT}`);
  }
  return users;
}

function buildRows(users) {
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
    plan: index % 20 === 0 ? "premium" : index % 5 === 0 ? "profesional" : "gratis",
    latitude: -32.742 + (index % 100) / 10000,
    longitude: -60.748 + (index % 100) / 10000,
  }));
  const offers = [];
  for (let index = 0; index < businesses.length; index += 1) {
    for (let offerIndex = 1; offerIndex <= OFFERS_PER_BUSINESS; offerIndex += 1) {
      const oldPrice = 1000 + offerIndex * 500;
      const offerPrice = Math.round(oldPrice * 0.8);
      offers.push({
        business_id: businesses[index].id,
        title: `Oferta demo ${offerIndex}: ${businesses[index].name}`,
        product: `Producto de prueba ${offerIndex}`,
        old_price: oldPrice,
        offer_price: offerPrice,
        discount_percent: 20,
        description: "Oferta generada para pruebas locales.",
        valid_until: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
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

console.log(`Generando ${COUNT} usuarios, ${COUNT} comercios y ${COUNT * OFFERS_PER_BUSINESS} ofertas...`);
const users = await createUsers();
const { profiles, businesses, offers } = buildRows(users);
await insertChunks("user_profiles", profiles);
await insertChunks("businesses", businesses);
await insertChunks("offers", offers);

console.log("\nSeed local terminado.");
console.log(`Login demo: ${DEMO_EMAIL_PREFIX}0001@${DEMO_DOMAIN}`);
console.log(`Password demo: ${DEMO_PASSWORD}`);
