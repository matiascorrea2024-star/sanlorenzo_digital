import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3000';
const ok = [], fail = [];
const check = (n, c) => (c ? ok : fail).push(n);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

await p.goto(BASE + '/registro', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
// completar el form de registro
const email = `qa.test.${Date.now()}@local.test`;
await p.fill('input[type="email"]', email);
await p.fill('input[type="password"]', 'QaTest2026!x');
// puede haber selector de rol o nombre
const nombre = p.locator('input[name="name"], input[placeholder*="ombre"]').first();
if (await nombre.count() > 0) await nombre.fill('QA Tester');
await p.click('button[type="submit"]');
await p.waitForTimeout(4500);
const url = p.url().replace(BASE, '');
const body = await p.locator('body').innerText();
check('registro navega tras enviar', url !== '/registro' || /onboarding|bienvenid|dashboard|verific/i.test(body));
console.log('URL tras registro:', url);
console.log('BODY:', body.replace(/\n+/g,' | ').slice(0, 200));
ok.forEach(x => console.log('✓', x));
fail.forEach(x => console.log('✗ FALLA:', x));
await b.close();
