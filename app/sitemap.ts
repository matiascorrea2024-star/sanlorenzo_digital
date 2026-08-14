import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = await createClient();
  const { data } = await sb.from("businesses").select("slug").eq("status", "verificado").limit(200);
  const base = "https://sanlorenzodigital.vercel.app";
  const estaticas = ["", "/negocios", "/promociones", "/mapa", "/ranking", "/vecinos", "/feed", "/buscar", "/para-negocios", "/planes"].map((p) => ({
    url: base + p, lastModified: new Date(), changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8,
  }));
  const negocios = (data || []).map((b: any) => ({
    url: `${base}/negocio/${b.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7,
  }));
  return [...estaticas, ...negocios];
}
