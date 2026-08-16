-- Resumen semanal por mail: el opt-in (newsletter_opt_in) ya existía en
-- user_profiles, pero esa tabla es de lectura PÚBLICA (profiles_select/
-- prof_read = true) -- guardar el email ahí sería exponer el mail de
-- cada usuario a cualquiera que consulte la tabla. Se guarda en una
-- tabla aparte, sin ninguna policy de lectura general: solo el propio
-- dueño puede leer su fila, nadie más (ni siquiera negocios/otros
-- usuarios). Se mantiene sincronizada con un trigger, no a mano desde
-- el código de la app.
create table user_emails (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

alter table user_emails enable row level security;

create policy user_emails_select_own on user_emails
  for select using (auth.uid() = user_id);

insert into user_emails (user_id, email)
select id, email from auth.users
on conflict (user_id) do update set email = excluded.email;

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_emails (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_sync on auth.users;
create trigger on_auth_user_email_sync
  after insert or update of email on auth.users
  for each row execute function public.sync_user_email();
