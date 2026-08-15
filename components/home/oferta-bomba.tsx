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
        <div className="h-[220px] animate-pulse rounded-3xl border border-white/10 bg-white/5 sm:h-[196px]" />
      </section>
    );
  }
  if (ofertas.length === 0) return null;

  const desbloqueado = nivel !== null && nivel >= 50;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-red-400/40 bg-gradient-to-br from-red-950/60 via-[#1a0a0a] to-orange-950/40 p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-500/20 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-400" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Oferta bomba · termina 20hs</p>
        </div>
        <h2 className="relative mt-2 text-2xl font-black sm:text-3xl">💣 Solo por hoy, solo por 2 horas</h2>

        {!desbloqueado ? (
          <div className="relative mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-6">
            <Lock className="h-8 w-8 shrink-0 text-white/40" />
            <div>
              <p className="font-bold">Exclusivo para vecinos nivel 🚶 Explorador o más</p>
              <p className="mt-1 text-sm text-white/50">Seguí negocios, dejá reseñas o compartí ofertas para desbloquearla.</p>
              <Link href="/perfil" className="mt-2 inline-block text-sm font-bold text-orange-400 hover:text-orange-300">Ver mi progreso →</Link>
            </div>
          </div>
        ) : (
          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            {ofertas.map((o: any) => (
              <Link key={o.id} href={`/oferta/${o.id}`} className="group rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-red-400/50">
                <p className="text-xs text-white/50">{o.business_name}</p>
                <p className="mt-1 font-black group-hover:text-red-300">{o.title}</p>
                <div className="mt-2 flex items-end justify-between">
                  {o.offer_price && <p className="text-lg font-black text-red-300">{fmt(Number(o.offer_price))}</p>}
                  {o.discount_percent && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-300">-{o.discount_percent}%</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
