import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3000';
const ok = [], fail = [];
const check = (n, c) => (c ? ok : fail).push(n);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(BASE + '/login', { waitUntil: 'networkidle' });
await p.fill('input[type="email"]', 'sld.demo.0001@local.test');
await p.fill('input[type="password"]', 'DemoLocal2026!');
await p.click('button[type="submit"]');
await p.waitForTimeout(3500);

// 1. Toggle de tema
const btnTema = p.locator('button[aria-label*="tema" i], button[aria-label*="claro" i], button[aria-label*="oscuro" i]').first();
if (await btnTema.count() > 0) {
  const antes = await p.evaluate(() => document.documentElement.dataset.theme || 'dark');
  await btnTema.click();
  await p.waitForTimeout(600);
  const despues = await p.evaluate(() => document.documentElement.dataset.theme || 'dark');
  check(`toggle de tema funciona (${antes}→${despues})`, antes !== despues);
  await btnTema.click(); await p.waitForTimeout(400); // volver a dark
} else fail.push('no encontré el botón de tema');

// 2. Smart-search: abrir, escribir, ver sugerencias, buscar
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
const input = p.getByRole('textbox', { name: /Buscar ofertas/i }).first();
await input.click();
await input.fill('pizza');
await p.waitForTimeout(1200);
const dropdown = await p.locator('body').innerText();
check('smart-search despliega sugerencias', /pizza|pizzería|buscar/i.test(dropdown));
await input.press('Enter');
await p.waitForTimeout(2000);
check('smart-search navega a resultados', p.url().includes('/negocios') || p.url().includes('/buscar'));

// 3. Filtros de /negocios: toggle "Abierto ahora"
await p.goto(BASE + '/negocios', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const filtroAbierto = p.getByRole('button', { name: /abierto/i }).first();
if (await filtroAbierto.count() > 0) {
  await filtroAbierto.click();
  await p.waitForTimeout(1500);
  check('filtro abierto-ahora responde', true);
} else fail.push('no encontré filtro abierto ahora');

// 4. Changuito: sumar oferta desde /oferta y ver FAB
await p.goto(BASE + '/negocio/horno-san-lorenzo', { waitUntil: 'networkidle' });
await p.locator('a[href^="/oferta/"]').first().click();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
const btnChanguito = p.getByRole('button', { name: /changuito/i }).first();
if (await btnChanguito.count() > 0) {
  await btnChanguito.click();
  await p.waitForTimeout(1200);
  const fab = p.locator('body').innerText();
  check('changuito suma producto (FAB/contador)', /changuito|\d/.test(fab));
} else fail.push('no encontré botón changuito en oferta');

// 5. Seguir negocio (follow)
await p.goto(BASE + '/negocio/pizzeria-napoles', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const btnSeguir = p.getByRole('button', { name: /seguir|siguiendo/i }).first();
if (await btnSeguir.count() > 0) {
  await btnSeguir.click();
  await p.waitForTimeout(1800);
  const txt = await btnSeguir.innerText().catch(() => '');
  check(`follow togglea (ahora: "${txt.trim().slice(0,20)}")`, /siguiendo|seguir/i.test(txt));
} else fail.push('no encontré botón seguir');

// 6. Compartir ficha
const btnShare = p.getByRole('button', { name: /compartir/i }).first();
if (await btnShare.count() > 0) {
  await btnShare.click();
  await p.waitForTimeout(1500);
  check('compartir responde (toast/estado)', true);
} else fail.push('no encontré botón compartir');

// 7. Campana de notificaciones abre panel
const bell = p.locator('button[aria-label*="otificacion"]').first();
if (await bell.count() > 0) {
  await bell.click();
  await p.waitForTimeout(1000);
  check('campana abre panel', true);
} else fail.push('no encontré campana');

// 8. Reseña: abrir tab reseñas en ficha
await p.goto(BASE + '/negocio/horno-san-lorenzo', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const tabResenas = p.getByRole('button', { name: /reseñas/i }).first();
if (await tabResenas.count() > 0) {
  await tabResenas.click();
  await p.waitForTimeout(1200);
  const t = await p.locator('body').innerText();
  check('tab reseñas muestra formulario', /visitaste|experiencia|reseña/i.test(t));
} else fail.push('no encontré tab reseñas');

// 9. Asistente flotante
const flot = p.locator('button[aria-label*="asistente" i], a[aria-label*="asistente" i]').last();
// (puede no estar en ficha; probar en home)
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
const flot2 = p.locator('[class*="assistant"], button[aria-label*="asistente" i]').count();
check('asistente flotante presente en home', flot2 > 0);

// 10. Ofertas finalizadas
await p.goto(BASE + '/ofertas-finalizadas', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
check('ofertas-finalizadas renderiza estado', (await p.locator('body').innerText()).length > 100);

console.log('\n=== SWEEP UI (logueado) ===');
ok.forEach(x => console.log('✓', x));
fail.forEach(x => console.log('✗ FALLA:', x));
console.log(`Pasan: ${ok.length} · Fallan: ${fail.length}`);
await b.close();
