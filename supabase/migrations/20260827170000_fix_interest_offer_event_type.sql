-- El botón "Me interesa" (components/offers/interest-button.tsx) manda el
-- evento interest_offer a /api/track desde hace rato, y la ruta lo acepta
-- (app/api/track/route.ts). Pero el CHECK de analytics_events nunca se
-- actualizó cuando se agregó ese evento: todo insert con event_type =
-- 'interest_offer' viola la restricción y falla en silencio (el endpoint
-- traga el error a propósito para no romper la navegación). Resultado:
-- la señal de interés se mostraba en pantalla (contador optimista del
-- lado del cliente) pero nunca quedó grabada en la base, y la nueva etapa
-- "Mostraron interés" del embudo de app/dashboard/analytics quedaría
-- siempre en cero.
--
-- Este fix solo amplía la lista de valores permitidos -- no borra ni
-- modifica ningún dato ni evento existente.
ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_check CHECK (event_type IN (
    'view_business', 'view_offer', 'click_whatsapp', 'click_map',
    'favorite', 'follow', 'search', 'coupon_generated', 'coupon_redeemed',
    'share_business', 'share_offer', 'checkout_started',
    'payment_confirmed', 'tracked_link_click', 'interest_offer'
  ));
