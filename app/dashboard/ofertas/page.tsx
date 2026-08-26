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
import { planDe } from "@/lib/plans";
import { hoyArgentina } from "@/lib/fecha-ar";

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

  const duplicar = async (offer: any) => {
    const business = businesses.find((b) => b.id === offer.business_id);
    if (!business) return;
    // La copia arranca inactiva: avisar si al activarla se iría del plan.
    const hoy = hoyArgentina();
    const activas = offers.filter(
      (o) => o.business_id === offer.business_id && o.active && (!o.valid_until || o.valid_until >= hoy)
    ).length;
    const max = planDe(business).maxOfertas;
    const { id: _id, created_at: _creada, es_bomba: _bomba, ...copia } = offer;
    const { error } = await supabase()
      .from("offers")
      .insert({
        ...copia,
        active: false,
        es_bomba: false,
        valid_until: new Date(Date.now() - 3 * 3600e3 + 7 * 86400e3).toISOString().slice(0, 10),
      });
    if (error) { show(`❌ ${friendlyError(error, "No se pudo duplicar la oferta.")}`, "error"); return; }
    show(
      max !== -1 && activas >= max
        ? `📋 Copia creada inactiva. Tu plan permite ${max} activas: pausá otra para poder activarla.`
        : "📋 Copia creada inactiva. Editá precios y activala cuando quieras.",
      "success"
    );
    loadData();
  };

  if (loading) {
    return (
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </main>
    );
  }

  return (
    <main className="bg-[var(--bg)] min-h-screen text-[var(--text)]">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-[var(--accent)] hover:text-[var(--accent)]">
              ← Volver al dashboard
            </Link>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent)]">Ofertas y promos</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Mis ofertas</h1>
            <p className="mt-3 max-w-md text-[var(--muted)]">Gestioná tus promociones de La Gran Barata Digital.</p>
          </div>
          <Link
            href="/dashboard/ofertas/nueva"
            className="rounded-full bg-[var(--accent)] px-6 py-3 font-black text-white hover:opacity-90"
          >
            + Nueva oferta
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
            <p className="mt-2 font-black text-[var(--ok)]">¡Listo! Negocio creado y primera oferta publicada.</p>
            <p className="mt-1 text-sm text-[var(--text)]/70">Ya está viva en la home, el radar, el mapa y tu miniweb. Ahora podés cargar tu catálogo de productos cuando quieras.</p>
            <Link href="/dashboard/productos" className="mt-3 inline-block rounded-xl border border-green-400/30 px-4 py-2 text-xs font-bold text-green-200 hover:bg-green-500/10">
              Cargar mi catálogo →
            </Link>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-black/10 p-12 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <div className="text-6xl mb-4">🔥</div>
              <h2 className="text-2xl font-black mb-2">Aún no tenés ofertas</h2>
              <p className="text-[var(--muted)] mb-6">
                Creá tu primera oferta para aparecer en La Gran Barata
              </p>
              <Link
                href="/dashboard/ofertas/nueva"
                className="inline-block rounded-full bg-[var(--accent)] px-8 py-4 font-black text-white hover:opacity-90"
              >
                Crear mi primera oferta
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => {
              const business = businesses.find(b => b.id === offer.business_id);
              return (
                <div
                  key={offer.id}
                  className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5"
                >
                <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-black/10 p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{offer.title}</h3>
                        <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
                          offer.active 
                            ? "bg-green-500/20 text-[var(--ok)]" 
                            : "bg-red-500/20 text-[var(--bad)]"
                        }`}>
                          {offer.active ? "ACTIVA" : "INACTIVA"}
                        </span>
                      </div>
                      {business && (
                        <p className="text-sm text-[var(--muted)]">{business.name}</p>
                      )}
                      {offer.product && (
                        <p className="text-sm text-[var(--text)]/70 mt-1">{offer.product}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleOffer(offer.id, offer.active)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        offer.active
                          ? "bg-red-500/10 text-[var(--bad)] border border-red-500/30 hover:bg-red-500/20"
                          : "bg-green-500/10 text-[var(--ok)] border border-green-500/30 hover:bg-green-500/20"
                      }`}
                    >
                      {offer.active ? "Pausar" : "Activar"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {offer.discount_percent && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Descuento</p>
                        <p className="text-lg font-black text-[var(--accent)]">{offer.discount_percent}% OFF</p>
                      </div>
                    )}
                    {offer.old_price && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Precio anterior</p>
                        <p className="text-lg font-bold line-through text-[var(--muted2)]">
                          ${offer.old_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {offer.offer_price && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Precio oferta</p>
                        <p className="text-lg font-black text-[var(--ok)]">
                          ${offer.offer_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {offer.valid_until && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Vence</p>
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
                        ? "border border-red-400/40 bg-red-500/15 text-[var(--bad)]"
                        : "border border-[var(--line-strong)] bg-[var(--ov-05)] hover:border-red-400/40 hover:bg-red-500/10"
                    }`}
                  >
                    {offer.es_bomba ? "💣 Es tu oferta bomba de hoy (18-20hs)" : "💣 Marcar como oferta bomba de hoy"}
                  </button>

                  {/* Editar queda a la vista; el resto son acciones
                      secundarias agrupadas -- 4 botones del mismo peso
                      visual eran ruido para elegir de un vistazo. */}
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/ofertas/${offer.id}/editar`}
                      className="flex-1 rounded-xl border border-[var(--line-strong)] px-3 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]"
                    >
                      ✏️ Editar
                    </Link>
                    <details className="group relative">
                      <summary className="flex h-full cursor-pointer list-none items-center rounded-xl border border-[var(--line-strong)] px-3 py-2 text-center text-xs font-bold marker:content-none hover:bg-[var(--ov-05)]">
                        ⋯ Más
                      </summary>
                      <div className="absolute right-0 z-10 mt-2 w-44 space-y-1 rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-2 shadow-2xl">
                        <button
                          onClick={() => duplicar(offer)}
                          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold hover:bg-[var(--ov-10)]"
                        >
                          📋 Duplicar
                        </button>
                        <Link href={`/dashboard/ofertas/${offer.id}/cupones`} className="block rounded-lg px-3 py-2 text-xs font-bold hover:bg-[var(--ov-10)]">
                          🎟️ Cupones
                        </Link>
                        <Link href={`/dashboard/ofertas/${offer.id}/marketing`} className="block rounded-lg px-3 py-2 text-xs font-bold hover:bg-[var(--ov-10)]">
                          📱 Marketing
                        </Link>
                        <Link href={`/dashboard/ofertas/${offer.id}/campana`} className="block rounded-lg px-3 py-2 text-xs font-bold text-[var(--place)] hover:bg-[var(--ov-10)]">
                          📍 Promocionar
                        </Link>
                      </div>
                    </details>
                  </div>
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
