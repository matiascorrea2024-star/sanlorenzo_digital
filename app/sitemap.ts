import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = await createClient();
  const { data: negocios, error: e1 } = await sb.from("businesses").select("slug").eq("status", "verificado").limit(200);
  // offers no tiene columna "updated_at" (sí created_at) -- con el nombre
  // viejo, Postgrest devolvía error sin tirar excepción y esta consulta
  // quedaba en null en silencio: el sitemap nunca incluyó ninguna oferta.
  const { data: ofertas, error: e2 } = await sb.from("offers").select("id, created_at").eq("active", true).limit(500);
  const { data: ciudades, error: e3 } = await sb.from("locations").select("id, slug").eq("type", "city").eq("active", true);
  const { data: barrios, error: e4 } = await sb.from("locations").select("slug, parent_id").eq("type", "neighborhood").eq("active", true);
  const { data: posts, error: e5 } = await sb.from("blog_posts").select("slug, updated_at").eq("published", true);
  for (const e of [e1, e2, e3, e4, e5]) if (e) console.error("sitemap:", e.message);
  const base = "https://sanlorenzodigital.vercel.app";
  const estaticas = ["", "/pulso", "/negocios", "/particulares", "/promociones", "/mapa", "/ranking", "/vecinos", "/feed", "/buscar", "/para-negocios", "/planes", "/b2b", "/portuario", "/blog"].map((p) => ({
    url: base + p, lastModified: new Date(), changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8,
  }));
  const negociosSitemap = (negocios || []).map((b: any) => ({
    url: `${base}/negocio/${b.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7,
  }));
  const ofertasSitemap = (ofertas || []).map((o: any) => ({
    url: `${base}/oferta/${o.id}`, lastModified: new Date(o.created_at || Date.now()), changeFrequency: "daily" as const, priority: 0.8,
  }));
  const ciudadesById = new Map((ciudades || []).map((c: any) => [c.id, c]));
  const ciudadesSitemap = (ciudades || []).map((c: any) => ({
    url: `${base}/${c.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6,
  }));
  const barriosSitemap = (barrios || [])
    .map((b: any) => {
      const ciudad = ciudadesById.get(b.parent_id) as any;
      return ciudad ? { url: `${base}/${ciudad.slug}/${b.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const postsSitemap = (posts || []).map((p: any) => ({
    url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updated_at || Date.now()), changeFrequency: "monthly" as const, priority: 0.5,
  }));
  return [...estaticas, ...negociosSitemap, ...ofertasSitemap, ...ciudadesSitemap, ...barriosSitemap, ...postsSitemap];
}
