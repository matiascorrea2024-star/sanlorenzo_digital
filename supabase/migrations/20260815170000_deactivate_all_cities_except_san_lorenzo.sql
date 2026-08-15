-- San Lorenzo es la única ciudad lanzada hoy. Las otras 12 ya existen
-- cargadas (nombre, slug, coordenadas) pero nunca fueron pensadas para
-- estar públicamente visibles todavía -- quedaban "active" por default
-- histórico, no por una decisión real de lanzamiento. Pasan a "inactive"
-- (no "draft": ya tienen todos los datos básicos completos, están listas
-- para activarse desde /admin cuando corresponda, no en construcción).
--
-- Verificado antes de esta migración (solo lectura): ninguna de las 12
-- tiene negocios ni barrios cargados todavía, así que no hay nada que
-- quede huérfano o inconsistente al desactivarlas.
update locations
set status = 'inactive', active = false
where type = 'city' and slug <> 'san-lorenzo';
