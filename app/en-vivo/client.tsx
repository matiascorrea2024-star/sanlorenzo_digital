"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Clock, Users, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PageHero from "@/components/ui/page-hero";

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

  const Card = ({ s, badge }: { s: any; badge?: string }) => (
    <Link href={`/en-vivo/${s.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-red-400/40">
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-red-500/20 to-orange-500/20">
        {s.cover_url && <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover transition group-hover:scale-105" />}
        {badge && <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">{badge}</span>}
        {s.businesses?.plan === "premium" && <span className="absolute right-2 top-2 rounded-full bg-yellow-500/90 px-2 py-0.5 text-[9px] font-black text-black">🔥 Destacado</span>}
      </div>
      <div className="p-4">
        <p className="truncate font-bold">{s.title}</p>
        <p className="truncate text-xs text-white/50">{s.businesses?.name}</p>
      </div>
    </Link>
  );

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <PageHero title="En Vivo" subtitle="Comercios de San Lorenzo transmitiendo en tiempo real" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}</div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /></span>
                Ahora ({enVivo.length})
              </h2>
              {enVivo.length === 0 ? (
                <div className="sld-card rounded-2xl px-6 py-10 text-center">
                  <Radio className="mx-auto mb-3 h-7 w-7 text-white/30" />
                  <p className="font-bold">No hay comercios transmitiendo ahora.</p>
                  <p className="mt-1 text-sm text-white/50">Revisá &quot;Próximamente&quot; o volvé más tarde.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {enVivo.map((s) => <Card key={s.id} s={s} badge="🔴 En vivo" />)}
                </div>
              )}
            </section>

            {proximos.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Clock className="h-5 w-5 text-sky-400" /> Próximamente</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {proximos.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="truncate font-bold">{s.title}</p>
                      <p className="truncate text-xs text-white/50">{s.businesses?.name}</p>
                      <p className="mt-2 text-xs font-bold text-sky-300">{s.scheduled_at && new Date(s.scheduled_at).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {finalizados.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white/50"><Users className="h-5 w-5" /> Finalizados recientemente</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {finalizados.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 opacity-60">
                      <p className="truncate font-bold">{s.title}</p>
                      <p className="truncate text-xs text-white/50">{s.businesses?.name} · {s.total_viewers} espectadores</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {enVivo.length === 0 && proximos.length === 0 && finalizados.length === 0 && (
              <div className="sld-card mt-4 rounded-2xl px-6 py-10 text-center">
                <Sparkles className="mx-auto mb-3 h-7 w-7 text-orange-400" />
                <p className="font-bold">Todavía no hubo transmisiones en San Lorenzo.</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">¿Tenés un negocio? Sé el primero en transmitir en vivo.</p>
                <Link href="/dashboard/en-vivo" className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-bold text-white">Crear mi transmisión</Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
