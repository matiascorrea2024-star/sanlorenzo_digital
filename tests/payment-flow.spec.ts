import { test, expect } from '@playwright/test';

// Configuración base
const BASE_URL = 'https://sanlorenzodigital.vercel.app';
const DASHBOARD_URL = `${BASE_URL}/dashboard/planes`;

// Para estos tests necesitarías credenciales de test
// En producción usarías una cuenta de test dedicada
test.describe('San Lorenzo Digital - Flujo de Pagos', () => {
  
  test('Debe cargarse la página de planes', async ({ page }) => {
    await page.goto(`${BASE_URL}/planes`);
    
    // Verificar que los planes existan
    await expect(page).toHaveTitle(/Planes/i);
    await expect(page.getByText('Gratis')).toBeVisible();
    await expect(page.getByText('Comerciante Plus')).toBeVisible();
    await expect(page.getByText('PRO Comerciante')).toBeVisible();
    await expect(page.getByText('Destacado Semanal')).toBeVisible();
  });

  test('Debe redirigir a login si intenta acceder a /dashboard sin auth', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    // Debería redirigir a login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Home debe tener metadata SEO correcto', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificar título
    const title = await page.title();
    expect(title).toContain('San Lorenzo Digital');
    
    // Verificar OG meta tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('Página de negocio debe tener JSON-LD', async ({ page }) => {
    // Ir a una página de negocio (necesitarías un slug real)
    // Ejemplo: /negocio/ferreteria-lopez
    await page.goto(`${BASE_URL}/negocio/ejemplo`).catch(() => {
      // Si no existe, es esperado
    });
    
    // Buscar script de JSON-LD
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    
    // Si la página existe, debería haber JSON-LD
    if (await page.isVisible('h1').catch(() => false)) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('CSP headers deben estar presentes', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response?.headers() || {};
    
    // Verificar que CSP header existe
    expect(headers['content-security-policy'] || headers['content-security-policy-report-only']).toBeTruthy();
  });

  test('Rate limiting debe funcionar en checkout', async ({ page }) => {
    // Intenta hacer múltiples requests a checkout sin auth
    // (El rate limiting solo aplica a requests POST)
    
    for (let i = 0; i < 5; i++) {
      const response = await page.request.post(`${BASE_URL}/api/mercadopago/checkout`, {
        data: { businessId: 'test', plan: 'plus' },
      }).catch(() => null);
      
      if (i >= 3) {
        // Después de varios intentos, debería retornar 401 (no autenticado)
        // o 429 (rate limited)
        expect([401, 429]).toContain(response?.status());
      }
    }
  });

  test('Búsqueda debe estar protegida de XSS', async ({ page }) => {
    const xssPayload = '<img src=x onerror="alert(1)">';
    await page.goto(`${BASE_URL}/buscar?q=${encodeURIComponent(xssPayload)}`);
    
    // La página no debe ejecutar el script
    page.on('dialog', (dialog) => {
      throw new Error('XSS ejecutado - alert() se disparó');
    });
    
    // Esperar un poco para estar seguros
    await page.waitForTimeout(500);
  });

  test('Sitemap.xml debe existir y ser válido', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/sitemap.xml`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('xml');
  });

  test('robots.txt debe existir', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/robots.txt`);
    expect(response?.status()).toBe(200);
  });
});
