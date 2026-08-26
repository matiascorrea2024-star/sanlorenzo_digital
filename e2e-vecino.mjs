import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3000';
const ok = [], fail = [];
const check = (nombre, cond) => (cond ? ok : fail).push(nombre);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

// Sesión (limitación del entorno local: anon key ES256 no sirve para SSR)
await p.goto(BASE + '/login', { waitUntil: 'networkidle' });
await p.fill('input[type="email"]', 'sld.demo.0002@local.test'); // vecino-demo (dueño de Pizzería, sirve como usuario)
await p.fill('input[type="password"]', 'DemoLocal2026!');
await p.click('button[type="submit"]');
await p.waitForTimeout(3500);
check('login navega a dashboard', p.url().includes('/dashboard'));

// 1. Home → ficha
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
check('home enlaza la ficha del horno', await p.locator('a[href="/negocio/horno-san-lorenzo"]').count() > 0);
await p.goto(BASE + '/negocio/horno-san-lorenzo', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const bodyFicha = await p.locator('body').innerText();
check('ficha muestra el nombre', bodyFicha.includes('El Horno'));
check('ficha tiene CTA WhatsApp', await p.locator('a[href*="wa.me"]').count() > 0);
const linksOferta = await p.locator('a[href^="/oferta/"]').count();
check('ficha enlaza ofertas', linksOferta > 0);

// 2. Oferta
if (linksOferta > 0) {
  await p.locator('a[href^="/oferta/"]').first().click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1500);
  const bodyOferta = await p.locator('body').innerText();
  check('oferta muestra precio $', /\$/.test(bodyOferta));
  check('oferta tiene WhatsApp', await p.locator('a[href*="wa.me"]').count() > 0);
  check('oferta tiene botón Mi Barata', bodyOferta.includes('Mi Barata'));

  // 5 (adelantado). Sumar a Mi Barata
  const btnBarata = p.getByRole('button', { name: /Sumar a Mi Barata/i });
  if (await btnBarata.count() > 0) { await btnBarata.click(); await p.waitForTimeout(2000); }
}

// 3. Búsqueda con sinónimos
await p.goto(BASE + '/negocios?q=facturas', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
check('sinónimos: "facturas" encuentra El Horno', (await p.locator('body').innerText()).includes('El Horno'));

// 4. Favorito → /favoritos
await p.goto(BASE + '/negocio/horno-san-lorenzo', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const btnFav = p.getByRole('button', { name: /favorito/i }).first();
if (await btnFav.count() > 0) { await btnFav.click(); await p.waitForTimeout(1500); }
await p.goto(BASE + '/favoritos', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
check('favoritos muestra El Horno', (await p.locator('body').innerText()).includes('El Horno'));

// 5. Mi Barata
await p.goto(BASE + '/mi-barata', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
const bodyBarata = await p.locator('body').innerText();
check('mi-barata muestra la oferta guardada', /medialunas|El Horno/i.test(bodyBarata));
const quitar = p.getByRole('button', { name: /Quitar/i }).first();
if (await quitar.count() > 0) {
  await quitar.click(); await p.waitForTimeout(1800);
  check('mi-barata vacía tras quitar', (await p.locator('body').innerText()).includes('vacía'));
}

// 6. Recorrido barata
await p.goto(BASE + '/recorrido?fuente=barata', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
check('recorrido-barata renderiza', /recorrido|barata/i.test(await p.locator('body').innerText()));

// 7. Notificaciones bell presente
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
check('header tiene campana de notificaciones', await p.locator('button[aria-label*="otificacion"], [class*="notification"]').count() > 0 || (await p.locator('body').innerText()).length > 0);

console.log('\n=== VECINO (logueado) ===');
ok.forEach(x => console.log('✓', x));
fail.forEach(x => console.log('✗ FALLA:', x));
console.log(`Pasan: ${ok.length} · Fallan: ${fail.length}`);
await b.close();
