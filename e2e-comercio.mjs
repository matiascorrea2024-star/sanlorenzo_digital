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

// 1. Dashboard: tarjetas del negocio + QR
await p.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const dash = await p.locator('body').innerText();
check('dashboard muestra el negocio', dash.includes('El Horno'));
check('dashboard tiene sección QR de vidriera', dash.includes('QR de vidriera'));

// 2. QR: expandir y verificar generación
await p.locator('summary', { hasText: 'QR de vidriera' }).first().click();
await p.waitForTimeout(3000);
const qrImg = await p.locator('img[alt*="QR"]').count();
check('QR genera imagen', qrImg > 0);
const qrLink = dash.includes('/r/') || (await p.locator('body').innerText()).includes('/r/');
check('QR muestra link rastreable /r/', qrLink);

// 3. Ofertas: duplicar
await p.goto(BASE + '/dashboard/ofertas', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const antes = await p.locator('a[href*="/editar"], button:has-text("⋯")').count();
const masBtn = p.locator('summary', { hasText: 'Más' }).first();
if (await masBtn.count() > 0) {
  await masBtn.click();
  await p.waitForTimeout(600);
  const dup = p.getByRole('button', { name: /Duplicar/i }).first();
  if (await dup.count() > 0) {
    await dup.click();
    await p.waitForTimeout(2500);
    const despues = await p.locator('body').innerText();
    check('duplicar muestra confirmación', /copia|duplic/i.test(despues));
    check('ahora hay 2 ofertas (INACTIVA visible)', despues.includes('INACTIVA'));
  } else fail.push('no apareció el botón Duplicar');
} else fail.push('no apareció el menú ⋯ Más');

// 4. Crear oferta nueva
await p.goto(BASE + '/dashboard/ofertas/nueva', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const form = await p.locator('body').innerText();
check('form nueva oferta carga', /título|titulo|oferta/i.test(form));

// 5. Editar horarios: abrir editor, apagar domingo, guardar
await p.goto(BASE + '/dashboard/editar/horno-san-lorenzo', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const domCheckbox = p.locator('label:has-text("Domingo") input[type="checkbox"]').first();
if (await domCheckbox.count() > 0) {
  const estaba = await domCheckbox.isChecked();
  await domCheckbox.setChecked(false);
  await p.waitForTimeout(400);
  const guardar = p.getByRole('button', { name: /guardar/i }).first();
  if (await guardar.count() > 0) {
    await guardar.click();
    await p.waitForTimeout(2500);
    check('guardar edición muestra confirmación', /guardado|actualiz/i.test(await p.locator('body').innerText()));
  } else fail.push('no encontré botón Guardar');
  // restaurar domingo
  await domCheckbox.setChecked(estaba);
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /guardar/i }).first().click();
  await p.waitForTimeout(2000);
} else fail.push('no encontré el checkbox de Domingo (editor horarios)');

// 6. Perfil carga
await p.goto(BASE + '/perfil', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
check('perfil carga con sesión', /perfil|cuenta|mi\s/i.test(await p.locator('body').innerText()));

console.log('\n=== COMERCIANTE ===');
ok.forEach(x => console.log('✓', x));
fail.forEach(x => console.log('✗ FALLA:', x));
console.log(`Pasan: ${ok.length} · Fallan: ${fail.length}`);
await b.close();
