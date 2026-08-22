# 🚀 DEPLOYMENT CHECKLIST - San Lorenzo Digital

## ✅ PRE-DEPLOYMENT (48 HORAS ANTES)

### Code Quality
- [ ] `npm run build` compila sin warnings
- [ ] `npm run lint` sin errores
- [ ] Todos los tests pasan (`npm run test`)
- [ ] No hay `console.log` en producción
- [ ] No hay `TODO` comments críticos
- [ ] Secrets NO están en el código

### Performance
- [ ] Lighthouse Score 95+ (desktop)
- [ ] Lighthouse Score 90+ (mobile)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] No hay memory leaks (DevTools)
- [ ] Bundle size < 500KB (main)

### Security
- [ ] CSP headers implementados ✅
- [ ] HSTS headers agregados ✅
- [ ] CORS configurado correctamente
- [ ] Rate limiting en APIs ✅
- [ ] Input validation en formularios
- [ ] No hay hardcoded credentials
- [ ] Dependencias sin vulnerabilidades (`npm audit`)

### SEO & Metadata
- [ ] Meta tags en todas las páginas
- [ ] Schema.org LocalBusiness ✅
- [ ] OpenGraph tags completos
- [ ] Twitter Cards (1200x630)
- [ ] Sitemap XML
- [ ] Robots.txt
- [ ] Favicon/Apple icon

### Funcionalidad
- [ ] Auth flow completo (signup/login/logout)
- [ ] Dashboard funciona para usuario FREE
- [ ] Dashboard funciona para usuario PRO
- [ ] Mercado Pago checkout testeo
- [ ] Webhook testeo (mock)
- [ ] Newsletter signup funciona
- [ ] Contact forms funcionan
- [ ] PWA install funciona

### Responsive & Cross-browser
- [ ] Desktop 1920px
- [ ] Tablet 768px
- [ ] Mobile 375px
- [ ] Mobile 320px (edge case)
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅

### Analytics
- [ ] Google Analytics 4 configurado
- [ ] Events tracked (page view, clicks)
- [ ] Funnel tracking ready
- [ ] Error tracking ready
- [ ] Performance monitoring ready

---

## 🚀 DEPLOYMENT (HORA 0)

### Vercel / Hosting
- [ ] Domain apunta correctamente
- [ ] SSL/TLS certificate válido
- [ ] Environment variables configuradas
- [ ] Build settings correctos
- [ ] Deployment successful

### Database
- [ ] Supabase backup tomado
- [ ] RLS policies activas
- [ ] Indexes creados (performance)
- [ ] Connection pooling configurado

### Email
- [ ] Resend API key validado
- [ ] Email templates probados
- [ ] Welcome email envía correctamente
- [ ] Error emails configurados

### Pagos
- [ ] Mercado Pago conectado
- [ ] Webhook URL actualizada
- [ ] Test payment exitoso
- [ ] Error handling funciona
- [ ] Payment confirmation email envía

### Monitoring
- [ ] Sentry/error tracking configurado
- [ ] Uptime monitoring activo
- [ ] Alerts setup para errores críticos
- [ ] Performance monitoring activo
- [ ] Log aggregation configurada

---

## ✅ POST-DEPLOYMENT (PRIMERAS 24HS)

### Monitoring
- [ ] No hay errores en logs
- [ ] Performance metrics normales
- [ ] Conversion funnel está siendo tracked
- [ ] Usuarios pueden login
- [ ] Plan upgrade flow funciona

### SEO
- [ ] Google Search Console indexación
- [ ] Sitemap submitted
- [ ] Robots.txt accesible
- [ ] Structured data válido

### Marketing
- [ ] Newsletter list captured
- [ ] Referral tracking activo
- [ ] Social sharing funciona
- [ ] Email campaigns listos

### Feedback
- [ ] Customer support channel activo
- [ ] Bug report process clear
- [ ] Feedback form funciona

---

## 🎯 ROLLBACK PLAN

Si algo falla:

1. **Identify Issue** (5 min max)
   - Check logs
   - Check uptime
   - Check user reports

2. **Decide** (2 min max)
   - Minor issue → fix forward
   - Major issue → rollback

3. **Rollback** (if needed)
   ```bash
   git revert <commit>
   git push
   # Vercel auto-redeploys
   ```

4. **Communicate**
   - Status page update
   - Email to users (if affected)
   - Social media update

---

## 📊 SUCCESS METRICS (WEEK 1)

| Metric | Target | Current |
|--------|--------|---------|
| Uptime | 99.9% | ? |
| Load Time | < 2.5s | ? |
| Error Rate | < 0.1% | ? |
| Conversion Rate | 2-5% | ? |
| Newsletter Signup | 5-10% | ? |
| Support Tickets | < 5 critical | ? |

---

## 🔐 SECURITY REVIEW (FINAL)

- [ ] OWASP Top 10 review
- [ ] Penetration testing planned
- [ ] Rate limiting tested
- [ ] SQL injection prevention tested
- [ ] XSS prevention tested
- [ ] CSRF protection tested

