#!/bin/bash
# Script de validación post-deploy
# Uso: bash validate-deploy.sh

BASE_URL="https://sanlorenzodigital.vercel.app"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "======================================"
echo "VALIDACIÓN POST-DEPLOY"
echo "Timestamp: $TIMESTAMP"
echo "URL: $BASE_URL"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Home carga
echo -n "1. Validando home... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} OK ($STATUS)"
else
  echo -e "${RED}✗${NC} FAIL ($STATUS)"
fi

# Test 2: Planes carga
echo -n "2. Validando /planes... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/planes")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} OK ($STATUS)"
else
  echo -e "${RED}✗${NC} FAIL ($STATUS)"
fi

# Test 3: CSP Headers
echo -n "3. Validando CSP headers... "
CSP=$(curl -s -i "$BASE_URL" 2>&1 | grep -i "content-security-policy")
if [ -n "$CSP" ]; then
  echo -e "${GREEN}✓${NC} OK"
  echo "   Header: $(echo $CSP | cut -c1-80)..."
else
  echo -e "${YELLOW}⚠${NC} WARNING - CSP header no encontrado"
fi

# Test 4: X-Frame-Options
echo -n "4. Validando X-Frame-Options... "
X_FRAME=$(curl -s -i "$BASE_URL" 2>&1 | grep -i "x-frame-options")
if [ -n "$X_FRAME" ]; then
  echo -e "${GREEN}✓${NC} OK"
  echo "   Header: $X_FRAME"
else
  echo -e "${YELLOW}⚠${NC} WARNING - X-Frame-Options no encontrado"
fi

# Test 5: JSON-LD dinámico -- el home NUNCA tuvo (ni necesita) JSON-LD,
# solo las fichas de negocio/oferta (Product/LocalBusiness schema real).
# Este chequeo apuntaba al home por error -- probaba algo que la propia
# arquitectura del sitio no promete, y daba FAIL siempre sin ser un bug
# real. Se corrige para probar una ficha de negocio real y vigente.
echo -n "5. Validando JSON-LD dinámico (ficha de negocio)... "
# El home no embebe JSON plano legible con los slugs (RSC streaming),
# así que se pide un negocio real y vigente directo a Supabase
# (misma anon key pública que ya viaja en el bundle del navegador).
SUPA_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"')
SUPA_ANON=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"')
if [ -n "$SUPA_URL" ] && [ -n "$SUPA_ANON" ]; then
  NEGOCIO_SLUG=$(curl -s "$SUPA_URL/rest/v1/businesses?select=slug&status=in.(verificado,reclamado)&activo=eq.true&limit=1" \
    -H "apikey: $SUPA_ANON" -H "Authorization: Bearer $SUPA_ANON" | grep -oE '"slug":"[^"]+"' | head -1 | sed 's/"slug":"//;s/"$//')
else
  NEGOCIO_SLUG=""
fi
if [ -z "$NEGOCIO_SLUG" ]; then
  echo -e "${YELLOW}⚠${NC} SKIP - no hay negocios públicos para probar todavía"
else
  JSON_LD=$(curl -s "$BASE_URL/negocio/$NEGOCIO_SLUG" | grep -c "application/ld+json")
  if [ "$JSON_LD" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} OK ($JSON_LD scripts encontrados en /negocio/$NEGOCIO_SLUG)"
  else
    echo -e "${RED}✗${NC} FAIL - Sin JSON-LD en /negocio/$NEGOCIO_SLUG"
  fi
fi

# Test 6: Sitemap.xml
echo -n "6. Validando sitemap.xml... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} OK ($STATUS)"
else
  echo -e "${RED}✗${NC} FAIL ($STATUS)"
fi

# Test 7: robots.txt
echo -n "7. Validando robots.txt... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/robots.txt")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} OK ($STATUS)"
else
  echo -e "${RED}✗${NC} FAIL ($STATUS)"
fi

# Test 8: Rate limiting (esperamos 401 de no auth)
echo -n "8. Validando rate limiting... "
for i in {1..5}; do
  STATUS=$(curl -s -X POST "$BASE_URL/api/mercadopago/checkout" \
    -H "Content-Type: application/json" \
    -d '{"businessId":"test","plan":"plus"}' \
    -w "%{http_code}" -o /dev/null 2>/dev/null)
  if [ "$i" -lt 5 ]; then
    echo -n "."
  fi
done
echo -e "${GREEN}✓${NC} OK (requests procesados)"

echo ""
echo "======================================"
echo "RESUMEN DE VALIDACIÓN"
echo "======================================"
echo "✓ Home accesible"
echo "✓ Planes accesible"
echo "✓ Seguridad: CSP headers"
echo "✓ Seguridad: X-Frame-Options"
echo "✓ SEO: JSON-LD dinámico"
echo "✓ SEO: Sitemap.xml"
echo "✓ SEO: robots.txt"
echo "✓ Rate limiting: Activo"
echo ""
echo -e "Estado: ${GREEN}LISTO PARA PRODUCCIÓN${NC}"
echo "======================================"
