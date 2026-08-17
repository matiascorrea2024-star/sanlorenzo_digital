import { MercadoPagoConfig } from "mercadopago";

// Devuelve null (no lanza) mientras no exista MP_ACCESS_TOKEN -- así las
// rutas que lo usan pueden responder "todavía no disponible" en vez de
// romper, y el botón de pago en /dashboard/planes puede ocultarse solo.
export function mercadoPagoConfig(): MercadoPagoConfig | null {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}
