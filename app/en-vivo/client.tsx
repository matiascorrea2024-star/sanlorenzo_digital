"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Clock, Users, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EnVivoClient() {
  const [loading, setLoading] = useState(true);
  const [enVivo, setEnVivo] = useState<any[]>([]);
  const [proximos, setProximos] = useState<any[]>([]);
  const [finalizados, setFinalizados] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const [{ data: live }, { data: prox }, { data: fin }] = await Promise.all([
        sb.from("live_streams").select("*, businesses(name, slug, portada_url, logo_url, plan)").eq("status", "live").order("started_at", { ascending: false }),
        sb.from("live_streams").select("*, businesses(name, slug, portada_url, logo_url)").eq("status", "scheduled").gte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(12),
        sb.from("live_streams").select("*, businesses(name, slug, portada_url, logo_url)").eq("status", "ended").order("ended_at", { ascending: false }).limit(8),
      ]);
      // Destacados (Plan Destacado Semanal) primero, sin separar en otra sección.
      const ordenados = (live || []).sort((a: any, b: any) => (b.businesses?.plan === "premium" ? 1 : 0) - (a.businesses?.plan === "premium" ? 1 : 0));
      setEnVivo(ordenados);
      setProximos(prox || []);
      setFinalizados(fin || []);
      setLoading(false);
    })();
  }, []);

  const Card = ({ s, live }: { s: any; live?: boolean }) => (
    <Link href={`/en-vivo/${s.id}`} className={`group block rounded-[2rem] border p-1.5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)] ${
      live ? "border-[var(--accent)]/40 bg-[var(--surface)] shadow-[0_0_30px_-8px_rgba(209,47,104,.35)]" : "border-[var(--line)] bg-[var(--surface)]"
    }`}>
      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)]">
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-[var(--accent)]/25 to-[var(--place2)]/15">
          {s.cover_url ? (
            <Image src={s.cover_url} alt={s.title} fill sizes="(max-width: 768px) 50vw, 320px" quality={88}
              className="object-cover transition duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Radio className="h-8 w-8 text-[var(--muted2)]" /></div>
          )}
          {live && (
            <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ fontFamily: "var(--font-display)" }}>
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" /></span>
              En vivo
            </span>
          )}
          {s.businesses?.plan === "premium" && <span className="absolute right-2 top-2 rounded-full bg-yellow-500/90 px-2 py-0.5 text-[9px] font-black text-black">🔥 Destacado</span>}
        </div>
        <div className="p-4">
          <p className="truncate font-display text-sm uppercase tracking-tight">{s.title}</p>
          <p className="truncate text-xs text-[var(--muted)]">{s.businesses?.name}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(209,47,104,.16), transparent 55%), radial-gradient(circle at 90% 40%, rgba(169,31,85,.10), transparent 55%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          {!loading && enVivo.length > 0 && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" /></span>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>{enVivo.length} transmitiendo ahora</span>
            </div>
          )}
          <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-7xl">
            <span className="bg-gradient-to-r from-[#f7f3ec] via-[var(--accent)] to-[var(--place2)] bg-clip-text text-transparent">En</span>{" "}
            <span className="knockout-text magenta-glow">Vivo</span>
          </h1>
          <p className="mt-2 text-[var(--muted)]">Comercios de San Lorenzo transmitiendo en tiempo real</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />)}</div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl uppercase tracking-tight">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /></span>
                Ahora ({enVivo.length})
              </h2>
              {enVivo.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center">
                  <Radio className="mx-auto mb-3 h-7 w-7 text-[var(--muted2)]" />
                  <p className="font-display text-xl uppercase tracking-tight">No hay comercios transmitiendo ahora.</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Revisá &quot;Próximamente&quot; o volvé más tarde.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {enVivo.map((s) => <Card key={s.id} s={s} live />)}
                </div>
              )}
            </section>

            {proximos.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl uppercase tracking-tight"><Clock className="h-5 w-5 text-[var(--accent)]" /> Próximamente</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {proximos.map((s) => (
                    <div key={s.id} className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                      <p className="truncate font-display text-sm uppercase tracking-tight">{s.title}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{s.businesses?.name}</p>
                      <p className="mt-2 text-xs font-bold text-[var(--accent)]">{s.scheduled_at && new Date(s.scheduled_at).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {finalizados.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl uppercase tracking-tight text-[var(--muted)]"><Users className="h-5 w-5" /> Finalizados recientemente</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {finalizados.map((s) => (
                    <div key={s.id} className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4 opacity-60">
                      <p className="truncate font-display text-sm uppercase tracking-tight">{s.title}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{s.businesses?.name} · {s.total_viewers} espectadores</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {enVivo.length === 0 && proximos.length === 0 && finalizados.length === 0 && (
              <div className="mt-4 rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-7 w-7 text-[var(--accent)]" />
                <p className="font-display text-xl uppercase tracking-tight">Todavía no hubo transmisiones en San Lorenzo.</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">¿Tenés un negocio? Sé el primero en transmitir en vivo.</p>
                <Link href="/dashboard/en-vivo" className="btn-hard mt-4 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>Crear mi transmisión</Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
