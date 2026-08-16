"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import HowItWorks from "@/components/ui/how-it-works";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function OfertasPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const searchParams = useSearchParams();
  const bienvenida = searchParams.get("bienvenida") === "1";
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
    const { error } = await supabase()
      .from("offers")
      .update({ active: !active })
      .eq("id", offerId);

    if (error) { show(`❌ ${friendlyError(error, "No se pudo actualizar la oferta.")}`, "error"); return; }
    setOffers(offers.map(o => o.id === offerId ? { ...o, active: !active } : o));
  };

  const marcarBomba = async (offerId: string, bizId: string) => {
    const sb = supabase();
    // Solo una oferta bomba activa por negocio a la vez.
    const { error: e1 } = await sb.from("offers").update({ es_bomba: false }).eq("business_id", bizId).eq("es_bomba", true);
    if (e1) { show(`❌ ${friendlyError(e1, "No se pudo marcar como oferta bomba.")}`, "error"); return; }
    const { error: e2 } = await sb.from("offers").update({ es_bomba: true }).eq("id", offerId);
    if (e2) { show(`❌ ${friendlyError(e2, "No se pudo marcar como oferta bomba.")}`, "error"); return; }
    setOffers(offers.map(o => {
      if (o.id === offerId) return { ...o, es_bomba: true };
      if (o.business_id === bizId) return { ...o, es_bomba: false };
      return o;
    }));
  };

  if (loading) {
    return (
      <main className="bg-[#120d09] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  return (
    <main className="bg-[#120d09] min-h-screen text-white">
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

        <HowItWorks steps={[
          "Publicá una oferta y aparece al toque en la home, el radar y el mapa.",
          "\"Activar/Desactivar\" la saca y la vuelve a poner sin borrarla.",
          "La \"oferta bomba\" es tu promo estrella del día -- se destaca especialmente entre 18 y 20hs, solo podés tener una activa por negocio a la vez.",
        ]} />

        {bienvenida && (
          <div className="mb-6 rounded-2xl border border-green-400/40 bg-green-500/10 p-5 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-black text-green-300">¡Listo! Negocio creado y primera oferta publicada.</p>
            <p className="mt-1 text-sm text-white/70">Ya está viva en la home, el radar, el mapa y tu miniweb. Ahora podés cargar tu catálogo de productos cuando quieras.</p>
            <Link href="/dashboard/productos" className="mt-3 inline-block rounded-xl border border-green-400/30 px-4 py-2 text-xs font-bold text-green-200 hover:bg-green-500/10">
              Cargar mi catálogo →
            </Link>
          </div>
        )}

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

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/editar`}
                      className="flex-1 rounded-xl border border-white/20 px-3 py-2 text-center text-xs font-bold hover:bg-white/5"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/cupones`}
                      className="flex-1 rounded-xl border border-white/20 px-3 py-2 text-center text-xs font-bold hover:bg-white/5"
                    >
                      🎟️ Cupones
                    </Link>
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/marketing`}
                      className="flex-1 rounded-xl border border-white/20 px-3 py-2 text-center text-xs font-bold hover:bg-white/5"
                    >
                      📱 Marketing
                    </Link>
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/campana`}
                      className="flex-1 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-center text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
                    >
                      📍 Promocionar
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
