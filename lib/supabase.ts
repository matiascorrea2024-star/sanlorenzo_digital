import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fetch a medida SOLO para reescribir pedidos HEAD -- workaround de un
// bug real y confirmado en esta versión de @supabase/supabase-js /
// postgrest-js (2.112.3): cualquier query con `{ head: true }` (el
// patrón usado en TODO el sitio para "solo dame el count", sin traer
// filas) sale del navegador como HEAD y el propio cliente la cancela
// sola (net::ERR_ABORTED, con `canceled:true` confirmado por CDP) antes
// de que llegue respuesta -- aunque el mismo pedido funciona perfecto
// como GET, o hecho con fetch nativo, o desde curl. Reproducido de forma
// 100% determinística en local, en dev Y en build de producción, contra
// docenas de componentes reales (badge de "ofertas nuevas", FollowButton,
// mensajes no leídos, si el usuario ya tiene negocio cargado, cupón ya
// canjeado, etc.) -- silenciosamente rompía todos esos chequeos en cada
// carga de página, sin ningún error visible para quien navega.
//
// En vez de tocar los ~15 archivos que usan `{ head: true }` uno por
// uno, se soluciona acá una sola vez: si postgrest-js arma un pedido
// HEAD, lo mandamos como GET (mismos headers, mismo `Prefer: count=exact`)
// -- PostgREST devuelve el mismo header `Content-Range` con el count real
// en ambos casos, así que ningún caller nota la diferencia; simplemente
// ahora sí llega respuesta en vez de que el pedido se cancele solo.
const headSafeFetch: typeof fetch = (input, init) => {
  if (init?.method === "HEAD") {
    return fetch(input, { ...init, method: "GET" });
  }
  return fetch(input, init);
};

let _client: SupabaseClient | null = null;
export const supabase = (): SupabaseClient =>
  (_client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: headSafeFetch } }
  ));

export const createClient = supabase;

export type NewBusiness = {
  name: string;
  category: string;
  type: string;
  description: string;
  address: string;
  whatsapp?: string;
  instagram?: string;
  accent: string;
  schedule: string;
  first_item: string;
};

export async function createBusiness(data: NewBusiness, userId: string) {
  const sb = supabase();
  const baseSlug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
  const { data: business, error } = await sb
    .from("businesses")
    .insert({
      owner_id: userId,
      name: data.name,
      slug: uniqueSlug,
      category: data.category,
      type: data.type,
      description: data.description,
      address: data.address,
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      accent: data.accent,
      schedule: data.schedule,
      status: "reclamado",
      demo: false,
      open: true,
      items: data.first_item ? [{ name: data.first_item }] : [],
      tags: [],
      rating: 0,
      reviews: 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return business;
}
