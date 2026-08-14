import { createClient } from "@/lib/supabase-server";

export async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null as null, error: "No autorizado" };
  return { sb, user, error: null as null };
}

export async function requireAdmin() {
  const { sb, user, error } = await requireUser();
  if (!user) return { sb, user: null as null, isAdmin: false, error };
  const { data: prof } = await sb.from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();
  const isAdmin = prof?.role === "admin";
  if (!isAdmin) return { sb, user, isAdmin: false, error: "No autorizado: se requiere rol admin" };
  return { sb, user, isAdmin: true, error: null as null };
}
