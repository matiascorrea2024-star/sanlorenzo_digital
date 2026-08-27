-- Newsletter para visitantes SIN cuenta (distinto de user_emails, que es
-- para usuarios registrados que activaron "Novedades por mail" en su
-- perfil -- ver app/api/cron/newsletter/route.ts).
--
-- Sin esta tabla, el formulario real de components/cro/newsletter-signup.tsx
-- rompía en producción: cada envío hacía POST a
-- /api/newsletter/subscribe, que consulta/inserta en
-- "newsletter_subscribers" -- una tabla que nunca existió en ninguna
-- migración. El insert fallaba con un 500 y el usuario recibía "Error al
-- suscribirse" siempre, sin excepción.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  source text
);

comment on table public.newsletter_subscribers is
  'Suscriptores del newsletter público (sin cuenta). No confundir con user_emails, que es el mail de usuarios registrados con opt-in en su perfil.';

alter table public.newsletter_subscribers enable row level security;

-- Sin políticas públicas a propósito: el único lector/escritor hoy es
-- app/api/newsletter/subscribe/route.ts, que usa supabaseCron() (cliente
-- con la service role key, que bypassa RLS por diseño). No se expone
-- lectura ni escritura directa a anon ni a usuarios autenticados -- estos
-- emails no tienen por qué ser visibles ni editables desde el cliente.
