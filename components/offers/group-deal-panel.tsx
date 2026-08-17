"use client";
import { useEffect, useState } from "react";
import { Users, Share2, PartyPopper } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function GroupDealPanel({ offerId, metaParticipantes, initialActivada, offerTitle }: {
  offerId: string;
  metaParticipantes: number;
  initialActivada: boolean;
  offerTitle: string;
}) {
  const { show } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [anotado, setAnotado] = useState(false);
  const [activada, setActivada] = useState(initialActivada);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUserId(user?.id || null);

      const { count: c } = await supabase().from("group_deal_participants")
        .select("*", { count: "exact", head: true }).eq("offer_id", offerId);
      setCount(c || 0);

      if (user) {
        const { data } = await supabase().from("group_deal_participants")
          .select("user_id").eq("offer_id", offerId).eq("user_id", user.id).maybeSingle();
        setAnotado(!!data);
      }
    })();

    // Tiempo real: el contador y el estado de activación se actualizan
    // solos para todos los que están mirando la ficha, sin refrescar --
    // parte de lo que hace que se sienta "vivo" mientras se junta la gente.
    const chan = supabase().channel(`group-deal-${offerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_deal_participants", filter: `offer_id=eq.${offerId}` },
        () => setCount((n) => n + 1))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "group_deal_participants", filter: `offer_id=eq.${offerId}` },
        () => setCount((n) => Math.max(0, n - 1)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "offers", filter: `id=eq.${offerId}` },
        (payload: any) => { if (payload.new.grupal_activada) setActivada(true); })
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [offerId]);

  const toggle = async () => {
    if (!userId) { window.location.href = "/login"; return; }
    setBusy(true);
    if (anotado) {
      const { error } = await supabase().from("group_deal_participants").delete().eq("offer_id", offerId).eq("user_id", userId);
      setBusy(false);
      if (error) { show(`❌ ${friendlyError(error, "No se pudo actualizar.")}`, "error"); return; }
      setAnotado(false);
    } else {
      const { error } = await supabase().from("group_deal_participants").insert({ offer_id: offerId, user_id: userId });
      setBusy(false);
      if (error) { show(`❌ ${friendlyError(error, "No se pudo sumar. Probá de nuevo.")}`, "error"); return; }
      setAnotado(true);
    }
  };

  const share = async () => {
    const url = window.location.href;
    const text = `🎯 Sumate a esta oferta grupal: "${offerTitle}" -- faltan ${Math.max(0, metaParticipantes - count)} personas para que se active.`;
    if (navigator.share) {
      try { await navigator.share({ title: offerTitle, text, url }); } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    }
  };

  const pct = Math.min(100, Math.round((count / metaParticipantes) * 100));
  const faltan = Math.max(0, metaParticipantes - count);

  return (
    <div className="mb-5 rounded-[1.75rem] border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[.08] to-sky-500/[.04] p-1.5">
      <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-black text-cyan-200">
            <Users className="h-4 w-4" /> Oferta grupal
          </p>
          {activada ? (
            <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-green-300">
              <PartyPopper className="h-3 w-3" /> Activada
            </span>
          ) : (
            <span className="text-xs font-bold text-[var(--muted)]">{count}/{metaParticipantes}</span>
          )}
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--ov-10)]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <p className="mt-2.5 text-sm text-[var(--text)]/70">
          {activada
            ? "¡Se juntó la gente! El descuento ya es real, no hace falta esperar más."
            : faltan === 0
            ? "¡Justo se completó! Activando..."
            : `Faltan ${faltan} persona${faltan === 1 ? "" : "s"} para que se active el descuento.`}
        </p>

        {!activada && (
          <div className="mt-4 flex gap-2">
            <button onClick={toggle} disabled={busy}
              className={`flex-1 rounded-full py-2.5 text-sm font-black transition disabled:opacity-50 ${
                anotado ? "border border-cyan-400/40 bg-cyan-500/10 text-cyan-200" : "bg-gradient-to-r from-cyan-500 to-sky-500 text-white"
              }`}>
              {anotado ? "✅ Ya estás anotado" : "Sumarme"}
            </button>
            <button onClick={share} aria-label="Compartir" className="rounded-full border border-white/15 p-2.5 hover:bg-white/5">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
