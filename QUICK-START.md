# 🚀 QUICK START - VALIDAR QUE TODO FUNCIONA

**Para usuarios no-técnicos: Copiar-pegar directamente en terminal**

---

## PASO 1: Verificar Build Local (opcional, solo si querés)

```bash
cd /home/matias/Escritorio/Proyectos/SanLorenzo/sanlorenzo_digital
npm run build
```

**Deberías ver:** `Compiled successfully ✓`

---

## PASO 2: Ver el Deploy en Vivo (PRINCIPAL)

**En tu navegador, abre:**
```
https://sanlorenzodigital.vercel.app/planes
```

**Deberías ver:**
- ✅ Página de planes cargando
- ✅ 4 tarjetas: Gratis, Plus, PRO, Destacado Semanal
- ✅ Precios visibles: $0, $4.900, $9.900, $19.900

---

## PASO 3: Verificar que la Seguridad Funciona

```bash
# Copiar y pegar esto en terminal:
curl -I https://sanlorenzodigital.vercel.app 2>/dev/null | head -20
```

**Deberías ver:** Headers con `x-frame-options` y `content-security-policy`

(Si no aparecen, espera 5 minutos más - Vercel está redeployando)

---

## PASO 4: Validar JSON-LD (SEO)

1. **Ir a:** https://sanlorenzodigital.vercel.app/negocio/[cualquier-negocio]
   - Ej: cambiar [cualquier-negocio] por un slug real (buscar en BD o en home)

2. **Abrir DevTools** (F12 en el navegador)

3. **Ctrl+F** y buscar: `LocalBusiness`

**Deberías ver:** Un script con `@type: LocalBusiness`

---

## PASO 5: Probar Flujo de Pago (IMPORTANTE)

1. **Loguearte como comercio** en https://sanlorenzodigital.vercel.app/login

2. **Ir a:** /dashboard/planes

3. **Clickear:** "Quiero PRO Comerciante" (botón amarillo)

4. **Se abre Mercado Pago Checkout** 
   - ✅ Si abre: webhook está funcionando
   - ❌ Si no abre: error de configuración

5. **Para pagar en sandbox (test):**
   - Usa tarjeta: 4111 1111 1111 1111
   - Expira: 11/25
   - CVV: 123

**Después del pago:**
- Verás: "¡Pago exitoso!" o similar
- El webhook se activará automáticamente
- Plan debería estar aplicado a tu negocio

---

## PASO 6: Validar que el Webhook Funcionó

Después de "pagar" (o en ~30 seg):

1. **Ir a:** /dashboard/mis-negocios

2. **Clickear en tu negocio**

3. **Verificar:** Debería mostrar plan = "PRO Comerciante"

4. **Fecha de vencimiento:** HOY + 30 días

**Si no ves cambios:**
- Espera 2-3 minutos más
- Refresh (F5) la página
- Si sigue sin cambiar: Revisar logs de Vercel

---

## PASO 7: Ejecutar Script de Validación

```bash
# Copiar y pegar:
bash /home/matias/Escritorio/Proyectos/SanLorenzo/sanlorenzo_digital/validate-deploy.sh
```

**Esperado:** 8 checks con ✓ (algunos pueden tener ⚠ si Vercel aún está deployando)

---

## ✅ CHECKLIST FINAL

- [ ] Planes carga: https://sanlorenzodigital.vercel.app/planes
- [ ] Headers presentes: `curl -I` muestra CSP
- [ ] JSON-LD existe: DevTools busca "LocalBusiness"
- [ ] Webhook funciona: Pago → plan se aplica
- [ ] Validación script: `validate-deploy.sh` ejecuta
- [ ] Seguridad OK: X-Frame-Options presente

---

## 🆘 SI ALGO NO FUNCIONA

### Headers (CSP) no aparecen
**Solución:** Esperar 5-10 minutos. Vercel está aplicando next.config.ts

### Webhook no aplica plan
**Verificar:**
```bash
# En Vercel Settings → Environment Variables
# Debe estar:
# - MP_ACCESS_TOKEN ✅
# - MP_WEBHOOK_SECRET ✅
# - SUPABASE_SERVICE_ROLE_KEY ✅
# - RESEND_API_KEY ✅
```

Si falta alguno: Vercel Dashboard → Settings → Environment Variables

### Pago abre pero no se procesa
**Revisar:** https://vercel.com/[proyecto]/deployments
- Debe estar "Ready" (verde)
- Si está "Building", esperar

### "Error 500" en checkout
**Revisar logs:**
```bash
vercel logs --follow
```

---

## 📞 SOPORTE

Para problemas:

1. **Ver ANALISIS-COMPLETO.md** - Explicación técnica completa
2. **Ver DEPLOY-GUIDE.md** - Paso a paso detallado
3. **Ver validate-deploy.sh** - Script de diagnóstico

---

**¡LISTO! Si todos los checks pasaron, estás 9.5/10** 💯
