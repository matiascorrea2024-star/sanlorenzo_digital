"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReviewModeration({ businessId }: { businessId: number }) {
  const [list, setList] = useState<any[] | null>(null);
  const load = async () => {
    const { data } = await supabase().from("reviews").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setList(data || []);
  };
  useEffect(() => { load(); }, [businessId]);
  const setStatus = async (id: number, status: string) => {
    await supabase().from("reviews").update({ status }).eq("id", id);
    load();
  };
  if (list === null) return null;
  const pending = list.filter((r) => r.status === "pending");
  const approved = list.filter((r) => r.status === "approved");
  return (
    <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <h2 className="mb-4 font-semibold">⭐ Opiniones de clientes</h2>
      {pending.length > 0 && (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--warn)]">Pendientes de aprobar</p>
          <div className="grid gap-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-xl border border-[var(--warn)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{r.author_name}</p>
                  <span className="text-sm text-[var(--warn)]">{"★".repeat(r.rating)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{r.comment}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setStatus(r.id, "approved")} className="rounded-lg bg-[var(--ok)] px-3 py-1.5 text-xs font-semibold text-black">✅ Publicar</button>
                  <button onClick={() => setStatus(r.id, "rejected")} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--bad)]">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {approved.length > 0 && (
        <>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--ok)]">Publicadas</p>
          <div className="grid gap-2">
            {approved.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3">
                <p className="text-sm">{r.author_name} · <span className="text-[var(--warn)]">{"★".repeat(r.rating)}</span></p>
                <button onClick={() => setStatus(r.id, "pending")} className="text-xs text-[var(--muted)] hover:text-white">Ocultar</button>
              </div>
            ))}
          </div>
        </>
      )}
      {list.length === 0 && <p className="text-sm text-[var(--muted)]">Cuando un cliente deje una opinión, la vas a aprobar desde acá.</p>}
    </section>
  );
}
