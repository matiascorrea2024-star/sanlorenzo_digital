import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(BASE + '/login', { waitUntil: 'networkidle' });
await p.fill('input[type="email"]', 'sld.demo.0002@local.test');
await p.fill('input[type="password"]', 'DemoLocal2026!');
await p.click('button[type="submit"]');
await p.waitForTimeout(3000);

// Capturar la query REST real de /negocios?q=facturas
p.on('request', r => { if (r.url().includes('businesses') && r.url().includes('ilike')) console.log('QUERY:', decodeURIComponent(r.url()).slice(0, 300)); });
p.on('response', async r => {
  if (r.url().includes('businesses') && r.url().includes('ilike')) {
    console.log('STATUS:', r.status(), '| BODY:', (await r.text().catch(()=>'' )).slice(0, 200));
  }
});
await p.goto(BASE + '/negocios?q=facturas', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log('BODY>>>', (await p.locator('body').innerText()).replace(/\n+/g,' | ').slice(0, 300));

// Mi Barata: estado y quitar
await p.goto(BASE + '/mi-barata', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
console.log('BARATA>>>', (await p.locator('body').innerText()).replace(/\n+/g,' | ').slice(0, 250));
const quitar = p.getByRole('button', { name: /Quitar/i }).first();
console.log('botones quitar:', await quitar.count());
if (await quitar.count() > 0) {
  await quitar.click();
  await p.waitForTimeout(2000);
  console.log('DESPUES>>>', (await p.locator('body').innerText()).replace(/\n+/g,' | ').slice(0, 200));
}
await b.close();
