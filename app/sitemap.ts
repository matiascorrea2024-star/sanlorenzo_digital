import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = await createClient();
  const { data: negocios } = await sb.from("businesses").select("slug").eq("status", "verificado").limit(200);
  const { data: ofertas } = await sb.from("offers").select("id, updated_at").eq("active", true).limit(500);
  const { data: ciudades } = await sb.from("locations").select("id, slug").eq("type", "city").eq("active", true);
  const { data: barrios } = await sb.from("locations").select("slug, parent_id").eq("type", "neighborhood").eq("active", true);
  const { data: posts } = await sb.from("blog_posts").select("slug, updated_at").eq("published", true);
  const base = "https://sanlorenzodigital.vercel.app";
  const estaticas = ["", "/negocios", "/particulares", "/promociones", "/mapa", "/ranking", "/vecinos", "/feed", "/buscar", "/para-negocios", "/planes", "/b2b", "/portuario", "/blog"].map((p) => ({
    url: base + p, lastModified: new Date(), changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8,
  }));
  const negociosSitemap = (negocios || []).map((b: any) => ({
    url: `${base}/negocio/${b.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7,
  }));
  const ofertasSitemap = (ofertas || []).map((o: any) => ({
    url: `${base}/oferta/${o.id}`, lastModified: new Date(o.updated_at || Date.now()), changeFrequency: "daily" as const, priority: 0.8,
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
