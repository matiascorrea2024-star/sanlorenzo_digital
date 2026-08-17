-- Impulsar una oferta puntual por 24-48hs: puerta de entrada más chica
-- y barata que un plan completo -- el negocio paga solo por esa
-- oferta, no por el negocio entero. Por ahora lo otorga un admin
-- (mismo criterio manual que ya usa Destacado Semanal, negociado por
-- WhatsApp) -- el flujo de pago autoservicio queda para más adelante.
alter table offers add column if not exists impulsada_hasta timestamptz;

-- La vista offers_with_business tenía columnas explícitas (no select *)
-- así que impulsada_hasta y los campos de oferta grupal (agregados en
-- la migración anterior) no llegaban a Radar/Promociones, que leen de
-- acá -- sin esto, esas páginas no podían ordenar por impulso ni
-- mostrar el estado de una oferta grupal.
create or replace view offers_with_business as
select
  o.id, o.business_id, o.title, o.product, o.old_price, o.offer_price,
  o.discount_percent, o.image_url, o.whatsapp, o.valid_until, o.active,
  o.created_at,
  b.name as business_name, b.slug as business_slug, b.category as business_category,
  b.portada_url as business_portada, b.logo_url as business_logo,
  b.whatsapp as business_whatsapp, b.instagram as business_instagram,
  b.address as business_address, b.latitude as business_latitude, b.longitude as business_longitude,
  o.es_bomba, o.precio_prometido,
  b.destacado as business_destacado, b.plan as business_plan, b.rating as business_rating,
  b.status as business_status,
  o.impulsada_hasta, o.es_grupal, o.meta_participantes, o.grupal_activada
from offers o
left join businesses b on o.business_id = b.id
where o.active = true;
