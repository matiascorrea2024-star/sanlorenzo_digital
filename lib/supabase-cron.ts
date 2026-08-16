import { createClient } from "@supabase/supabase-js";

// EXCEPCIÓN PUNTUAL a la regla de "nunca service role key" de este
// proyecto: este cliente SOLO lo usa app/api/cron/newsletter (un endpoint
// que Vercel Cron llama solo, protegido por CRON_SECRET, nunca alcanzable
// desde el navegador ni con la sesión de un usuario). Hace falta para leer
// user_emails (a propósito sin policy pública) y armar la lista de
// destinatarios del resumen semanal. No se usa en ninguna ruta que reciba
// pedidos de un cliente autenticado como usuario.
export function supabaseCron() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role)");
  return createClient(url, key, { auth: { persistSession: false } });
}
