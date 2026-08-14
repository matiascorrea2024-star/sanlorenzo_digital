// Smoke test final: circuito completo del producto
const BASE = process.argv[2] || "https://sanlorenzodigital.vercel.app";

const RUTAS = [
  // Circuito usuario
  "/", "/negocios", "/promociones", "/categoria/calzado", "/categoria/gastronomia",
  "/categoria/industria", "/categoria/portuario", "/negocio/almendra-calzados",
  "/radar", "/listas", "/asistente", "/comparar", "/mapa", "/ranking", "/feed",
  "/favoritos", "/planes",
  // Ecosistema B2B
  "/b2b", "/portuario", "/san-lorenzo", "/san-lorenzo/centro",
  // Circuito comerciante
  "/dashboard", "/dashboard/ofertas", "/dashboard/productos", "/dashboard/analytics",
  "/dashboard/planes", "/dashboard/muro", "/dashboard/asistente", "/dashboard/resenas",
  // Admin + auth + SEO
  "/admin", "/login", "/registro", "/sitemap.xml", "/robots.txt",
];

async function main() {
  console.log("🏁 VERIFICACIÓN FINAL → " + BASE);
  console.log("=".repeat(70));
  let ok = 0, fail = 0;
  const fallidas = [];

  for (const ruta of RUTAS) {
    try {
      const res = await fetch(BASE + ruta, { redirect: "follow" });
      if (res.status === 200) { ok++; console.log(`  ✅ 200  ${ruta}`); }
      else { fail++; fallidas.push(ruta); console.log(`  ❌ ${res.status}  ${ruta}`); }
    } catch (e) { fail++; fallidas.push(ruta); console.log(`  ❌ ERR ${ruta}`); }
  }

  console.log("=".repeat(70));
  console.log(`✅ ${ok} OK · ❌ ${fail} FAIL de ${RUTAS.length} rutas`);
  if (fallidas.length) console.log("Fallidas:", fallidas.join(", "));
  process.exit(fail > 0 ? 1 : 0);
}
main();
