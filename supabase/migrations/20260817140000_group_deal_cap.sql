-- Tope duro (además del client-side en app/dashboard/ofertas/nueva) para
-- que un negocio chico no se comprometa, ni siquiera saltándose el
-- formulario, a una oferta grupal con más cupo del que puede cumplir --
-- la lección clásica de Groupon con comercios chicos.
alter table offers
  add constraint offers_meta_participantes_check
  check (meta_participantes is null or (meta_participantes >= 2 and meta_participantes <= 500));
