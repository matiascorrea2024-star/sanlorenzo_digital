"use client";
import { useEffect, useState } from "react";
import { BUSINESSES, Business } from "./data";
import { supabase } from "./supabase";

export type FullBusiness = Business & {
  portada_url?: string;
  logo_url?: string;
  destacado?: boolean;
  promotions?: any[];
  plan?: string;
};

export function useAllBusinesses(): FullBusiness[] {
  const [list, setList] = useState<FullBusiness[]>(BUSINESSES as FullBusiness[]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase().from("businesses").select("*");
        if (!data) return;
        const reales: FullBusiness[] = (data as any[]).filter((b) => b.activo !== false).map((b) => ({
          id: String(b.id),
          slug: b.slug,
          name: b.name,
          category: b.category || "otros",
          type: b.type || "comercio",
          description: b.description || "",
          address: b.address || "",
          city: b.city || "San Lorenzo",
          province: b.province || "Santa Fe",
          country: b.country || "Argentina",
          rating: Number(b.rating || 0),
          reviews: Number(b.reviews || 0),
          status: b.status || "reclamado",
          demo: false,
          open: !!b.open,
          whatsapp: b.whatsapp,
          instagram: b.instagram,
          tags: Array.isArray(b.tags) ? b.tags : [],
          accent: b.accent || "#f97316",
          schedule: b.schedule || "",
          updatedAt: b.updated_at || "",
          items: Array.isArray(b.items) ? b.items : [],
          latitude: b.latitude ?? undefined,
          longitude: b.longitude ?? undefined,
          location_source: b.location_source,
          location_verified: !!b.location_verified,
          promotions: Array.isArray(b.promotions) ? b.promotions : [],
          portada_url: b.portada_url,
          logo_url: b.logo_url,
          destacado: !!b.destacado,
          plan: b.plan || "gratis",
        }));
        setList([...reales, ...(BUSINESSES as FullBusiness[])]);
      } catch (e) {
        console.error("No se pudieron cargar negocios reales:", e);
      }
    })();
  }, []);

  return list;
}
