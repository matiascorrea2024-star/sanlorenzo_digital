// scripts/theme-audit.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const OUT = '.audit/theme';
mkdirSync(OUT, { recursive: true });

// Home + páginas marcadas como sospechosas de romper en tema claro
// (HANDOFF.md §7: feed, reels, ranking; más las que confirmamos rotas
// en este batch: home, radar, promociones, vecinos).
const ROUTES = [
  '/', '/feed', '/reels', '/ranking', '/radar', '/promociones', '/vecinos',
  '/buscar', '/negocios',
];

const b = await chromium.launch();
for (const route of ROUTES) {
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    const slug = route === '/' ? 'home' : route.replaceAll('/', '_');

    // Dark (default del sitio)
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${slug}--dark.png`, fullPage: true });

    // Light
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${slug}--light.png`, fullPage: true });

    console.log(`✓ ${route}`);
  } catch (err) {
    console.error(`✗ ${route}: ${err.message}`);
  } finally {
    await page.close();
  }
}
await b.close();
console.log(`\nCapturas en ${OUT}/`);
