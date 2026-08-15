import { supabase } from "@/lib/supabase";

/** El chat de soporte reusa la tabla de mensajes negocio<->cliente: el
 * admin de la plataforma actúa como "customer_id" de esa conversación
 * puntual. No hace falta una tabla nueva -- el negocio ve un chat más
 * en sus mensajes, y el admin lo ve agrupado en /admin. */
export async function getSupportAdmin(): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase()
    .from("user_profiles")
    .select("user_id, display_name")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { id: data.user_id, name: data.display_name || "Soporte" };
}
