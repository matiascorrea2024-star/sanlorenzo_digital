"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { hoyArgentina } from "@/lib/fecha-ar";

type TickerItem = { id: string; label: string; sub: string; href: string; emoji: string };

const EXTRAS: TickerItem[] = [
  { id: "x1", label: "Publicá tu oferta gratis", sub: "para comercios", href: "/para-negocios", emoji: "🏪" },
  { id: "x2", label: "Ranking de negocios de San Lorenzo", sub: "votado por vecinos", href: "/ranking", emoji: "🏆" },
  { id: "x3", label: "Mapa de la ciudad", sub: "negocios cerca tuyo", href: "/mapa", emoji: "📍" },
  { id: "x4", label: "Ofertas que terminan hoy", sub: "corré antes de que venzan", href: "/#ofertas", emoji: "⏰" },
  { id: "x5", label: "¿Qué está pasando hoy en la ciudad?", sub: "el pulso comercial de San Lorenzo", href: "/pulso", emoji: "📊" },
];

export default function OffersTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase()
          .from("offers_with_business")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12);
        const hoy = hoyArgentina();
        const reales: TickerItem[] = ((data as any[]) || [])
          .filter((o) => o.active && (!o.valid_until || o.valid_until >= hoy))
          .map((o) => ({
            id: String(o.id),
            label: o.title,
            sub: o.business_name,
            href: "/oferta/" + o.id,
            emoji: "🔥",
          }));
        const pool = [...reales];
        for (const e of EXTRAS) {
          if (pool.length < 5) pool.push(e);
        }
        setItems(pool.length > 0 ? pool : EXTRAS);
      } catch {
        setItems(EXTRAS);
      }
    })();
  }, []);

  // Triplicado para el loop infinito sin costuras del CSS -- si el
  // usuario pidió reduce-motion, la animación se apaga (ver globals.css)
  // y se muestra una sola vuelta deslizable a mano, sin repetir.
  const loop = reduceMotion ? items : [...items, ...items, ...items];

  return (
    <div className="ticker-wrap relative overflow-hidden border-y border-[var(--ov-06)] bg-[var(--ov-02)] py-6 sm:py-8">
      <div className="ticker flex gap-16 whitespace-nowrap px-4 sm:gap-20">
        {loop.map((p, i) => (
          <Link
            key={p.id + "-" + i}
            href={p.href}
            className="flex items-center gap-4 text-sm font-black uppercase tracking-[0.3em] text-[var(--muted2)] transition hover:text-orange-500"
          >
            <span className="text-orange-500">{String((i % items.length) + 1).padStart(2, "0")}</span>
            <span>{p.label}</span>
            <span>· {p.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
