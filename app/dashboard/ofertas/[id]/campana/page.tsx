"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Lock, Users, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { planDe } from "@/lib/plans";
import HowItWorks from "@/components/ui/how-it-works";
import { useToast } from "@/components/ui/toast";

export default function CampanaPage() {
  const params = useParams();
  const offerId = params.id as string;
  const { show } = useToast();
  const [offer, setOffer] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [barrios, setBarrios] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<string>("");
  const [alcance, setAlcance] = useState<{ negocios: number; seguidores: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: offerData } = await sb.from("offers").select("*").eq("id", offerId).maybeSingle();
      if (!offerData) { setLoading(false); return; }
      setOffer(offerData);
      setSeleccionado(offerData.promoted_neighborhood_id || "");

      const { data: businessData } = await sb.from("businesses").select("*").eq("id", offerData.business_id).maybeSingle();
      setBusiness(businessData);

      if (businessData?.location_id) {
        const { data: neighs } = await sb.from("locations").select("id, name")
          .eq("type", "neighborhood").eq("parent_id", businessData.location_id).order("name");
        setBarrios(neighs || []);
      }
      setLoading(false);
    })();
  }, [offerId]);

  useEffect(() => {
    if (!seleccionado) { setAlcance(null); return; }
    (async () => {
      const sb = supabase();
      const { data: negociosBarrio } = await sb.from("businesses").select("id").eq("neighborhood_id", seleccionado);
      const ids = (negociosBarrio || []).map((n) => n.id);
      let seguidores = 0;
      if (ids.length > 0) {
        const { count } = await sb.from("followers").select("id", { count: "exact", head: true }).in("business_id", ids);
        seguidores = count || 0;
      }
      setAlcance({ negocios: ids.length, seguidores });
    })();
  }, [seleccionado]);

  const guardar = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase().from("offers").update({ promoted_neighborhood_id: seleccionado || null }).eq("id", offerId);
      if (error) throw error;
      show(seleccionado ? "📍 Oferta promocionada en el barrio" : "Promoción quitada", "success");
    } catch {
      show("❌ No se pudo guardar. Probá de nuevo.", "error");
    }
    setGuardando(false);
  };

  if (loading) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Cargando...</main>;
  if (!offer || !business) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Oferta no encontrada.</main>;

  const plan = planDe(business);

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-xl px-4 py-8">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400">← Volver a mis ofertas</Link>
        <h1 className="mt-3 text-3xl font-black flex items-center gap-2"><MapPin className="h-7 w-7 text-cyan-400" /> Promocionar por barrio</h1>
        <p className="mt-1 text-white/60">&quot;{offer.title}&quot;</p>

        {!plan.campanas ? (
          <div className="mt-6 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-red-600/10 p-8 text-center">
            <Lock className="mx-auto mb-3 h-8 w-8 text-orange-400" />
            <p className="font-black">Promocionar por barrio es de Plan PRO</p>
            <p className="mt-1 text-sm text-white/60">Hacé que tu oferta se destaque en el barrio que más te importa.</p>
            <Link href="/dashboard/planes" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black">Ver planes →</Link>
          </div>
        ) : barrios.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
            Tu ciudad todavía no tiene barrios cargados para poder segmentar.
          </div>
        ) : (
          <>
            <HowItWorks steps={[
              "Elegí el barrio donde más te sirve destacarte -- lo ideal es el tuyo o uno cercano.",
              "Tu oferta va a aparecer resaltada en la página pública de ese barrio.",
              "Podés cambiarlo o quitarlo cuando quieras, no tiene costo extra ni límite de tiempo.",
            ]} />

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/60">Barrio</label>
              <select value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400">
                <option value="">Sin promocionar</option>
                {barrios.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              {alcance && (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                  <p className="mb-2 text-xs font-bold text-cyan-300">Alcance estimado (no es una promesa, es un cálculo real de hoy)</p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5"><Store className="h-4 w-4 text-white/40" /> {alcance.negocios} negocio{alcance.negocios === 1 ? "" : "s"} en el barrio</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-white/40" /> {alcance.seguidores} seguidor{alcance.seguidores === 1 ? "" : "es"} en total</span>
                  </div>
                </div>
              )}

              <button onClick={guardar} disabled={guardando}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-black disabled:opacity-50">
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
