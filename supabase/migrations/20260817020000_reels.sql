-- Reels: video corto (hasta 15s) por negocio, con reacciones, comentarios
-- y compartir. Reusa el bucket de storage "business-media" (misma carpeta
-- por dueño que fotos/comprobantes, ya con políticas RLS listas) y copia
-- el patrón de likes/moderación que ya usan Muro (muro_post_likes) y
-- En Vivo (live_stream_messages) -- nada de infraestructura nueva de
-- video: se sube el archivo tal cual (recortado en el celu antes de
-- subir) y se reproduce con <video> nativo.
create table reels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  video_url text not null,
  caption text,
  views_count integer not null default 0,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  -- el dueño puede ocultar su propio reel sin borrarlo (mismo criterio
  -- que products.active / businesses.activo)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table reel_likes (
  reel_id uuid not null references reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

create table reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references reels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reels enable row level security;
alter table reel_likes enable row level security;
alter table reel_comments enable row level security;

-- Público: solo reels activos de negocios activos y de ciudad activa
-- (mismo criterio que stream_is_public() para En Vivo).
create policy reels_select_public on reels
  for select using (
    active and exists (
      select 1 from businesses b
      where b.id = reels.business_id
        and b.activo is not false
        and public.location_is_active(b.location_id)
    )
  );

create policy reels_write on reels
  for all using (
    is_admin() or exists (select 1 from businesses b where b.id = reels.business_id and b.owner_id = auth.uid())
  );

create policy reel_likes_select on reel_likes for select using (true);
create policy reel_likes_insert on reel_likes for insert with check (auth.uid() = user_id);
create policy reel_likes_delete on reel_likes for delete using (auth.uid() = user_id);

create policy reel_comments_select_public on reel_comments
  for select using (
    not hidden and exists (select 1 from reels r where r.id = reel_comments.reel_id and r.active)
  );

create policy reel_comments_insert on reel_comments for insert with check (auth.uid() = user_id);

create policy reel_comments_moderate on reel_comments
  for update using (
    is_admin() or exists (
      select 1 from reels r join businesses b on b.id = r.business_id
      where r.id = reel_comments.reel_id and b.owner_id = auth.uid()
    )
  );

create policy reel_comments_delete on reel_comments
  for delete using (
    is_admin() or auth.uid() = user_id or exists (
      select 1 from reels r join businesses b on b.id = r.business_id
      where r.id = reel_comments.reel_id and b.owner_id = auth.uid()
    )
  );

-- Contadores mantenidos por trigger (mismo patrón que update_muro_post_likes).
create or replace function public.update_reel_likes()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.reels set likes_count = coalesce(likes_count, 0) + 1 where id = new.reel_id;
  elsif TG_OP = 'DELETE' then
    update public.reels set likes_count = greatest(0, coalesce(likes_count, 0) - 1) where id = old.reel_id;
  end if;
  return null;
end;
$$;

create trigger trg_reel_likes
after insert or delete on reel_likes
for each row execute function public.update_reel_likes();

create or replace function public.update_reel_comments()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.reels set comments_count = coalesce(comments_count, 0) + 1 where id = new.reel_id;
  elsif TG_OP = 'DELETE' then
    update public.reels set comments_count = greatest(0, coalesce(comments_count, 0) - 1) where id = old.reel_id;
  end if;
  return null;
end;
$$;

create trigger trg_reel_comments
after insert or delete on reel_comments
for each row execute function public.update_reel_comments();

-- Vistas: función angosta (solo suma 1, solo en reels activos) para no
-- necesitar exponer un UPDATE genérico sobre reels desde el cliente.
create or replace function public.increment_reel_view(p_reel_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.reels set views_count = views_count + 1 where id = p_reel_id and active;
end;
$$;
