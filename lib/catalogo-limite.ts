import { SupabaseClient } from "@supabase/supabase-js";
import { PLANES } from "./plans";

// Cuando un plan cambia (especialmente downgrade), oculta/marca productos
// y ofertas que exceden los límites del nuevo plan. No los borra (historial),
// solo los oculta del público hasta que el negocio pague un plan con más límite.
export async function aplicarLimiteCatalogo(
  sb: SupabaseClient,
  businessId: string,
  newPlan: string
) {
  const planInfo = PLANES[newPlan] || PLANES.gratis;

  // Si el plan tiene límite de ofertas, ocultar las que sobran
  if (planInfo.maxOfertas !== -1) {
    const { data: ofertas } = await sb
      .from("offers")
      .select("id")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (ofertas && ofertas.length > planInfo.maxOfertas) {
      const ofertasAOcultar = ofertas.slice(planInfo.maxOfertas);
      await sb
        .from("offers")
        .update({ active: false })
        .in("id", ofertasAOcultar.map((o) => o.id));
    }
  }

  // Si el plan tiene límite de productos, ocultar los que sobran
  if (planInfo.maxProductos !== -1) {
    const { data: productos } = await sb
      .from("products")
      .select("id")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (productos && productos.length > planInfo.maxProductos) {
      const productosAOcultar = productos.slice(planInfo.maxProductos);
      await sb
        .from("products")
        .update({ active: false })
        .in("id", productosAOcultar.map((p) => p.id));
    }
  }
}
