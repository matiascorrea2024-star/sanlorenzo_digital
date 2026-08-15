// Smoke test: verifica que las rutas críticas respondan 200 en producción.
// Uso: node scripts/smoke-test.mjs [BASE_URL]
// No depende de datos concretos (slugs de negocios, ofertas, etc.) --
// solo prueba rutas estáticas y de shell que siempre deben resolver,
// más /san-lorenzo (ciudad real sembrada en la Fase 5).

const BASE = process.argv[2] || "https://sanlorenzodigital.vercel.app";

const RUTAS = [
  "/", "/negocios", "/promociones", "/ofertas-finalizadas", "/mapa", "/ranking",
  "/vecinos", "/radar", "/feed", "/buscar", "/comparar", "/asistente",
  "/planes", "/para-negocios", "/b2b", "/portuario", "/blog",
  "/san-lorenzo", "/san-lorenzo/centro",
  "/login", "/registro", "/invitar",
  "/sitemap.xml", "/robots.txt", "/manifest.webmanifest",
  "/privacidad", "/terminos",
];

async function main() {
  console.log("🧪 SMOKE TEST → " + BASE);
  console.log("=".repeat(60));
  let ok = 0, fail = 0;
  const fallidas = [];

  for (const ruta of RUTAS) {
    try {
      const res = await fetch(BASE + ruta, { redirect: "follow" });
      if (res.status === 200) { ok++; console.log(`  ✅ 200  ${ruta}`); }
      else { fail++; fallidas.push(ruta); console.log(`  ❌ ${res.status}  ${ruta}`); }
    } catch (e) {
      fail++; fallidas.push(ruta);
      console.log(`  ❌ ERR ${ruta} (${e instanceof Error ? e.message : e})`);
    }
  }

  console.log("=".repeat(60));
  console.log(`✅ ${ok} OK · ❌ ${fail} FAIL de ${RUTAS.length} rutas`);
  if (fallidas.length) console.log("Fallidas:", fallidas.join(", "));
  process.exit(fail > 0 ? 1 : 0);
}

main();
