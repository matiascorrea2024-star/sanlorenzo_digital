import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = await createClient();
  const { data: negocios } = await sb.from("businesses").select("slug").eq("status", "verificado").limit(200);
  const { data: ofertas } = await sb.from("offers").select("id, updated_at").eq("active", true).limit(500);
  const base = "https://sanlorenzodigital.vercel.app";
  const estaticas = ["", "/negocios", "/promociones", "/mapa", "/ranking", "/vecinos", "/feed", "/buscar", "/para-negocios", "/planes", "/b2b", "/portuario"].map((p) => ({
    url: base + p, lastModified: new Date(), changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8,
  }));
  const negociosSitemap = (negocios || []).map((b: any) => ({
    url: `${base}/negocio/${b.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7,
  }));
  const ofertasSitemap = (ofertas || []).map((o: any) => ({
    url: `${base}/oferta/${o.id}`, lastModified: new Date(o.updated_at || Date.now()), changeFrequency: "daily" as const, priority: 0.8,
  }));
  return [...estaticas, ...negociosSitemap, ...ofertasSitemap];
}
