"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MisNegocios() {
  const router = useRouter();
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await sb.from("businesses").select("*").eq("owner_id", user.id).order("created_at");
      setList(data || []);
    })();
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Mis negocios</h1>
        <a href="/dashboard/nuevo" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">+ Nuevo negocio</a>
      </div>
      {list === null ? (
        <p className="mt-10 text-center text-sm text-[var(--muted)]">Cargando…</p>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
          <p className="text-3xl">🏪</p>
          <p className="mt-3 font-semibold text-[var(--text)]">Todavía no tenés negocios.</p>
          <a href="/dashboard/nuevo" className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white">Creá tu primera miniweb</a>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((b) => (
            <div key={b.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-black" style={{ background: b.accent || "#8B5CF6" }}>
                  {(b.name || "").split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <h3 className="font-semibold">{b.name}</h3>
                  <p className="text-xs capitalize text-[var(--muted)]">{b.category} · {b.open ? "🟢 Abierto" : "🔴 Cerrado"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`/dashboard/editar/${b.slug}`} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-center text-sm font-semibold text-white hover:opacity-90">✏️ Editar</a>
                <a href={`/negocio/${b.slug}`} target="_blank" className="rounded-lg border border-[var(--line)] px-3 py-2 text-center text-sm hover:border-[var(--accent)]">👁️ Ver miniweb</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
