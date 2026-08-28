"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import CategoryCover from "@/components/ui/category-cover";
import { hoyArgentina } from "@/lib/fecha-ar";

const DUR = 8000;
const SITE = "https://sanlorenzodigital.vercel.app";

function diasRestantes(validUntil?: string | null): number | null {
  if (!validUntil) return null;
  const ms = Date.parse(`${validUntil}T00:00:00Z`) - Date.parse(`${hoyArgentina()}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

export default function TvEscaparate({ negocio, ofertas }: { negocio: any; ofertas: any[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const [hora, setHora] = useState("--:--");
  // El QR viene de un servicio externo: si falla, se oculta solo el QR
  // y el escaparate sigue funcionando con la URL a la vista.
  const [qrOk, setQrOk] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const accRef = useRef(0);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = ofertas.map((o: any) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    image: o.image_url || negocio.portada_url || null,
    oldPrice: o.old_price ? Number(o.old_price) : null,
    price: o.offer_price ? Number(o.offer_price) : null,
    discount: o.discount_percent > 0 ? Number(o.discount_percent) : null,
    dias: diasRestantes(o.valid_until),
  }));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
    setHora(fmt());
    const id = setInterval(() => setHora(fmt()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) {
      if (barRef.current) barRef.current.style.width = "100%";
      return;
    }
    if (reduced) {
      if (barRef.current) barRef.current.style.width = "100%";
      const id = setTimeout(() => setIdx((i) => (i + 1) % slides.length), DUR);
      return () => clearTimeout(id);
    }
    if (paused) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(t: number) {
      accRef.current += t - last;
      last = t;
      const p = Math.min(1, accRef.current / DUR);
      if (barRef.current) barRef.current.style.width = `${p * 100}%`;
      if (p >= 1) {
        accRef.current = 0;
        setIdx((i) => (i + 1) % slides.length);
        return;
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [paused, reduced, idx, slides.length]);

  const wake = useCallback(() => {
    setUiVisible(true);
    if (hideT.current) clearTimeout(hideT.current);
    hideT.current = setTimeout(() => setUiVisible(false), 2600);
  }, []);

  useEffect(() => {
    wake();
    return () => {
      if (hideT.current) clearTimeout(hideT.current);
    };
  }, [wake]);

  const negocioUrl = `${SITE}/negocio/${negocio.slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(negocioUrl)}`;

  const logo = negocio.logo_url ? (
    <Image src={negocio.logo_url} alt={negocio.name} width={56} height={56} quality={90}
      className="h-12 w-12 rounded-xl border border-[var(--line-strong)] object-cover lg:h-14 lg:w-14" />
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] font-display text-2xl lg:h-14 lg:w-14">
      {(negocio.name || "?")[0]}
    </span>
  );

  return (
    <main onMouseMove={wake} className="relative h-dvh select-none overflow-hidden bg-[#0c0a0b] text-white">

      {slides.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
          {logo}
          <h1 className="max-w-4xl font-display text-5xl uppercase leading-none lg:text-8xl">
            {negocio.name} está en La Gran Barata
          </h1>
          <p className="font-tech text-lg text-white/60 lg:text-2xl">{SITE}/negocio/{negocio.slug}</p>
        </div>
      ) : (
        slides.map((s: any, i: number) => (
          <section key={s.id} aria-hidden={i !== idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${i === idx ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="absolute inset-0">
              {s.image ? (
                <Image src={s.image} alt={s.title} fill priority={i === 0} quality={90} sizes="100vw"
                  className="object-cover" />
              ) : (
                <CategoryCover category={negocio.category} seed={s.id} className="absolute inset-0 h-full w-full" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a0b] via-[#0c0a0b]/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a0b]/70 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-8 pb-28 lg:p-20 lg:pb-36">
              {s.discount !== null && (
                <span className="mb-4 w-fit animate-pulse rounded-2xl bg-[var(--accent)] px-5 py-2 font-display text-3xl leading-none text-white shadow-lg shadow-black/40 motion-reduce:animate-none lg:px-8 lg:py-3 lg:text-6xl">
                  -{s.discount}% OFF
                </span>
              )}
              <h2 className="max-w-[85%] font-display text-7xl uppercase leading-[.9] tracking-tight drop-shadow-2xl sm:text-8xl lg:text-9xl">
                {s.title}
              </h2>
              {s.description && (
                <p className="mt-4 max-w-2xl line-clamp-2 text-base text-white/75 lg:text-2xl">{s.description}</p>
              )}
              <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3">
                {s.price !== null && (
                  <p className="font-display text-8xl leading-none text-[var(--accent-ink)] drop-shadow-2xl lg:text-[11rem]">
                    ${s.price.toLocaleString("es-AR")}
                  </p>
                )}
                {s.oldPrice !== null && s.price !== null && s.oldPrice > s.price && (
                  <p className="pb-2 font-display text-4xl text-[var(--muted)] line-through decoration-[var(--muted)] lg:pb-6 lg:text-7xl">
                    ${s.oldPrice.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
              {s.dias !== null && (
                <p className={`mt-5 w-fit rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-widest lg:text-xl ${
                  s.dias === 0 ? "bg-red-500/20 text-[var(--bad)]" : "border border-[var(--line-strong)] text-white/80"}`}>
                  {s.dias === 0 ? "¡VENCE HOY!" : `Vence en ${s.dias} ${s.dias === 1 ? "día" : "días"}`}
                </p>
              )}
            </div>
          </section>
        ))
      )}

      {/* HEADER */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent p-5 lg:p-8">
        {logo}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.4em] text-white/50">LA GRAN BARATA · San Lorenzo</p>
          <p className="font-display text-xl uppercase leading-tight lg:text-3xl">{negocio.name}</p>
        </div>
        {slides.length > 1 && (
          <p className="ml-auto font-tech text-sm text-white/40 lg:text-lg">{idx + 1}/{slides.length}</p>
        )}
      </header>

      {/* CONTROLES OCULTOS */}
      <div className={`absolute right-5 top-5 z-40 flex items-center gap-2 transition-opacity duration-300 lg:right-8 lg:top-8 ${uiVisible || paused ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Reanudar" : "Pausar"}
          className="rounded-full border border-[var(--line-strong)] bg-black/60 p-3 backdrop-blur-md transition hover:bg-black/80">
          {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        <Link href={`/negocio/${negocio.slug}`} target="_blank" rel="noopener noreferrer"
          className="rounded-full border border-[var(--line-strong)] bg-black/60 px-4 py-2.5 font-tech text-xs uppercase tracking-widest backdrop-blur-md transition hover:bg-black/80">
          Salir
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-6 bg-gradient-to-t from-black/85 to-transparent p-5 pb-6 lg:p-10 lg:pb-10">
        <p className="font-tech text-4xl leading-none tabular-nums lg:text-7xl">{hora}</p>
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="text-right">
            <p className="font-tech text-xs text-white/80 sm:text-sm lg:text-base">{SITE}/negocio/{negocio.slug}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[.25em] text-white/40 lg:text-xs">Escaneá y mirá las ofertas en tu celular</p>
          </div>
          {qrOk && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrSrc} alt={`QR hacia ${negocio.name}`} onError={() => setQrOk(false)} className="h-20 w-20 rounded-lg bg-white p-1.5 lg:h-24 lg:w-24" />
          )}
        </div>
      </footer>

      {/* PROGRESO DEL SLIDE */}
      <div className="absolute inset-x-0 bottom-0 z-40 h-1 bg-[var(--ov-10)]">
        <div ref={barRef} style={{ width: "0%" }} className="h-full bg-[var(--accent)]" />
      </div>
    </main>
  );
}
