"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default function OfertasPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Cargar negocios del usuario
      const { data: businessesData } = await supabase()
        .from("businesses")
        .select("*")
        .eq("owner_id", user?.id);

      if (businessesData && businessesData.length > 0) {
        setBusinesses(businessesData);
        const businessIds = businessesData.map((b: any) => b.id);

        // Cargar ofertas de todos los negocios
        const { data: offersData } = await supabase()
          .from("offers")
          .select("*")
          .in("business_id", businessIds)
          .order("created_at", { ascending: false });

        if (offersData) {
          setOffers(offersData);
        }
      }
    } catch (error) {
      console.error("Error cargando ofertas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const toggleOffer = async (offerId: string, active: boolean) => {
    try {
      await supabase()
        .from("offers")
        .update({ active: !active })
        .eq("id", offerId);

      setOffers(offers.map(o => o.id === offerId ? { ...o, active: !active } : o));
    } catch (error) {
      console.error("Error actualizando oferta:", error);
    }
  };

  const marcarBomba = async (offerId: string, bizId: string) => {
    const sb = supabase();
    // Solo una oferta bomba activa por negocio a la vez.
    await sb.from("offers").update({ es_bomba: false }).eq("business_id", bizId).eq("es_bomba", true);
    await sb.from("offers").update({ es_bomba: true }).eq("id", offerId);
    setOffers(offers.map(o => {
      if (o.id === offerId) return { ...o, es_bomba: true };
      if (o.business_id === bizId) return { ...o, es_bomba: false };
      return o;
    }));
  };

  if (loading) {
    return (
      <main className="bg-[#0d0a12] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  return (
    <main className="bg-[#0d0a12] min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-orange-400 hover:text-orange-300">
              ← Volver al dashboard
            </Link>
            <h1 className="text-3xl font-black mt-2">Mis Ofertas</h1>
            <p className="text-white/60 mt-1">Gestioná tus promociones de La Gran Barata</p>
          </div>
          <Link
            href="/dashboard/ofertas/nueva"
            className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-black text-white hover:opacity-90"
          >
            + Nueva Oferta
          </Link>
        </div>

        <DashboardNav />

        {offers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h2 className="text-2xl font-black mb-2">Aún no tenés ofertas</h2>
            <p className="text-white/60 mb-6">
              Creá tu primera oferta para aparecer en La Gran Barata
            </p>
            <Link
              href="/dashboard/ofertas/nueva"
              className="inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-4 font-black text-white hover:opacity-90"
            >
              Crear mi primera oferta
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => {
              const business = businesses.find(b => b.id === offer.business_id);
              return (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{offer.title}</h3>
                        <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
                          offer.active 
                            ? "bg-green-500/20 text-green-300" 
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {offer.active ? "ACTIVA" : "INACTIVA"}
                        </span>
                      </div>
                      {business && (
                        <p className="text-sm text-white/60">{business.name}</p>
                      )}
                      {offer.product && (
                        <p className="text-sm text-white/70 mt-1">{offer.product}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleOffer(offer.id, offer.active)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        offer.active
                          ? "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20"
                      }`}
                    >
                      {offer.active ? "Pausar" : "Activar"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {offer.discount_percent && (
                      <div>
                        <p className="text-xs text-white/50">Descuento</p>
                        <p className="text-lg font-black text-orange-400">{offer.discount_percent}% OFF</p>
                      </div>
                    )}
                    {offer.old_price && (
                      <div>
                        <p className="text-xs text-white/50">Precio anterior</p>
                        <p className="text-lg font-bold line-through text-white/40">
                          ${offer.old_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {offer.offer_price && (
                      <div>
                        <p className="text-xs text-white/50">Precio oferta</p>
                        <p className="text-lg font-black text-green-400">
                          ${offer.offer_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {offer.valid_until && (
                      <div>
                        <p className="text-xs text-white/50">Vence</p>
                        <p className="text-lg font-bold">
                          {new Date(offer.valid_until).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => marcarBomba(offer.id, offer.business_id)}
                    disabled={offer.es_bomba}
                    className={`mb-3 w-full rounded-xl px-4 py-2 text-sm font-bold transition ${
                      offer.es_bomba
                        ? "border border-red-400/40 bg-red-500/15 text-red-300"
                        : "border border-white/15 bg-white/5 hover:border-red-400/40 hover:bg-red-500/10"
                    }`}
                  >
                    {offer.es_bomba ? "💣 Es tu oferta bomba de hoy (18-20hs)" : "💣 Marcar como oferta bomba de hoy"}
                  </button>

                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/editar`}
                      className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-center text-sm hover:bg-white/5"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/cupones`}
                      className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-center text-sm hover:bg-white/5"
                    >
                      🎟️ Cupones
                    </Link>
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/marketing`}
                      className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-center text-sm hover:bg-white/5"
                    >
                      📱 Marketing
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
