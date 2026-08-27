"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SelloIcon, SelloDudaIcon } from "@/components/icons/sello-icons";
import { supabase } from "@/lib/supabase";

export default function OpinionVote({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [miOpinion, setMiOpinion] = useState<boolean | null>(null);
  const [si, setSi] = useState(0);
  const [no, setNo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cargar = async () => {
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();
    setUser(user);

    const { data } = await sb.from("offer_opinions").select("user_id, vale_la_pena").eq("offer_id", offerId);
    const rows = data || [];
    setSi(rows.filter((r) => r.vale_la_pena).length);
    setNo(rows.filter((r) => !r.vale_la_pena).length);
    if (user) {
      const mia = rows.find((r) => r.user_id === user.id);
      setMiOpinion(mia ? mia.vale_la_pena : null);
    }
    setLoaded(true);
  };

  useEffect(() => { cargar(); }, [offerId]);

  const votar = async (valor: boolean) => {
    if (!user) { router.push(`/login?redirect=/oferta/${offerId}`); return; }
    if (busy) return;
    setBusy(true);
    const sb = supabase();
    // Optimista: si ya tenía la misma opinión, no descontamos (no hay
    // "quitar voto" -- solo cambiar de opinión, igual que daily_votes).
    const prev = miOpinion;
    setMiOpinion(valor);
    if (prev === true && valor !== true) setSi((n) => n - 1);
    if (prev === false && valor !== false) setNo((n) => n - 1);
    if (prev !== true && valor === true) setSi((n) => n + 1);
    if (prev !== false && valor === false) setNo((n) => n + 1);

    const { error } = await sb.from("offer_opinions")
      .upsert({ offer_id: offerId, user_id: user.id, vale_la_pena: valor, updated_at: new Date().toISOString() }, { onConflict: "offer_id,user_id" });
    if (error) await cargar(); // algo falló -- recargamos el estado real
    setBusy(false);
  };

  if (!loaded) return null;

  const total = si + no;
  const pctSi = total > 0 ? Math.round((si / total) * 100) : 0;

  return (
    <div className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--ov-03)] p-6">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[.3em] text-[var(--muted2)]">¿Vale la pena? · Opinión vecinal</p>
      <div className="flex items-center gap-4">
        <button onClick={() => votar(true)} disabled={busy}
          className={`group flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 py-4 transition disabled:opacity-70 ${miOpinion === true ? "border-[var(--ok)] bg-[var(--ok)]/10" : "border-[var(--line)] bg-[var(--ov-05)] hover:border-[var(--ok)]/50"}`}>
          <span className="flex items-center gap-2 font-display text-2xl text-[var(--ok)] transition group-hover:scale-105">
            <SelloIcon className="h-5 w-5" /> {si}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Recomiendan</span>
        </button>
        <button onClick={() => votar(false)} disabled={busy}
          className={`group flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 py-4 transition disabled:opacity-70 ${miOpinion === false ? "border-[var(--bad)] bg-[var(--bad)]/10" : "border-[var(--line)] bg-[var(--ov-05)] hover:border-[var(--bad)]/50"}`}>
          <span className="flex items-center gap-2 font-display text-2xl text-[var(--bad)] transition group-hover:scale-105">
            <SelloDudaIcon className="h-5 w-5" /> {no}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Tienen dudas</span>
        </button>
      </div>
      {total > 0 ? (
        <div className="mt-4 flex items-center gap-2.5">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ov-08)]">
            <div className="h-full bg-[var(--ok)]" style={{ width: `${pctSi}%` }} />
            <div className="h-full bg-[var(--bad)]" style={{ width: `${100 - pctSi}%` }} />
          </div>
          <span className="text-[10px] font-black tabular-nums text-[var(--muted2)]">{pctSi}% recomienda</span>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs font-semibold text-[var(--muted2)]">Sé el primero en opinar</p>
      )}
    </div>
  );
}
