"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap } from "lucide-react";
import CategoryCover from "@/components/ui/category-cover";
import CountdownTimer from "@/components/ui/countdown-timer";
import { hoyArgentina } from "@/lib/fecha-ar";

// Mismo shape que el type Oferta de home-client (subset usado acá).
type Oferta = {
  id: string;
  negocio: string;
  slug: string;
  producto: string;
  cat: string;
  vence?: string;
  descuento?: number;
  antes?: number;
  ahora?: number;
  portada_url?: string;
};

// Contra la fecha de Argentina, no contra el reloj del dispositivo:
// igual que el resto del código que compara con valid_until.
const esHoy = (vence: string) => vence === hoyArgentina();

export default function OfertasBomba({ ofertas }: { ofertas: Oferta[] }) {
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const swipePendiente = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || pausado || ofertas.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ofertas.length), 6000);
    return () => clearInterval(t);
  }, [reduceMotion, pausado, ofertas.length]);

  useEffect(() => {
    if (idx >= ofertas.length) setIdx(0);
  }, [idx, ofertas.length]);

  if (ofertas.length < 2) return null;

  const irA = (i: number) => setIdx(Math.max(0, Math.min(ofertas.length - 1, i)));

  return (
    <section className="px-4 pt-12 sm:px-6 md:pt-16" aria-labelledby="bomba-title">
      <div className="mx-auto max-w-[1700px]">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          <Zap className="h-3.5 w-3.5" /> Vencen pronto
        </p>
        <h2 id="bomba-title" className="mt-3 font-display text-3xl uppercase leading-[0.9] tracking-tight text-[var(--text)] sm:text-5xl">
          Ofertas bomba <span className="text-[var(--accent-ink)]">de hoy.</span>
        </h2>

        <div
          className="relative mt-8 overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface)]"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) < 40) return;
            swipePendiente.current = true;
            irA(idx + (dx < 0 ? 1 : -1));
          }}
          onClickCapture={(e) => {
            // Un swipe no debe navegar al hacer tap sobre el slide.
            if (!swipePendiente.current) return;
            e.preventDefault();
            e.stopPropagation();
            swipePendiente.current = false;
          }}
        >
          <div
            className={`flex ${reduceMotion ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)]"}`}
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {ofertas.map((o) => (
              <Link
                key={o.id}
                href={`/oferta/${o.id}`}
                aria-hidden={ofertas[idx].id !== o.id}
                tabIndex={ofertas[idx].id === o.id ? 0 : -1}
                className="group relative block w-full shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
                  {o.portada_url ? (
                    <Image
                      src={o.portada_url}
                      alt={`${o.producto} — ${o.negocio}`}
                      fill
                      quality={90}
                      sizes="100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <CategoryCover category={o.cat} seed={o.id} className="h-full w-full transition duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {typeof o.descuento === "number" && o.descuento > 0 && (
                    <span
                      className="absolute left-4 top-4 animate-pulse rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-2xl sm:left-6 sm:top-6"
                      style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}
                    >
                      -{o.descuento}% OFF
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8 lg:p-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>{o.negocio}</p>
                    <h3 className="line-clamp-2 max-w-4xl font-display text-3xl uppercase leading-[0.9] tracking-tight text-white transition-colors group-hover:text-[var(--accent-ink)] sm:text-5xl lg:text-6xl">
                      {o.producto}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {typeof o.ahora === "number" && (
                        <span className="font-display text-3xl leading-none text-[var(--accent-ink)] sm:text-4xl lg:text-5xl">${o.ahora.toLocaleString("es-AR")}</span>
                      )}
                      {typeof o.antes === "number" && typeof o.ahora === "number" && (
                        <span className="text-sm font-bold text-[var(--muted)] line-through decoration-2 sm:text-base">${o.antes.toLocaleString("es-AR")}</span>
                      )}
                      {o.vence && esHoy(o.vence) && <CountdownTimer expiresAt={o.vence} compact />}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="absolute bottom-4 right-4 z-20 flex gap-1.5 sm:bottom-6 sm:right-6">
            {ofertas.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ir a la oferta ${i + 1}: ${o.producto}`}
                aria-current={i === idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-6 bg-[var(--accent)]" : "w-2 bg-white/30 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
