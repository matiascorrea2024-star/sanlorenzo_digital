import { chromium } from 'playwright';

const OFERTA_ID = '3e82cd36-b25a-479f-a1d2-d9fead70d8d8'; // medialunas (seed)
const RUTAS = [
  // Públicas
  ['/', 'home'],
  ['/negocios', 'negocios'],
  ['/negocios?q=cafe', 'negocios-q'],
  ['/promociones', 'promociones'],
  ['/para-vos', 'para-vos'],
  ['/buscar', 'buscar'],
  ['/negocio/horno-san-lorenzo', 'ficha-negocio'],
  ['/negocio/horno-san-lorenzo/tv', 'modo-tv'],
  [`/oferta/${OFERTA_ID}`, 'oferta'],
  ['/mapa', 'mapa'],
  ['/ranking', 'ranking'],
  ['/reels', 'reels'],
  ['/en-vivo', 'en-vivo'],
  ['/feed', 'feed'],
  ['/comunidad', 'comunidad'],
  ['/pulso', 'pulso'],
  ['/radar', 'radar'],
  ['/vecinos', 'vecinos'],
  ['/planes', 'planes'],
  ['/favoritos', 'favoritos'],
  ['/mensajes', 'mensajes'],
  ['/pedidos', 'pedidos'],
  ['/comparar', 'comparar'],
  ['/invitar', 'invitar'],
  ['/onboarding', 'onboarding'],
  ['/login', 'login'],
  ['/registro', 'registro'],
  ['/reset-password', 'reset'],
  ['/terminos', 'terminos'],
  ['/privacidad', 'privacidad'],
  ['/para-negocios', 'para-negocios'],
  ['/portuario', 'portuario'],
  ['/b2b', 'b2b'],
  ['/asistente', 'asistente'],
  ['/ofertas-finalizadas', 'ofertas-finalizadas'],
  ['/mi-barata', 'mi-barata'],
  ['/recorrido', 'recorrido'],
  ['/recorrido?fuente=barata', 'recorrido-barata'],
  ['/blog', 'blog'],
  ['/sumate', 'sumate'],
  ['/particulares', 'particulares'],
  // Autenticadas
  ['/dashboard', 'dashboard'],
  ['/dashboard/ofertas', 'dash-ofertas'],
  ['/dashboard/ofertas/nueva', 'dash-oferta-nueva'],
  [`/dashboard/ofertas/${OFERTA_ID}/editar`, 'dash-oferta-editar'],
  ['/dashboard/productos', 'dash-productos'],
  ['/dashboard/resenas', 'dash-resenas'],
  ['/dashboard/mensajes', 'dash-mensajes'],
  ['/dashboard/seguidores', 'dash-seguidores'],
  ['/dashboard/sellos', 'dash-sellos'],
  ['/dashboard/turnos', 'dash-turnos'],
  ['/dashboard/historias', 'dash-historias'],
  ['/dashboard/reels', 'dash-reels'],
  ['/dashboard/en-vivo', 'dash-envivo'],
  ['/dashboard/muro', 'dash-muro'],
  ['/dashboard/planes', 'dash-planes'],
  ['/dashboard/analytics', 'dash-analytics'],
  ['/dashboard/soporte', 'dash-soporte'],
  ['/dashboard/asistente', 'dash-asistente'],
  ['/dashboard/editar/horno-san-lorenzo', 'dash-editar'],
  ['/perfil', 'perfil'],
  ['/admin', 'admin-sin-permiso'],
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

// Login primero
await p.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle' });
await p.fill('input[type="email"]', 'sld.demo.0001@local.test');
await p.fill('input[type="password"]', 'DemoLocal2026!');
await p.click('button[type="submit"]');
await p.waitForTimeout(3500);
console.log('LOGIN →', p.url().replace('http://127.0.0.1:3000','') || '/');

const resultados = [];
for (const [ruta, nombre] of RUTAS) {
  const consola = [], paginas = [], rotos = [];
  const onConsole = m => { if (m.type() === 'error') consola.push(m.text().slice(0,120)); };
  const onPageError = e => paginas.push(String(e).slice(0,120));
  const onResp = r => { if (r.status() >= 400) rotos.push(r.status() + ' ' + r.url().replace('http://127.0.0.1:3000','').slice(0,80)); };
  p.on('console', onConsole); p.on('pageerror', onPageError); p.on('response', onResp);
  let status = '?';
  try {
    const resp = await p.goto('http://127.0.0.1:3000' + ruta, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : '?';
    await p.waitForTimeout(900);
    const texto = await p.locator('body').innerText().catch(() => '');
    const es404 = /no existe|no encontrada|404/i.test(texto.slice(0, 600)) && !/negocio/i.test(ruta);
    resultados.push({ nombre, ruta, status, es404, consola: consola.filter(c => !/Google Analytics|GA_ID|hmr|websocket/i.test(c)), paginas, rotos: rotos.filter(r => !/hmr/i.test(r)) });
  } catch (e) {
    resultados.push({ nombre, ruta, status: 'TIMEOUT/ERR', es404: false, consola: [], paginas: [String(e).slice(0,80)], rotos: [] });
  }
  p.off('console', onConsole); p.off('pageerror', onPageError); p.off('response', onResp);
}
await b.close();

let problemas = 0;
for (const r of resultados) {
  const flags = [];
  if (r.es404) flags.push('CONTENIDO-404');
  if (r.paginas.length) flags.push(`JS-ERR(${r.paginas.length})`);
  if (r.rotos.length) flags.push(`4XX(${r.rotos.length})`);
  if (r.consola.length) flags.push(`console(${r.consola.length})`);
  const ok = flags.length === 0 && String(r.status)[0] === '2';
  if (!ok) problemas++;
  console.log(`${ok ? '✓' : '✗'} ${r.status} ${r.nombre} ${flags.join(' ')}`);
  if (r.paginas.length) console.log('   PAGEERR:', r.paginas.slice(0,2).join(' | '));
  if (r.rotos.length) console.log('   ROTOS:', r.rotos.slice(0,3).join(' | '));
  if (r.consola.length) console.log('   CONSOLA:', r.consola.slice(0,2).join(' | '));
}
console.log(`\nTotal rutas: ${resultados.length} · con problemas: ${problemas}`);
