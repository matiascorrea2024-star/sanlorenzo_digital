"use client";
import { useEffect, useState } from "react";
import { BUSINESSES } from "./data";
import { supabase } from "./supabase";
import type { FullBusiness } from "./types";

export type { FullBusiness };

// MODO LANZAMIENTO: negocios de muestra APAGADOS por defecto en todos lados.
// Si algún día querés verlos de nuevo, agregá esta línea a .env.local:
//   NEXT_PUBLIC_MOCKS=on
const MOCKS_ACTIVOS = process.env.NEXT_PUBLIC_MOCKS === "on";
const MOCK_BUSINESSES = MOCKS_ACTIVOS ? BUSINESSES : [];

// `seed`: si el caller ya tiene negocios recién traídos del servidor
// (ej. la home los recibe como prop de un Server Component), se los
// puede pasar acá para evitar un fetch cliente redundante -- el hook
// arranca con esos datos y no vuelve a pedirlos.
export function useAllBusinesses(seed?: FullBusiness[]): FullBusiness[] {
  const [list, setList] = useState<FullBusiness[]>(() => seed || (MOCK_BUSINESSES as FullBusiness[]));

  useEffect(() => {
    if (seed) return;
    (async () => {
      try {
        // Mismo criterio de visibilidad pública que la home/ranking/mapa
        // (activo=true + status verificado/reclamado) -- aplicado en la
        // query, no después: antes esto bajaba TODOS los negocios
        // (incluidos ocultos/rechazados por un admin) al navegador y
        // recién los filtraba en JS. Con muchos negocios, "select *"
        // sin límite baja también columnas pesadas (items, promotions
        // completos) que no todos los consumidores de este hook usan.
        // Los consumidores que necesitan búsqueda/listado grande real
        // (/negocios, /buscar, buscador global) ya no pasan por acá --
        // este hook queda para pantallas que sí necesitan "todos los
        // negocios con coordenadas" (mapa, asistente), con un tope
        // razonable como red de seguridad.
        const { data } = await supabase().from("businesses")
          .select("id, slug, name, category, type, description, tags, latitude, longitude, location_source, location_verified, portada_url, logo_url, rating, reviews, status, open, whatsapp, instagram, accent, schedule, updated_at, promotions, destacado, plan, hace_envios, retiro_en_local, envio_gratis, costo_envio, zona_cobertura, views, favorites_count, phone, email, website, cover_url")
          .eq("activo", true).in("status", ["verificado", "reclamado"])
          .limit(2000);
        if (!data) return;
        const reales: FullBusiness[] = (data as Array<Record<string, unknown>>).map((b) => ({
          id: String(b.id),
          slug: String(b.slug),
          name: String(b.name),
          category: (b.category as string) || "otros",
          type: (b.type as string) || "comercio",
          description: (b.description as string) || "",
          address: (b.address as string) || "",
          city: (b.city as string) || "San Lorenzo",
          province: (b.province as string) || "Santa Fe",
          country: (b.country as string) || "Argentina",
          rating: Number(b.rating || 0),
          reviews: Number(b.reviews || 0),
          status: ((b.status as string) || "reclamado") as FullBusiness["status"],
          demo: false,
          open: !!b.open,
          whatsapp: b.whatsapp as string | undefined,
          instagram: b.instagram as string | undefined,
          tags: Array.isArray(b.tags) ? (b.tags as string[]) : [],
          accent: (b.accent as string) || "#f97316",
          schedule: (b.schedule as string) || "",
          updatedAt: (b.updated_at as string) || "",
          items: Array.isArray(b.items) ? b.items : [],
          latitude: (b.latitude as number) ?? undefined,
          longitude: (b.longitude as number) ?? undefined,
          location_source: b.location_source as FullBusiness["location_source"],
          location_verified: !!b.location_verified,
          promotions: Array.isArray(b.promotions) ? b.promotions : [],
          portada_url: b.portada_url as string | undefined,
          logo_url: b.logo_url as string | undefined,
          destacado: !!b.destacado,
          plan: (b.plan as string) || "gratis",
          hace_envios: !!b.hace_envios,
          retiro_en_local: b.retiro_en_local !== false,
          envio_gratis: !!b.envio_gratis,
          costo_envio: b.costo_envio != null ? Number(b.costo_envio) : undefined,
          zona_cobertura: b.zona_cobertura as string | undefined,
          views: Number(b.views || 0),
          favorites_count: Number(b.favorites_count || 0),
          phone: b.phone as string | undefined,
          email: b.email as string | undefined,
          website: b.website as string | undefined,
          cover_url: b.cover_url as string | undefined,
          professionals: Array.isArray(b.professionals) ? b.professionals : [],
        }));

        const slugsReales = new Set(reales.map((b) => b.slug));
        const mockSinDuplicar = (MOCK_BUSINESSES as FullBusiness[]).filter((b) => !slugsReales.has(b.slug));
        setList([...reales, ...mockSinDuplicar]);
      } catch (e) {
        console.error("No se pudieron cargar negocios reales:", e);
      }
    })();
  }, []);

  return list;
}
