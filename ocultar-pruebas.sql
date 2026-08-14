-- ============================================
-- OCULTAR NEGOCIOS DE PRUEBA DE LA VISTA PÚBLICA
-- Ejecutar en Supabase SQL Editor (no en terminal)
-- ============================================
UPDATE businesses 
SET activo = false 
WHERE 
  name ILIKE '%PRUEBA%' 
  OR name ILIKE '%Matias2%' 
  OR name ILIKE '%La Prueba%'
  OR name ILIKE '%Test%'
  OR name ILIKE '%demo%';

-- Verificar qué quedó visible
SELECT name, status, activo FROM businesses WHERE activo = true ORDER BY name;
