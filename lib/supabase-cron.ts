import { createClient } from "@supabase/supabase-js";

// EXCEPCIÓN PUNTUAL a la regla de "nunca service role key" de este
// proyecto: este cliente solo lo usan las rutas bajo app/api/cron/* (Vercel
// Cron las llama sola, protegidas por CRON_SECRET, nunca alcanzables desde
// el navegador ni con la sesión de un usuario). Hace falta porque son
// tareas de sistema sin un usuario autenticado detrás (armar el newsletter
// leyendo user_emails sin policy pública, bajar planes vencidos saltando
// RLS de businesses). No se usa en ninguna ruta que reciba pedidos de un
// cliente autenticado como usuario.
export function supabaseCron() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role)");
  return createClient(url, key, { auth: { persistSession: false } });
}
