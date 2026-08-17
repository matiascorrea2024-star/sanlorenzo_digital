"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

function enHorario() {
  const h = new Date().getHours();
  return h >= 18 && h < 20;
}

export default function OfertaBomba() {
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [nivel, setNivel] = useState<number | null>(null);
  const [show, setShow] = useState(enHorario());
  const [loading, setLoading] = useState(enHorario());

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    (async () => {
      const sb = supabase();
      const { data } = await sb.from("offers_with_business")
        .select("*").eq("es_bomba", true).eq("active", true)
        .order("discount_percent", { ascending: false }).limit(3);
      setOfertas(data || []);

      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: pts } = await sb.rpc("nivel_usuario", { uid: user.id });
        setNivel(pts ?? 0);
      } else {
        setNivel(0);
      }
      setLoading(false);
    })();
    const t = setInterval(() => setShow(enHorario()), 60000);
    return () => clearInterval(t);
  }, [show]);

  // Reservamos el alto mientras carga (en vez de "null" hasta que
  // resuelva) para no generar un salto de layout grande cuando el
  // contenido aparece -- eso fue justamente lo que detectó Lighthouse
  // como el mayor causante de CLS en la home.
  if (!show) return null;
  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="h-[220px] animate-pulse rounded-3xl border border-[var(--line-strong)] bg-[var(--ov-05)] sm:h-[196px]" />
      </section>
    );
  }
  if (ofertas.length === 0) return null;

  const desbloqueado = nivel !== null && nivel >= 50;

  if (!desbloqueado) {
    // Panel bloqueado -- calco literal del mockup aprobado: candado
    // grande centrado, título editorial, CTA en píldora degradé.
    return (
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[calc(2.5rem-0.375rem)] border border-[var(--ov-05)] bg-[var(--card-inner)] px-8 py-16 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:px-20">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-600/10" />
            <Lock className="relative z-10 mb-8 h-16 w-16 text-[var(--ov-10)]" strokeWidth={1.5} />
            <h2 className="relative z-10 text-4xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Oferta Bomba</h2>
            <p className="relative z-10 mx-auto mt-4 max-w-xs text-sm text-[var(--muted2)]">
              Solo disponible para vecinos nivel 🚶 Explorador o más -- seguí negocios, dejá reseñas o compartí ofertas para desbloquearla.
            </p>
            <Link href="/perfil"
              className="relative z-10 mt-8 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90">
              Ver mi progreso
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-red-400/25 bg-[var(--ov-02)] p-1.5">
        <div className="relative rounded-[calc(2.5rem-0.375rem)] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-500/20 blur-3xl animate-pulse" />
          <div className="relative flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-400" />
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-red-300">Oferta bomba · termina 20hs</p>
          </div>
          <h2 className="relative mt-2 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>Solo por hoy, solo por 2 horas</h2>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            {ofertas.map((o: any) => (
              <Link key={o.id} href={`/oferta/${o.id}`} className="group rounded-2xl border border-[var(--line)] bg-[var(--ov-10)] p-4 transition hover:border-red-400/50">
                <p className="text-xs text-[var(--muted)]">{o.business_name}</p>
                <p className="mt-1 font-black group-hover:text-red-300">{o.title}</p>
                <div className="mt-2 flex items-end justify-between">
                  {o.offer_price && (
                    <p className="text-lg text-red-300" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>{fmt(Number(o.offer_price))}</p>
                  )}
                  {o.discount_percent && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-300">-{o.discount_percent}%</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
