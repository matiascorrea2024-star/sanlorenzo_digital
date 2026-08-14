// Smoke test: verifica que las rutas críticas respondan 200 en producción
// Uso: node scripts/smoke-test.mjs [BASE_URL]

const BASE = process.argv[2] || "https://sanlorenzodigital.vercel.app";

const RUTAS = [
  "/", "/negocios", "/promociones", "/mapa", "/ranking", "/radar",
  "/listas", "/categoria/calzado", "/categoria/gastronomia", "/san-lorenzo",
  "/san-lorenzo/centro", "/planes", "/asistente", "/login", "/registro",
  "/sitemap.xml", "/robots.txt", "/negocio/almendra-calzados",
];

async function main() {
  console.log("🧪 SMOKE TEST → " + BASE);
  console.log("=".repeat(60));
  let ok = 0, fail = 0;

  for (const ruta of RUTAS) {
    try {
      const res = await fetch(BASE + ruta, { redirect: "follow" });
      const status = res.status;
      if (status === 200) {
        ok++;
        console.log(`  ✅ 200  ${ruta}`);
      } else {
        fail++;
        console.log(`  ❌ ${status}  ${ruta}`);
      }
    } catch (e) {
      fail++;
      console.log(`  ❌ ERR ${ruta} (${e.message})`);
    }
  }

  console.log("=".repeat(60));
  console.log(`✅ ${ok} OK · ❌ ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
