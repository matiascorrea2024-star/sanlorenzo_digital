-- components/offers/coupon-button.tsx siempre arranca con coupon=null,
-- sin chequear si el usuario ya tenía uno generado -- recargando la
-- página (o volviendo más tarde) se podía generar un cupón nuevo cada
-- vez, cada uno válido por 7 días y canjeable por separado. Sin
-- constraint que lo impidiera del lado de la base.
alter table coupons
  add constraint coupons_offer_user_unique unique (offer_id, user_id);
