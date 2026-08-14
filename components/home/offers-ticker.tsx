"use client";
import Link from "next/link";
import { useAllBusinesses } from "@/lib/use-businesses";

export default function OffersTicker() {
  const todos = useAllBusinesses();
  const hoy = new Date().toISOString().slice(0, 10);
  const activas = todos.flatMap((b: any) =>
    (Array.isArray(b.promotions) ? b.promotions : [])
      .filter((p: any) => p.title && (!p.expires || p.expires >= hoy))
      .map((p: any) => ({ ...p, negocio: b.name, slug: b.slug }))
  );
  if (activas.length === 0) return null;
  const items = [...activas, ...activas, ...activas];

  return (
    <div className="relative overflow-hidden border-y border-orange-400/20 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-orange-500/10 py-2.5">
      <div className="ticker flex gap-10 whitespace-nowrap px-4">
        {items.map((p: any, i: number) => (
          <Link key={i} href={`/negocio/${p.slug}`} className="flex items-center gap-2 text-xs font-bold text-white/80 transition hover:text-orange-300">
            <span className="animate-pulse">🔥</span>
            <span>{p.title}</span>
            <span className="text-white/40">· {p.negocio}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
