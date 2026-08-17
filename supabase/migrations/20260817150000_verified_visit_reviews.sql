-- La columna verified_visit y su badge en components/business/reviews-section.tsx:192
-- ya existían, pero nada la seteaba nunca al insertar una reseña -- quedaba
-- siempre en null/false, el badge "compra verificada" nunca aparecía.
-- Investigación de mercado: el miedo #1 de la gente a comprar online es el
-- fraude/reseñas falsas -- este badge es justo la respuesta a eso, pero
-- estaba construido a medias.
--
-- Se marca como verificada si el usuario tiene evidencia real de haber
-- interactuado con el negocio: un cupón canjeado (señal fuerte, mostró el
-- cupón en el local) o un mensaje real por el chat de la plataforma con
-- ese negocio (señal de contacto genuino). Se calcula server-side con un
-- trigger, no se confía en lo que mande el cliente.
create or replace function public.set_review_verified_visit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.verified_visit := exists (
    select 1 from public.coupons c
    where c.business_id = new.business_id and c.user_id = new.user_id and c.redeemed_at is not null
  ) or exists (
    select 1 from public.messages m
    where m.business_id = new.business_id and m.customer_id = new.user_id
  );
  return new;
end;
$$;

create trigger trg_review_verified_visit
before insert on business_reviews
for each row execute function public.set_review_verified_visit();
