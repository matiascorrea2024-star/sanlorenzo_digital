"use client";
import { useEffect, useMemo, useState } from "react";
import { Clock, Flame, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import OfferCard from "@/components/ui/offer-card";
import Badge from "@/components/ui/badge";
import VotoDelDia from "@/components/home/voto-del-dia";

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate.getTime() - now);
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl bg-black/60 border border-red-400/30 px-3 py-2 min-w-[60px] text-center">
        <p className="text-2xl md:text-3xl font-black text-white tabular-nums">{String(value).padStart(2, "0")}</p>
      </div>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
    </div>
  );
}

export default function RadarPage({ initial = [] }: { initial?: any[] }) {
  const [ofertas, setOfertas] = useState<any[]>(initial || []);
  const [loading, setLoading] = useState(true);
  // useMemo: la fecha debe ser ESTABLE entre renders (si no, loop infinito)
  const finDia = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);
  const { h, m, s } = useCountdown(finDia);

  useEffect(() => {
    (async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const { data } = await supabase().from("offers_with_business")
        .select("*").eq("active", true).eq("valid_until", hoy)
        .order("created_at", { ascending: false });

      const reales = (data || []).map((o: any) => ({
        id: o.id, negocio: o.business_name, slug: o.business_slug,
        producto: o.title, cat: o.business_category || "",
        vence: o.valid_until, descuento: o.discount_percent,
        antes: o.old_price ? Number(o.old_price) : undefined,
        ahora: o.offer_price ? Number(o.offer_price) : undefined,
        portada_url: o.business_portada,
      }));

      setOfertas(reales);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      {/* Hero del Radar */}
      <section className="relative overflow-hidden border-b border-red-400/20 bg-gradient-to-br from-red-900/30 via-[#0a0710] to-orange-900/30 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.15),_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge variant="danger" size="md" pulse>
            <Zap className="h-3 w-3" /> Terminan HOY
          </Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Radar de{" "}
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              ofertas urgentes
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Solo ofertas que vencen hoy. Después de la medianoche desaparecen.
          </p>

          {/* Countdown */}
          <div className="mt-8 flex justify-center gap-3 md:gap-6">
            <CountdownBlock value={h} label="Horas" />
            <span className="text-3xl font-black text-white/30 self-start mt-3">:</span>
            <CountdownBlock value={m} label="Minutos" />
            <span className="text-3xl font-black text-white/30 self-start mt-3">:</span>
            <CountdownBlock value={s} label="Segundos" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : ofertas.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <Flame className="mx-auto h-12 w-12 text-white/30 mb-3" />
            <p className="text-lg font-bold">No hay ofertas que terminen hoy</p>
            <p className="mt-2 text-sm text-white/50">Volvé mañana o mirá todas las ofertas activas.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black">
                <Flame className="inline h-5 w-5 text-orange-400 mr-2" />
                {ofertas.length} oferta{ofertas.length !== 1 ? "s" : ""} que vence{ofertas.length !== 1 ? "n" : ""} hoy
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ofertas.map((o) => <OfferCard key={o.id} o={o} />)}
            </div>
          </>
        )}
      </div>
      <VotoDelDia />
    </main>
  );
}
