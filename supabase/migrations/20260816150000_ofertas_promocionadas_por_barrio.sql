-- Campaña hiperlocal (Plan PRO+): el comercio elige promocionar una
-- oferta activa en un barrio puntual. No inventa un sistema de "alcance
-- pago" -- simplemente hace que esa oferta aparezca destacada en la
-- página real de ese barrio, con un alcance ESTIMADO calculado de datos
-- reales (negocios + seguidores del barrio), nunca una promesa de
-- resultados.
alter table offers add column if not exists promoted_neighborhood_id uuid references locations(id) on delete set null;
