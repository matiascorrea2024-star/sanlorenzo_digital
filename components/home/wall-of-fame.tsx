import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { rangoDe, gemaDe } from "@/lib/ranks";

type Top = { id: string; name: string; slug: string; category: string; logo_url: string | null; puntos: number };

// Recibe los datos ya resueltos del servidor (app/page.tsx) -- antes
// este componente hacía su propio fetch al montarse y arrancaba en
// null, lo que generaba un salto de layout grande (CLS) apenas la
// data llegaba y la sección entera aparecía de golpe.
export default function WallOfFame({ initialTop }: { initialTop: Top[] }) {
  const top = initialTop;

  if (top.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Salón de la fama</h2>
        <span className="text-xs text-white/40">· los negocios mejor rankeados de San Lorenzo</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {top.map((b, i) => {
          const r = rangoDe(b.puntos);
          const gema = gemaDe(b.category);
          return (
            <Link key={b.id} href={`/negocio/${b.slug}`}
              className="group relative flex w-40 shrink-0 flex-col items-center gap-2 rounded-2xl border p-4 transition hover:-translate-y-1"
              style={{ borderColor: `${r.accent}55`, background: `linear-gradient(180deg, ${r.accent}14, transparent)` }}>
              <span className="absolute left-2 top-2 text-xs font-black text-white/30">#{i + 1}</span>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2"
                style={{ borderColor: r.accent, boxShadow: `0 0 16px ${r.accent}55` }}>
                {b.logo_url ? (
                  <Image src={b.logo_url} alt={b.name} fill sizes="64px" quality={90} className="rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-black" style={{ color: r.accent }}>{b.name[0]}</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" className="absolute -bottom-1 -right-1" style={{ filter: `drop-shadow(0 0 3px ${gema})` }}>
                  <polygon points="12,2 20,8 17,21 7,21 4,8" fill={gema} stroke="#0c0a0b" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="line-clamp-1 text-center text-xs font-bold">{b.name}</p>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: r.accent }}>{r.rango}{r.tier && ` ${r.tier}`}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
